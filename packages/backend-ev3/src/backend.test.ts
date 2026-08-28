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

  it("encodes documented LCD operands, integer math, and one-based sensor ports", async () => {
    const documented: KobrixaIR = {
      version: 1,
      program: { name: "documented", entryFunction: "main" },
      globals: [],
      functions: [
        {
          name: "main",
          parameters: [],
          returnType: { kind: "void" },
          locals: [
            { name: "reading", type: { kind: "integer" }, scope: "local" },
            { name: "sum", type: { kind: "integer" }, scope: "local" },
          ],
          entryBlock: "entry",
          blocks: [
            {
              id: "entry",
              instructions: [
                {
                  op: "ev3-call",
                  operation: "LCD.Text",
                  args: [
                    { kind: "integer", value: 1 },
                    { kind: "integer", value: 8 },
                    { kind: "integer", value: 18 },
                    { kind: "integer", value: 1 },
                    { kind: "string", value: "Hi" },
                  ],
                },
                {
                  op: "ev3-call",
                  target: "reading",
                  operation: "Sensor.ReadPercent",
                  args: [{ kind: "integer", value: 1 }],
                },
                {
                  op: "binary",
                  target: "sum",
                  operator: "+",
                  left: { kind: "integer", value: 1 },
                  right: { kind: "integer", value: 2 },
                },
              ],
              terminator: { op: "stop" },
            },
          ],
        },
      ],
      resources: [],
      sourceFiles: ["main.bp"],
    };
    const result = await new EV3Backend().compile(documented, new AbortController().signal);
    expect(result.diagnostics).toEqual([]);
    expect(result.listing).toContain("84 11 01 84 05 01 08 12 84 48 69 00");
    expect(result.listing).toContain("9a 00 00 00 3f 40");
    expect(result.listing).toContain("12 01 02 44");
  });

  it("waits for Motor.Move to finish before continuing", async () => {
    const moving: KobrixaIR = {
      version: 1,
      program: { name: "motor", entryFunction: "main" },
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
              instructions: [
                {
                  op: "ev3-call",
                  operation: "Motor.Move",
                  args: [
                    { kind: "string", value: "AD" },
                    { kind: "integer", value: 35 },
                    { kind: "integer", value: 360 },
                    { kind: "boolean", value: true },
                  ],
                },
              ],
              terminator: { op: "stop" },
            },
          ],
        },
      ],
      resources: [],
      sourceFiles: ["main.bp"],
    };

    const result = await new EV3Backend().compile(moving, new AbortController().signal);

    expect(result.diagnostics).toEqual([]);
    expect(result.listing).toContain("ae 00 09 81 23 00 82 68 01 00 01 aa 00 09");
  });
});
