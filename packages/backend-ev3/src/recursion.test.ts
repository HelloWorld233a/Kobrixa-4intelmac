import { describe, expect, it } from "vitest";
import type { IRFunction, KobrixaIR } from "@kobrixa/ir";
import { expandRecursiveCalls, RECURSION_DEPTH } from "./recursion.js";
const fn = (name: string, callee: string): IRFunction => ({
  name,
  parameters: [],
  locals: [],
  returnType: { kind: "void" },
  entryBlock: "entry",
  blocks: [
    {
      id: "entry",
      instructions: [{ op: "call", functionName: callee, args: [] }],
      terminator: { op: "return" },
    },
  ],
});
const program = (functions: IRFunction[]): KobrixaIR => ({
  version: 1,
  program: { name: "recursion", entryFunction: "main" },
  globals: [],
  functions,
  resources: [],
  sourceFiles: [],
});
describe("EV3 recursive call frames", () => {
  it("expands mutual recursion to an acyclic graph and an explicit overflow stop", () => {
    const input = program([fn("main", "first"), fn("first", "second"), fn("second", "first")]);
    const expanded = expandRecursiveCalls(input);
    expect(expanded.functions).toHaveLength(1 + 2 * RECURSION_DEPTH);
    const byName = new Map(expanded.functions.map((item) => [item.name, item]));
    const visit = (name: string, stack: string[]): void => {
      expect(stack).not.toContain(name);
      for (const instruction of byName.get(name)!.blocks[0]!.instructions) {
        if (instruction.op === "call") visit(instruction.functionName, [...stack, name]);
        else expect(instruction).toMatchObject({ op: "ev3-call", operation: "Assert.Failed" });
      }
    };
    visit("main", []);
    expect(input.functions[1]!.blocks[0]!.instructions[0]).toMatchObject({
      functionName: "second",
    });
  });
  it("leaves nonrecursive programs and calls outside the recursive component intact", () => {
    const leaf: IRFunction = {
      ...fn("leaf", "unused"),
      blocks: [{ id: "entry", instructions: [], terminator: { op: "return" } }],
    };
    const acyclic = program([fn("main", "leaf"), leaf]);
    expect(expandRecursiveCalls(acyclic)).toBe(acyclic);
    const recursive = fn("repeat", "repeat");
    recursive.blocks[0]!.instructions.push({ op: "call", functionName: "leaf", args: [] });
    const result = expandRecursiveCalls(program([fn("main", "repeat"), recursive, leaf]));
    expect(
      result.functions
        .filter((item) => item.name.includes("repeat"))
        .every((item) =>
          item.blocks[0]!.instructions.some(
            (instruction) => instruction.op === "call" && instruction.functionName === "leaf",
          ),
        ),
    ).toBe(true);
  });
});
