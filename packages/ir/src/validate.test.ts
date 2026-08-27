import { describe, expect, it } from "vitest";
import { serializeIR, validateIR, type KobrixaIR } from "./index.js";

const valid: KobrixaIR = {
  version: 1,
  program: { name: "hello", entryFunction: "main" },
  globals: [],
  functions: [
    {
      name: "main",
      parameters: [],
      returnType: { kind: "void" },
      locals: [],
      entryBlock: "entry",
      blocks: [{ id: "entry", instructions: [], terminator: { op: "stop" } }],
    },
  ],
  resources: [],
  sourceFiles: ["main.bp"],
};

describe("KobrixaIR", () => {
  it("accepts a minimal program", () => expect(validateIR(valid)).toEqual([]));
  it("serializes deterministically", () =>
    expect(serializeIR(valid)).toBe(serializeIR(structuredClone(valid))));
  it("rejects a missing entry", () => {
    const invalid = structuredClone(valid);
    invalid.program.entryFunction = "missing";
    expect(validateIR(invalid)[0]?.code).toBe("IR1001");
  });
});
