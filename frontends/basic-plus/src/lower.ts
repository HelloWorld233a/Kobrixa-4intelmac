import type { Diagnostic } from "@kobrixa/compiler";
import {
  getEV3Operation,
  type IRBasicBlock,
  type IRFunction,
  type IRInstruction,
  type IRPrimitiveType,
  type IRTerminator,
  type IRType,
  type IRValue,
  type IRVariable,
  type KobrixaIR,
  type SourceSpan,
} from "@kobrixa/ir";
import type { Expression, FunctionDeclaration, Statement } from "./ast.js";

interface LoweredValue {
  value: IRValue;
  type: IRType;
}

function canonical(name: string): string {
  return name.toLocaleLowerCase("en-US");
}

function toDiagnostic(code: string, message: string, span: SourceSpan): Diagnostic {
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

class FunctionBuilder {
  readonly blocks: IRBasicBlock[] = [];
  readonly variables = new Map<string, IRVariable>();
  readonly diagnostics: Diagnostic[] = [];
  #current: IRBasicBlock;
  #blockCounter = 0;
  #temporaryCounter = 0;
  #terminated = false;
  readonly #knownFunctions: ReadonlyMap<string, FunctionDeclaration>;

  constructor(
    readonly name: string,
    parameters: string[],
    readonly returnType: IRType,
    knownFunctions: ReadonlyMap<string, FunctionDeclaration>,
  ) {
    this.#knownFunctions = knownFunctions;
    for (const parameter of parameters)
      this.addVariable(parameter, { kind: "number" }, "parameter");
    this.#current = this.createBlock("entry");
  }

  compile(statements: Statement[]): IRFunction {
    this.compileStatements(statements);
    if (!this.#terminated)
      this.terminate(
        this.returnType.kind === "void"
          ? { op: "return" }
          : { op: "return", value: { kind: "number", value: 0 } },
      );
    const parameters = [...this.variables.values()].filter(
      (variable) => variable.scope === "parameter",
    );
    const locals = [...this.variables.values()].filter(
      (variable) => variable.scope !== "parameter",
    );
    return {
      name: this.name,
      parameters,
      returnType: this.returnType,
      locals,
      entryBlock: "entry",
      blocks: this.blocks,
    };
  }

  private compileStatements(statements: Statement[]): void {
    for (const statement of statements) {
      if (this.#terminated && statement.kind !== "label")
        this.switchTo(this.createBlock("unreachable"));
      switch (statement.kind) {
        case "assign": {
          const value = this.lowerExpression(statement.value);
          const variable = this.ensureVariable(statement.name, value.type, statement.span);
          if (!this.assignable(variable.type, value.type)) {
            this.diagnostics.push(
              toDiagnostic(
                "BP2002",
                `Cannot assign ${value.type.kind} to ${variable.type.kind}.`,
                statement.span,
              ),
            );
          }
          this.emit({
            op: "assign",
            target: variable.name,
            value: value.value,
            span: statement.span,
          });
          break;
        }
        case "call":
          this.lowerCall(statement.call, false);
          break;
        case "property":
          this.ensureVariable(statement.name, { kind: "number" }, statement.span);
          break;
        case "return": {
          const value = statement.value ? this.lowerExpression(statement.value).value : undefined;
          this.terminate(
            value
              ? { op: "return", value, span: statement.span }
              : { op: "return", span: statement.span },
          );
          break;
        }
        case "goto":
          this.terminate({
            op: "jump",
            target: this.labelId(statement.label),
            span: statement.span,
          });
          break;
        case "label": {
          const block = this.getOrCreateLabel(statement.label);
          if (!this.#terminated && this.#current !== block)
            this.terminate({ op: "jump", target: block.id, span: statement.span });
          this.switchTo(block);
          break;
        }
        case "if":
          this.compileIf(statement);
          break;
        case "while":
          this.compileWhile(statement);
          break;
        case "for":
          this.compileFor(statement);
          break;
      }
    }
  }

  private compileIf(statement: Extract<Statement, { kind: "if" }>): void {
    const merge = this.createBlock("if_end");
    for (const branch of statement.branches) {
      const body = this.createBlock("if_body");
      const next = this.createBlock("if_next");
      const condition = this.lowerExpression(branch.condition);
      this.terminate({
        op: "branch",
        condition: condition.value,
        whenTrue: body.id,
        whenFalse: next.id,
        span: branch.condition.span,
      });
      this.switchTo(body);
      this.compileStatements(branch.body);
      if (!this.#terminated) this.terminate({ op: "jump", target: merge.id, span: statement.span });
      this.switchTo(next);
    }
    this.compileStatements(statement.otherwise);
    if (!this.#terminated) this.terminate({ op: "jump", target: merge.id, span: statement.span });
    this.switchTo(merge);
  }

  private compileWhile(statement: Extract<Statement, { kind: "while" }>): void {
    const conditionBlock = this.createBlock("while_condition");
    const body = this.createBlock("while_body");
    const end = this.createBlock("while_end");
    this.terminate({ op: "jump", target: conditionBlock.id, span: statement.span });
    this.switchTo(conditionBlock);
    const condition = this.lowerExpression(statement.condition);
    this.terminate({
      op: "branch",
      condition: condition.value,
      whenTrue: body.id,
      whenFalse: end.id,
      span: statement.condition.span,
    });
    this.switchTo(body);
    this.compileStatements(statement.body);
    if (!this.#terminated)
      this.terminate({ op: "jump", target: conditionBlock.id, span: statement.span });
    this.switchTo(end);
  }

  private compileFor(statement: Extract<Statement, { kind: "for" }>): void {
    const initial = this.lowerExpression(statement.start);
    const variable = this.ensureVariable(statement.variable, { kind: "number" }, statement.span);
    this.emit({ op: "assign", target: variable.name, value: initial.value, span: statement.span });
    const conditionBlock = this.createBlock("for_condition");
    const body = this.createBlock("for_body");
    const end = this.createBlock("for_end");
    this.terminate({ op: "jump", target: conditionBlock.id, span: statement.span });
    this.switchTo(conditionBlock);
    const limit = this.lowerExpression(statement.end);
    const comparison = this.newTemporary({ kind: "boolean" }, statement.span);
    this.emit({
      op: "binary",
      target: comparison.name,
      operator: "<=",
      left: { kind: "variable", name: variable.name },
      right: limit.value,
      span: statement.span,
    });
    this.terminate({
      op: "branch",
      condition: { kind: "variable", name: comparison.name },
      whenTrue: body.id,
      whenFalse: end.id,
      span: statement.span,
    });
    this.switchTo(body);
    this.compileStatements(statement.body);
    if (!this.#terminated) {
      const step = this.lowerExpression(statement.step);
      const updated = this.newTemporary({ kind: "number" }, statement.span);
      this.emit({
        op: "binary",
        target: updated.name,
        operator: "+",
        left: { kind: "variable", name: variable.name },
        right: step.value,
        span: statement.span,
      });
      this.emit({
        op: "assign",
        target: variable.name,
        value: { kind: "variable", name: updated.name },
        span: statement.span,
      });
      this.terminate({ op: "jump", target: conditionBlock.id, span: statement.span });
    }
    this.switchTo(end);
  }

  private lowerExpression(expression: Expression): LoweredValue {
    switch (expression.kind) {
      case "literal": {
        if (typeof expression.value === "boolean")
          return { value: { kind: "boolean", value: expression.value }, type: { kind: "boolean" } };
        if (typeof expression.value === "string")
          return { value: { kind: "string", value: expression.value }, type: { kind: "string" } };
        return { value: { kind: "number", value: expression.value }, type: { kind: "number" } };
      }
      case "name": {
        const variable = this.ensureVariable(expression.name, { kind: "number" }, expression.span);
        return { value: { kind: "variable", name: variable.name }, type: variable.type };
      }
      case "unary": {
        const value = this.lowerExpression(expression.value);
        const type: IRType =
          expression.operator === "not" ? { kind: "boolean" } : { kind: "number" };
        const target = this.newTemporary(type, expression.span);
        this.emit({
          op: "unary",
          target: target.name,
          operator: expression.operator,
          value: value.value,
          span: expression.span,
        });
        return { value: { kind: "variable", name: target.name }, type };
      }
      case "binary": {
        const left = this.lowerExpression(expression.left);
        const right = this.lowerExpression(expression.right);
        const booleanResult = ["=", "<>", "<", "<=", ">", ">=", "and", "or"].includes(
          expression.operator,
        );
        const type: IRType = booleanResult
          ? { kind: "boolean" }
          : expression.operator === "+" &&
              (left.type.kind === "string" || right.type.kind === "string")
            ? { kind: "string" }
            : { kind: "number" };
        const target = this.newTemporary(type, expression.span);
        this.emit({
          op: "binary",
          target: target.name,
          operator: expression.operator,
          left: left.value,
          right: right.value,
          span: expression.span,
        });
        return { value: { kind: "variable", name: target.name }, type };
      }
      case "call":
        return (
          this.lowerCall(expression, true) ?? {
            value: { kind: "number", value: 0 },
            type: { kind: "number" },
          }
        );
    }
  }

  private lowerCall(
    expression: Extract<Expression, { kind: "call" }>,
    needsValue: boolean,
  ): LoweredValue | undefined {
    const args = expression.args.map((argument) => this.lowerExpression(argument));
    const operation = getEV3Operation(expression.name);
    if (operation) {
      if (operation.parameters.length !== args.length) {
        this.diagnostics.push(
          toDiagnostic(
            "BP3002",
            `'${operation.name}' expects ${operation.parameters.length} arguments.`,
            expression.span,
          ),
        );
      }
      const type: IRType = { kind: operation.returns };
      const target =
        operation.returns !== "void" ? this.newTemporary(type, expression.span) : undefined;
      const instruction: IRInstruction = target
        ? {
            op: "ev3-call",
            target: target.name,
            operation: operation.name,
            args: args.map((item) => item.value),
            span: expression.span,
          }
        : {
            op: "ev3-call",
            operation: operation.name,
            args: args.map((item) => item.value),
            span: expression.span,
          };
      this.emit(instruction);
      if (target) return { value: { kind: "variable", name: target.name }, type };
      if (needsValue)
        this.diagnostics.push(
          toDiagnostic("BP3003", `'${operation.name}' does not return a value.`, expression.span),
        );
      return undefined;
    }
    const declaration = this.#knownFunctions.get(canonical(expression.name));
    if (!declaration) {
      this.diagnostics.push(
        toDiagnostic(
          "BP3001",
          `Unsupported or unresolved call '${expression.name}'.`,
          expression.span,
        ),
      );
      return undefined;
    }
    if (declaration.parameters.length !== args.length) {
      this.diagnostics.push(
        toDiagnostic(
          "BP2004",
          `'${declaration.name}' expects ${declaration.parameters.length} arguments.`,
          expression.span,
        ),
      );
    }
    const returnsValue = declaration.kind === "function";
    const target = returnsValue
      ? this.newTemporary({ kind: "number" }, expression.span)
      : undefined;
    this.emit(
      target
        ? {
            op: "call",
            target: target.name,
            functionName: canonical(declaration.name),
            args: args.map((item) => item.value),
            span: expression.span,
          }
        : {
            op: "call",
            functionName: canonical(declaration.name),
            args: args.map((item) => item.value),
            span: expression.span,
          },
    );
    if (target) return { value: { kind: "variable", name: target.name }, type: target.type };
    if (needsValue)
      this.diagnostics.push(
        toDiagnostic("BP2005", `'${declaration.name}' does not return a value.`, expression.span),
      );
    return undefined;
  }

  private ensureVariable(name: string, type: IRType, span: SourceSpan): IRVariable {
    const key = canonical(name);
    const existing = this.variables.get(key);
    if (existing) return existing;
    return this.addVariable(key, type, "local", span);
  }

  private addVariable(
    name: string,
    type: IRType,
    scope: IRVariable["scope"],
    span?: SourceSpan,
  ): IRVariable {
    const variable: IRVariable = span
      ? { name: canonical(name), type, scope, span }
      : { name: canonical(name), type, scope };
    this.variables.set(canonical(name), variable);
    return variable;
  }

  private newTemporary(type: IRType, span: SourceSpan): IRVariable {
    this.#temporaryCounter += 1;
    return this.addVariable(`$t${this.#temporaryCounter}`, type, "temporary", span);
  }

  private emit(instruction: IRInstruction): void {
    this.#current.instructions.push(instruction);
  }

  private terminate(terminator: IRTerminator): void {
    this.#current.terminator = terminator;
    this.#terminated = true;
  }

  private createBlock(prefix: string): IRBasicBlock {
    const id = prefix === "entry" ? "entry" : `${prefix}_${++this.#blockCounter}`;
    const block: IRBasicBlock = { id, instructions: [], terminator: { op: "stop" } };
    this.blocks.push(block);
    return block;
  }

  private switchTo(block: IRBasicBlock): void {
    this.#current = block;
    this.#terminated = block.terminator.op !== "stop" || block.instructions.length > 0;
  }

  private labelId(label: string): string {
    return `label_${canonical(label).replace(/[^a-z0-9_]/g, "_")}`;
  }

  private getOrCreateLabel(label: string): IRBasicBlock {
    const id = this.labelId(label);
    return (
      this.blocks.find((block) => block.id === id) ??
      (() => {
        const block: IRBasicBlock = { id, instructions: [], terminator: { op: "stop" } };
        this.blocks.push(block);
        return block;
      })()
    );
  }

  private assignable(target: IRType, source: IRType): boolean {
    return target.kind === source.kind || (target.kind === "number" && source.kind === "integer");
  }
}

export function lowerProgram(
  name: string,
  body: Statement[],
  declarations: FunctionDeclaration[],
  sourceFiles: string[],
): { ir: KobrixaIR; diagnostics: Diagnostic[] } {
  const known = new Map<string, FunctionDeclaration>();
  const diagnostics: Diagnostic[] = [];
  for (const declaration of declarations) {
    const key = canonical(declaration.name);
    if (known.has(key))
      diagnostics.push(
        toDiagnostic("BP2001", `Duplicate function '${declaration.name}'.`, declaration.span),
      );
    known.set(key, declaration);
  }
  const functions: IRFunction[] = [];
  const main = new FunctionBuilder("main", [], { kind: "void" }, known);
  functions.push(main.compile(body));
  diagnostics.push(...main.diagnostics);
  for (const declaration of declarations) {
    const builder = new FunctionBuilder(
      canonical(declaration.name),
      declaration.parameters,
      { kind: declaration.kind === "function" ? "number" : "void" } as { kind: IRPrimitiveType },
      known,
    );
    functions.push(builder.compile(declaration.body));
    diagnostics.push(...builder.diagnostics);
  }
  return {
    ir: {
      version: 1,
      program: { name, entryFunction: "main" },
      globals: [],
      functions,
      resources: [],
      sourceFiles: [...sourceFiles].sort(),
    },
    diagnostics,
  };
}
