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
    for (const source of input.sources) {
      signal.throwIfAborted();
      const key = source.path.replaceAll("\\", "/");
      const result = parse(key, source.content);
      parsed.set(key, result.parsed);
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
        const includePath = path.posix.normalize(
          path.posix.join(path.posix.dirname(file.file), include.path),
        );
        if (
          includePath === ".." ||
          includePath.startsWith("../") ||
          path.posix.isAbsolute(includePath)
        ) {
          diagnostics.push(
            includeDiagnostic("BP1101", "Include path escapes the project root.", include),
          );
          continue;
        }
        if (active.has(includePath)) {
          diagnostics.push(
            includeDiagnostic("BP1102", `Include cycle detected at '${includePath}'.`, include),
          );
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
    diagnostics.push(...lowered.diagnostics);
    return diagnostics.some((item) => item.severity === "error")
      ? { diagnostics }
      : { ir: lowered.ir, diagnostics };
  }
}
