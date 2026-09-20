import path from "node:path";
import type {
  Diagnostic,
  FrontendResult,
  LanguageFrontend,
  SourceProject,
} from "@kobrixa/compiler";
import type { FunctionDeclaration, ParsedFile, Statement } from "./ast.js";
import { lowerProgram } from "./lower.js";
import { parse } from "./parser.js";

function includeDiagnostic(
  code: string,
  message: string,
  include: ParsedFile["includes"][number],
): Diagnostic {
  return {
    code,
    severity: "error",
    file: include.span.file,
    range: {
      startLine: include.span.start.line,
      startColumn: include.span.start.column,
      endLine: include.span.end.line,
      endColumn: include.span.end.column,
    },
    message,
  };
}

export class BasicPlusFrontend implements LanguageFrontend {
  readonly id = "bp" as const;

  async compile(input: SourceProject, signal: AbortSignal): Promise<FrontendResult> {
    signal.throwIfAborted();
    const diagnostics: Diagnostic[] = [];
    const parsed = new Map<string, ParsedFile>();
    const parsedByCaseInsensitivePath = new Map<string, string>();
    for (const source of input.sources) {
      signal.throwIfAborted();
      const key = source.path.replaceAll("\\", "/");
      const result = parse(key, source.content);
      parsed.set(key, result.parsed);
      parsedByCaseInsensitivePath.set(key.toLocaleLowerCase("en-US"), key);
      diagnostics.push(...result.diagnostics);
    }
    const entry = input.manifest.entry.replaceAll("\\", "/");
    const rootFile = parsed.get(entry);
    if (!rootFile) {
      diagnostics.push({
        code: "BP1000",
        severity: "error",
        file: entry,
        range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
        message: "Entry source was not loaded.",
      });
      return { diagnostics };
    }

    const body: Statement[] = [];
    const functions: FunctionDeclaration[] = [];
    const visited = new Set<string>();
    const active = new Set<string>();
    const visit = (file: ParsedFile): void => {
      if (visited.has(file.file)) return;
      active.add(file.file);
      for (const include of file.includes) {
        const includePathText = include.path.replaceAll("\\", "/");
        const requestedPath = path.posix.normalize(
          path.posix.join(path.posix.dirname(file.file), includePathText),
        );
        if (
          requestedPath === ".." ||
          requestedPath.startsWith("../") ||
          path.posix.isAbsolute(requestedPath)
        ) {
          diagnostics.push(
            includeDiagnostic("BP1101", "Include path escapes the project root.", include),
          );
          continue;
        }
        const candidates = path.posix.extname(requestedPath)
          ? [requestedPath]
          : [`${requestedPath}.${include.kind === "import" ? "bpm" : "bpi"}`, requestedPath];
        const includePath =
          candidates.find((candidate) => parsed.has(candidate)) ??
          candidates
            .map((candidate) =>
              parsedByCaseInsensitivePath.get(candidate.toLocaleLowerCase("en-US")),
            )
            .find((candidate): candidate is string => candidate !== undefined) ??
          candidates[0]!;
        if (active.has(includePath)) {
          // Clev3r treats an import already being processed as a no-op.  This
          // is used by its module templates, including a module importing its
          // own public declarations.
          continue;
        }
        const included = parsed.get(includePath);
        if (!included) {
          diagnostics.push(
            includeDiagnostic("BP1100", `Included file '${includePath}' was not found.`, include),
          );
          continue;
        }
        visit(included);
      }
      active.delete(file.file);
      visited.add(file.file);
      body.push(...file.body);
      functions.push(...file.functions);
    };
    visit(rootFile);
    if (diagnostics.some((item) => item.severity === "error")) return { diagnostics };
    const lowered = lowerProgram(input.manifest.name, body, functions, [...visited]);
    if (rootFile.runtimeDirectory) lowered.ir.program.runtimeDirectory = rootFile.runtimeDirectory;
    diagnostics.push(...lowered.diagnostics);
    return diagnostics.some((item) => item.severity === "error")
      ? { diagnostics }
      : { ir: lowered.ir, diagnostics };
  }
}
