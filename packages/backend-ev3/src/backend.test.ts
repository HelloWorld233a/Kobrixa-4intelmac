import { describe, expect, it } from "vitest";
import type { KobrixaIR } from "@kobrixa/ir";
import { EV3Backend, INPUT_DEVICE, inspectRbf, OP, STRING } from "./index.js";

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
          terminator: { op: "return" },
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
    const info = inspectRbf(first.rbf!);
    expect(info.objectCount).toBe(1);
    const code = first.rbf!.slice(info.offsets[0]);
    expect(code.at(-1)).toBe(OP.OBJECT_END);
    expect([...code].filter((byte) => byte === OP.OBJECT_END)).toHaveLength(1);
  });

  it("allocates IR globals in EV3 global memory", async () => {
    const withGlobal: KobrixaIR = {
      ...ir,
      globals: [{ name: "speed", type: { kind: "number" }, scope: "global" }],
      functions: [
        {
          ...ir.functions[0]!,
          blocks: [
            {
              id: "entry",
              instructions: [
                {
                  op: "assign",
                  target: "speed",
                  value: { kind: "number", value: 30 },
                },
              ],
              terminator: { op: "return" },
            },
          ],
        },
      ],
    };
    const result = await new EV3Backend().compile(withGlobal, new AbortController().signal);

    expect(result.diagnostics).toEqual([]);
    expect(inspectRbf(result.rbf!).globalBytes).toBe(4);
    expect([...result.rbf!]).toContain(0x60);
  });

  it("encodes Clev3r string arrays using byte-array content operations", async () => {
    const stringArray: KobrixaIR = {
      ...ir,
      globals: [{ name: "names", type: { kind: "array", element: "string" }, scope: "global" }],
      functions: [
        {
          ...ir.functions[0]!,
          locals: [{ name: "label", type: { kind: "string" }, scope: "local" }],
          blocks: [
            {
              id: "entry",
              instructions: [
                {
                  op: "ev3-call",
                  operation: "Row.Write",
                  args: [
                    { kind: "variable", name: "names" },
                    { kind: "integer", value: 0 },
                    { kind: "string", value: "Alpha" },
                  ],
                },
                {
                  op: "ev3-call",
                  target: "label",
                  operation: "Row.Read",
                  args: [
                    { kind: "variable", name: "names" },
                    { kind: "integer", value: 0 },
                  ],
                },
              ],
              terminator: { op: "return" },
            },
          ],
        },
      ],
    };
    const result = await new EV3Backend().compile(stringArray, new AbortController().signal);

    expect(result.diagnostics).toEqual([]);
    expect(inspectRbf(result.rbf!).globalBytes).toBe(4);
    expect([...result.rbf!]).toEqual(expect.arrayContaining([OP.ARRAY, 0x0d, 0x0e]));
  });

  it("converts floating Clev3r row lengths and indexes before EV3 array access", async () => {
    const matrix: KobrixaIR = {
      ...ir,
      functions: [
        {
          ...ir.functions[0]!,
          locals: [
            { name: "length", type: { kind: "number" }, scope: "local" },
            { name: "matrix", type: { kind: "number" }, scope: "local" },
            { name: "value", type: { kind: "number" }, scope: "local" },
          ],
          blocks: [
            {
              id: "entry",
              instructions: [
                { op: "assign", target: "length", value: { kind: "number", value: 42 } },
                {
                  op: "ev3-call",
                  target: "matrix",
                  operation: "Row.Init",
                  args: [
                    { kind: "variable", name: "length" },
                    { kind: "number", value: 0 },
                  ],
                },
                {
                  op: "ev3-call",
                  operation: "Row.Write",
                  args: [
                    { kind: "variable", name: "matrix" },
                    { kind: "variable", name: "length" },
                    { kind: "number", value: 1 },
                  ],
                },
                {
                  op: "ev3-call",
                  target: "value",
                  operation: "Row.Read",
                  args: [
                    { kind: "variable", name: "matrix" },
                    { kind: "variable", name: "length" },
                  ],
                },
                {
                  op: "ev3-call",
                  target: "length",
                  operation: "Row.Size",
                  args: [{ kind: "variable", name: "matrix" }],
                },
              ],
              terminator: { op: "return" },
            },
          ],
        },
      ],
    };
    const result = await new EV3Backend().compile(matrix, new AbortController().signal);

    expect(result.diagnostics).toEqual([]);
    expect([...result.rbf!]).toContain(OP.MOVE_F_32);
    expect([...result.rbf!]).toContain(OP.MOVE_32_F);
  });

  it("creates a runnable EV3 object for Thread.Run", async () => {
    const threaded: KobrixaIR = {
      ...ir,
      functions: [
        {
          ...ir.functions[0]!,
          blocks: [
            {
              id: "entry",
              instructions: [{ op: "thread-start", functionName: "worker" }],
              terminator: { op: "return" },
            },
          ],
        },
        {
          name: "worker",
          parameters: [],
          returnType: { kind: "void" },
          locals: [],
          entryBlock: "entry",
          blocks: [
            { id: "entry", instructions: [], terminator: { op: "jump", target: "loop" } },
            { id: "loop", instructions: [], terminator: { op: "jump", target: "entry" } },
          ],
        },
      ],
    };
    const result = await new EV3Backend().compile(threaded, new AbortController().signal);

    expect(result.diagnostics).toEqual([]);
    const info = inspectRbf(result.rbf!);
    const headers = new DataView(result.rbf!.buffer, result.rbf!.byteOffset, result.rbf!.byteLength);
    expect(info.objectCount).toBe(3);
    expect(headers.getUint16(28 + 4, true)).toBe(0);
    expect(headers.getUint16(28 + 6, true)).toBe(1);
    expect(result.rbf!.slice(info.offsets[1], info.offsets[2]).slice(-2)).toEqual(
      Uint8Array.from([OP.RETURN, OP.OBJECT_END]),
    );
    expect([...result.rbf!]).toContain(OP.OBJECT_START);
    expect([...result.rbf!]).toContain(OP.SLEEP);
  });

  it("converts Clev3r numeric text arguments before appending or writing them", async () => {
    const text: KobrixaIR = {
      ...ir,
      functions: [
        {
          ...ir.functions[0]!,
          locals: [{ name: "result", type: { kind: "string" }, scope: "local" }],
          blocks: [
            {
              id: "entry",
              instructions: [
                {
                  op: "ev3-call",
                  target: "result",
                  operation: "Text.Append",
                  args: [
                    { kind: "string", value: "angle=" },
                    { kind: "integer", value: 90 },
                  ],
                },
                {
                  op: "ev3-call",
                  operation: "LCD.Write",
                  args: [
                    { kind: "integer", value: 0 },
                    { kind: "integer", value: 0 },
                    { kind: "integer", value: 90 },
                  ],
                },
              ],
              terminator: { op: "return" },
            },
          ],
        },
      ],
    };
    const result = await new EV3Backend().compile(text, new AbortController().signal);

    expect(result.diagnostics).toEqual([]);
    expect([...result.rbf!]).toEqual(expect.arrayContaining([STRING.VALUE_FORMATTED]));
  });

  it("emits one object terminator for conditional control flow", async () => {
    const conditional: KobrixaIR = {
      version: 1,
      program: { name: "conditional", entryFunction: "main" },
      globals: [],
      functions: [
        {
          name: "main",
          parameters: [],
          returnType: { kind: "void" },
          locals: [{ name: "condition", type: { kind: "boolean" }, scope: "local" }],
          entryBlock: "entry",
          blocks: [
            {
              id: "entry",
              instructions: [
                {
                  op: "assign",
                  target: "condition",
                  value: { kind: "boolean", value: true },
                },
              ],
              terminator: {
                op: "branch",
                condition: { kind: "variable", name: "condition" },
                whenTrue: "if_body",
                whenFalse: "if_end",
              },
            },
            {
              id: "if_end",
              instructions: [
                {
                  op: "ev3-call",
                  operation: "Program.Delay",
                  args: [{ kind: "integer", value: 100 }],
                },
              ],
              terminator: { op: "return" },
            },
            {
              id: "if_body",
              instructions: [{ op: "ev3-call", operation: "LCD.Clear", args: [] }],
              terminator: { op: "jump", target: "if_end" },
            },
          ],
        },
      ],
      resources: [],
      sourceFiles: ["main.bp"],
    };

    const result = await new EV3Backend().compile(conditional, new AbortController().signal);
    expect(result.diagnostics).toEqual([]);
    const info = inspectRbf(result.rbf!);
    const code = result.rbf!.slice(info.offsets[0]);
    expect(code.at(-1)).toBe(OP.OBJECT_END);
    expect(result.listing).toContain("locals=8");
    expect(result.listing).toContain("85 81 64 44 86 44");
  });

  it("uses comparison opcodes rather than similarly numbered branch opcodes", async () => {
    expect({
      CP_LT_32: OP.CP_LT_32,
      CP_LT_F: OP.CP_LT_F,
      CP_GT_32: OP.CP_GT_32,
      CP_GT_F: OP.CP_GT_F,
      CP_EQ_8: OP.CP_EQ_8,
      CP_EQ_32: OP.CP_EQ_32,
      CP_EQ_F: OP.CP_EQ_F,
      CP_NEQ_32: OP.CP_NEQ_32,
      CP_NEQ_F: OP.CP_NEQ_F,
      CP_LTEQ_32: OP.CP_LTEQ_32,
      CP_LTEQ_F: OP.CP_LTEQ_F,
      CP_GTEQ_32: OP.CP_GTEQ_32,
      CP_GTEQ_F: OP.CP_GTEQ_F,
    }).toEqual({
      CP_LT_32: 0x46,
      CP_LT_F: 0x47,
      CP_GT_32: 0x4a,
      CP_GT_F: 0x4b,
      CP_EQ_8: 0x4c,
      CP_EQ_32: 0x4e,
      CP_EQ_F: 0x4f,
      CP_NEQ_32: 0x52,
      CP_NEQ_F: 0x53,
      CP_LTEQ_32: 0x56,
      CP_LTEQ_F: 0x57,
      CP_GTEQ_32: 0x5a,
      CP_GTEQ_F: 0x5b,
    });
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
    expect(result.listing).toContain("9a 00 00 00 3f");
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

  it("reads raw sensor data and selects an index without changing the current mode", async () => {
    const sensor: KobrixaIR = {
      ...ir,
      functions: [
        {
          ...ir.functions[0]!,
          locals: [{ name: "reading", type: { kind: "integer" }, scope: "local" }],
          blocks: [
            {
              id: "entry",
              instructions: [
                {
                  op: "ev3-call",
                  target: "reading",
                  operation: "Sensor.ReadRawValue",
                  args: [
                    { kind: "integer", value: 1 },
                    { kind: "integer", value: 2 },
                  ],
                },
              ],
              terminator: { op: "return" },
            },
          ],
        },
      ],
    };
    const result = await new EV3Backend().compile(sensor, new AbortController().signal);
    expect(result.diagnostics).toEqual([]);
    expect(INPUT_DEVICE.READY_RAW).toBe(0x1c);
    // The runtime fetches all eight raw values, so a variable index can be selected safely.
    expect(result.listing).toContain("99 1c 00 00 00 3f 08");
  });
});
