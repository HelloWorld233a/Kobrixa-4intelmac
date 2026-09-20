export interface SourcePosition {
  line: number;
  column: number;
  offset: number;
}

export interface SourceSpan {
  file: string;
  start: SourcePosition;
  end: SourcePosition;
}

export type IRPrimitiveType = "number" | "integer" | "boolean" | "string" | "void";

export type IRType =
  { kind: IRPrimitiveType } | { kind: "array"; element: Exclude<IRPrimitiveType, "void"> };

export interface IRVariable {
  name: string;
  type: IRType;
  scope: "global" | "local" | "parameter" | "temporary";
  direction?: "in" | "out";
  span?: SourceSpan;
}

export type IRLiteral =
  | { kind: "number"; value: number }
  | { kind: "integer"; value: number }
  | { kind: "boolean"; value: boolean }
  | { kind: "string"; value: string };

export type IRValue = IRLiteral | { kind: "variable"; name: string };

export type IRInstruction =
  | { op: "assign"; target: string; value: IRValue; span?: SourceSpan }
  | {
      op: "binary";
      target: string;
      operator: "+" | "-" | "*" | "/" | "%" | "=" | "<>" | "<" | "<=" | ">" | ">=" | "and" | "or";
      left: IRValue;
      right: IRValue;
      span?: SourceSpan;
    }
  | { op: "unary"; target: string; operator: "-" | "not"; value: IRValue; span?: SourceSpan }
  | { op: "call"; target?: string; functionName: string; args: IRValue[]; span?: SourceSpan }
  | { op: "thread-start"; functionName: string; span?: SourceSpan }
  | { op: "ev3-call"; target?: string; operation: string; args: IRValue[]; span?: SourceSpan };

export type IRTerminator =
  | { op: "jump"; target: string; span?: SourceSpan }
  | { op: "branch"; condition: IRValue; whenTrue: string; whenFalse: string; span?: SourceSpan }
  | { op: "return"; value?: IRValue; span?: SourceSpan }
  | { op: "stop"; span?: SourceSpan };

export interface IRBasicBlock {
  id: string;
  instructions: IRInstruction[];
  terminator: IRTerminator;
  span?: SourceSpan;
}

export interface IRFunction {
  name: string;
  parameters: IRVariable[];
  returnType: IRType;
  locals: IRVariable[];
  entryBlock: string;
  blocks: IRBasicBlock[];
  span?: SourceSpan;
}

export interface IRResource {
  id: string;
  sourcePath: string;
  targetPath: string;
  sha256?: string;
  span?: SourceSpan;
}

export interface KobrixaIR {
  version: 1;
  program: {
    name: string;
    entryFunction: string;
    runtimeDirectory?: string;
  };
  globals: IRVariable[];
  functions: IRFunction[];
  resources: IRResource[];
  sourceFiles: string[];
}

export interface IRValidationIssue {
  code: string;
  message: string;
  span?: SourceSpan;
}
