import { describe, expect, it } from "vitest";
import type { KobrixaIR } from "@kobrixa/ir";
import { EV3Backend, inspectRbf } from "./index.js";

const ir: KobrixaIR = {
  version: 1,
  program: { name: "empty", entryFunction: "main" },
  globals: [],
  functions: [
    {
      name: "main",
      parameters: [],
      returnType: { kind: "void" },
      locals: [],
      entryBlock: "entry",
      blocks: [
        {
          id: "entry",
          instructions: [{ op: "ev3-call", operation: "LCD.Clear", args: [] }],
          terminator: { op: "stop" },
        },
      ],
    },
  ],
  resources: [],
  sourceFiles: ["main.bp"],
};

describe("EV3Backend", () => {
  it("emits a deterministic, self-consistent RBF image", async () => {
    const backend = new EV3Backend();
    const first = await backend.compile(ir, new AbortController().signal);
    const second = await backend.compile(ir, new AbortController().signal);
    expect(first.diagnostics).toEqual([]);
    expect(first.rbf).toEqual(second.rbf);
    expect(inspectRbf(first.rbf!).objectCount).toBe(1);
  });
});
