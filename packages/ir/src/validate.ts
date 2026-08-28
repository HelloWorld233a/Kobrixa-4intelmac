import { getEV3Operation } from "./catalog.js";
import type {
  IRFunction,
  IRType,
  IRValidationIssue,
  IRValue,
  KobrixaIR,
  SourceSpan,
} from "./types.js";

function sameType(left: IRType, right: IRType): boolean {
  return (
    left.kind === right.kind &&
    (left.kind !== "array" || right.kind !== "array" || left.element === right.element)
  );
}

function valueType(value: IRValue, symbols: Map<string, IRType>): IRType | undefined {
  if (value.kind === "variable") return symbols.get(value.name.toLocaleLowerCase("en-US"));
  return { kind: value.kind };
}

function issue(code: string, message: string, span?: SourceSpan): IRValidationIssue {
  return span ? { code, message, span } : { code, message };
}

function validateFunction(fn: IRFunction, globals: Map<string, IRType>): IRValidationIssue[] {
  const issues: IRValidationIssue[] = [];
  const symbols = new Map(globals);
  for (const variable of [...fn.parameters, ...fn.locals]) {
    const key = variable.name.toLocaleLowerCase("en-US");
    if (symbols.has(key))
      issues.push(issue("IR1002", `Duplicate symbol '${variable.name}'.`, variable.span));
    symbols.set(key, variable.type);
  }

  const blocks = new Map(fn.blocks.map((block) => [block.id, block]));
  if (!blocks.has(fn.entryBlock))
    issues.push(issue("IR1003", `Entry block '${fn.entryBlock}' does not exist.`, fn.span));

  for (const block of fn.blocks) {
    for (const instruction of block.instructions) {
      const target =
        "target" in instruction && instruction.target
          ? symbols.get(instruction.target.toLocaleLowerCase("en-US"))
          : undefined;
      if ("target" in instruction && instruction.target && !target) {
        issues.push(issue("IR1004", `Unknown target '${instruction.target}'.`, instruction.span));
      }
      const operands =
        instruction.op === "assign"
          ? [instruction.value]
          : instruction.op === "binary"
            ? [instruction.left, instruction.right]
            : instruction.op === "unary"
              ? [instruction.value]
              : instruction.args;
      for (const operand of operands) {
        if (!valueType(operand, symbols))
          issues.push(
            issue(
              "IR1005",
              `Unknown value '${operand.kind === "variable" ? operand.name : "literal"}'.`,
              instruction.span,
            ),
          );
      }
      if (instruction.op === "assign" && target) {
        const actual = valueType(instruction.value, symbols);
        if (
          actual &&
          !sameType(target, actual) &&
          !(target.kind === "number" && actual.kind === "integer")
        ) {
          issues.push(
            issue("IR1006", `Cannot assign ${actual.kind} to ${target.kind}.`, instruction.span),
          );
        }
      }
      if (instruction.op === "ev3-call") {
        const signature = getEV3Operation(instruction.operation);
        if (!signature) {
          issues.push(
            issue(
              "IR1100",
              `Unsupported EV3 operation '${instruction.operation}'.`,
              instruction.span,
            ),
          );
        } else if (signature.parameters.length !== instruction.args.length) {
          issues.push(
            issue(
              "IR1101",
              `'${signature.name}' expects ${signature.parameters.length} arguments.`,
              instruction.span,
            ),
          );
        } else {
          signature.parameters.forEach((expected, index) => {
            const actual = valueType(instruction.args[index]!, symbols);
            if (
              actual &&
              !sameType({ kind: expected }, actual) &&
              !(expected === "number" && actual.kind === "integer")
            ) {
              issues.push(
                issue(
                  "IR1102",
                  `Argument ${index + 1} of '${signature.name}' expects ${expected}, got ${actual.kind}.`,
                  instruction.span,
                ),
              );
            }
          });
        }
      }
    }

    const terminator = block.terminator;
    if (terminator.op === "jump" && !blocks.has(terminator.target)) {
      issues.push(
        issue("IR1007", `Jump target '${terminator.target}' does not exist.`, terminator.span),
      );
    }
    if (terminator.op === "branch") {
      if (!blocks.has(terminator.whenTrue) || !blocks.has(terminator.whenFalse)) {
        issues.push(issue("IR1008", "Branch target does not exist.", terminator.span));
      }
      if (!valueType(terminator.condition, symbols))
        issues.push(issue("IR1005", "Unknown branch condition.", terminator.span));
    }
  }
  return issues;
}

export function validateIR(ir: KobrixaIR): IRValidationIssue[] {
  const issues: IRValidationIssue[] = [];
  if (ir.version !== 1)
    issues.push(issue("IR1000", `Unsupported IR version '${String(ir.version)}'.`));
  const globals = new Map<string, IRType>();
  for (const global of ir.globals) {
    const key = global.name.toLocaleLowerCase("en-US");
    if (globals.has(key))
      issues.push(issue("IR1002", `Duplicate global '${global.name}'.`, global.span));
    globals.set(key, global.type);
  }
  const functions = new Set(ir.functions.map((fn) => fn.name.toLocaleLowerCase("en-US")));
  if (!functions.has(ir.program.entryFunction.toLocaleLowerCase("en-US"))) {
    issues.push(issue("IR1001", `Entry function '${ir.program.entryFunction}' does not exist.`));
  }
  for (const fn of ir.functions) issues.push(...validateFunction(fn, globals));
  return issues;
}
