import type { Diagnostic, SourceRange } from "./contracts.js";
import type { SourceSpan } from "@kobrixa/ir";

export const ZERO_RANGE: SourceRange = {
  startLine: 1,
  startColumn: 1,
  endLine: 1,
  endColumn: 1,
};

export function diagnostic(
  code: string,
  message: string,
  file = "kobrixa.json",
  range: SourceRange = ZERO_RANGE,
  severity: Diagnostic["severity"] = "error",
): Diagnostic {
  return { code, severity, file, range, message };
}

export function diagnosticFromSpan(code: string, message: string, span?: SourceSpan): Diagnostic {
  return diagnostic(
    code,
    message,
    span?.file ?? "<generated>",
    span
      ? {
          startLine: span.start.line,
          startColumn: span.start.column,
          endLine: span.end.line,
          endColumn: span.end.column,
        }
      : ZERO_RANGE,
  );
}
