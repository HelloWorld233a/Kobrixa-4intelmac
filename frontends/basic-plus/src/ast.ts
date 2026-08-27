import type { SourceSpan } from "@kobrixa/ir";

export type Expression =
  | { kind: "literal"; value: number | string | boolean; span: SourceSpan }
  | { kind: "name"; name: string; span: SourceSpan }
  | { kind: "unary"; operator: "-" | "not"; value: Expression; span: SourceSpan }
  | {
      kind: "binary";
      operator: "+" | "-" | "*" | "/" | "%" | "=" | "<>" | "<" | "<=" | ">" | ">=" | "and" | "or";
      left: Expression;
      right: Expression;
      span: SourceSpan;
    }
  | { kind: "call"; name: string; args: Expression[]; span: SourceSpan };

export type Statement =
  | { kind: "assign"; name: string; value: Expression; span: SourceSpan }
  | { kind: "call"; call: Extract<Expression, { kind: "call" }>; span: SourceSpan }
  | {
      kind: "if";
      branches: Array<{ condition: Expression; body: Statement[] }>;
      otherwise: Statement[];
      span: SourceSpan;
    }
  | { kind: "while"; condition: Expression; body: Statement[]; span: SourceSpan }
  | {
      kind: "for";
      variable: string;
      start: Expression;
      end: Expression;
      step: Expression;
      body: Statement[];
      span: SourceSpan;
    }
  | { kind: "return"; value?: Expression; span: SourceSpan }
  | { kind: "goto"; label: string; span: SourceSpan }
  | { kind: "label"; label: string; span: SourceSpan }
  | { kind: "property"; name: string; span: SourceSpan };

export interface FunctionDeclaration {
  kind: "sub" | "function";
  name: string;
  parameters: string[];
  body: Statement[];
  span: SourceSpan;
}

export interface ParsedFile {
  file: string;
  includes: Array<{ path: string; span: SourceSpan }>;
  body: Statement[];
  functions: FunctionDeclaration[];
}
