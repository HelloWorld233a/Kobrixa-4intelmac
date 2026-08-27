import type { Diagnostic } from "@kobrixa/compiler";
import type { SourceSpan } from "@kobrixa/ir";

export type TokenKind =
  "identifier" | "number" | "string" | "operator" | "punctuation" | "newline" | "eof";

export interface Token {
  kind: TokenKind;
  text: string;
  value?: string | number;
  span: SourceSpan;
}

function makeSpan(
  file: string,
  line: number,
  column: number,
  offset: number,
  length: number,
): SourceSpan {
  return {
    file,
    start: { line, column, offset },
    end: { line, column: column + Math.max(length, 1), offset: offset + length },
  };
}

function diag(code: string, message: string, span: SourceSpan): Diagnostic {
  return {
    code,
    severity: "error",
    file: span.file,
    range: {
      startLine: span.start.line,
      startColumn: span.start.column,
      endLine: span.end.line,
      endColumn: span.end.column,
    },
    message,
  };
}

export function lex(file: string, source: string): { tokens: Token[]; diagnostics: Diagnostic[] } {
  const tokens: Token[] = [];
  const diagnostics: Diagnostic[] = [];
  let offset = 0;
  let line = 1;
  let column = 1;

  const advance = (count = 1): void => {
    for (let index = 0; index < count; index += 1) {
      if (source[offset] === "\n") {
        line += 1;
        column = 1;
      } else column += 1;
      offset += 1;
    }
  };

  if (source.charCodeAt(0) === 0xfeff) advance();
  while (offset < source.length) {
    const char = source[offset] ?? "";
    if (char === " " || char === "\t" || char === "\r") {
      advance();
      continue;
    }
    if (char === "\n") {
      const span = makeSpan(file, line, column, offset, 1);
      tokens.push({ kind: "newline", text: "\n", span });
      advance();
      continue;
    }
    if (char === "'") {
      while (offset < source.length && source[offset] !== "\n") advance();
      continue;
    }
    const startOffset = offset;
    const startLine = line;
    const startColumn = column;
    if (/[A-Za-z_]/.test(char)) {
      while (offset < source.length && /[A-Za-z0-9_.]/.test(source[offset] ?? "")) advance();
      const text = source.slice(startOffset, offset);
      tokens.push({
        kind: "identifier",
        text,
        value: text,
        span: makeSpan(file, startLine, startColumn, startOffset, text.length),
      });
      continue;
    }
    if (/\d/.test(char) || (char === "." && /\d/.test(source[offset + 1] ?? ""))) {
      while (offset < source.length && /[0-9.]/.test(source[offset] ?? "")) advance();
      const text = source.slice(startOffset, offset);
      const value = Number(text);
      const span = makeSpan(file, startLine, startColumn, startOffset, text.length);
      if (!Number.isFinite(value) || (text.match(/\./g)?.length ?? 0) > 1)
        diagnostics.push(diag("BP1002", `Invalid number '${text}'.`, span));
      tokens.push({ kind: "number", text, value, span });
      continue;
    }
    if (char === '"') {
      advance();
      let value = "";
      let closed = false;
      while (offset < source.length && source[offset] !== "\n") {
        if (source[offset] === '"') {
          if (source[offset + 1] === '"') {
            value += '"';
            advance(2);
            continue;
          }
          advance();
          closed = true;
          break;
        }
        value += source[offset];
        advance();
      }
      const text = source.slice(startOffset, offset);
      const span = makeSpan(file, startLine, startColumn, startOffset, text.length);
      if (!closed) diagnostics.push(diag("BP1003", "Unterminated string literal.", span));
      tokens.push({ kind: "string", text, value, span });
      continue;
    }
    const pair = source.slice(offset, offset + 2);
    if (["<=", ">=", "<>"].includes(pair)) {
      tokens.push({
        kind: "operator",
        text: pair,
        span: makeSpan(file, startLine, startColumn, startOffset, 2),
      });
      advance(2);
      continue;
    }
    if ("+-*/%=<>".includes(char)) {
      tokens.push({
        kind: "operator",
        text: char,
        span: makeSpan(file, startLine, startColumn, startOffset, 1),
      });
      advance();
      continue;
    }
    if ("(),:".includes(char)) {
      tokens.push({
        kind: "punctuation",
        text: char,
        span: makeSpan(file, startLine, startColumn, startOffset, 1),
      });
      advance();
      continue;
    }
    const span = makeSpan(file, startLine, startColumn, startOffset, 1);
    diagnostics.push(diag("BP1001", `Unexpected character '${char}'.`, span));
    advance();
  }
  const eofSpan = makeSpan(file, line, column, offset, 0);
  tokens.push({ kind: "eof", text: "", span: eofSpan });
  return { tokens, diagnostics };
}
