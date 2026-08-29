import { describe, expect, it } from "vitest";
import type { SourceProject } from "@kobrixa/compiler";
import { validateIR } from "@kobrixa/ir";
import {
  BASIC_PLUS_API_COMPLETIONS,
  BASIC_PLUS_KEYWORDS,
  BasicPlusFrontend,
  formatBasicPlus,
} from "./index.js";

function project(content: string): SourceProject {
  return {
    root: "/project",
    manifest: {
      schemaVersion: 1,
      name: "demo",
      language: "bp",
      entry: "main.bp",
      target: "ev3-native",
      assets: [],
      outputDir: "build",
    },
    sources: [{ path: "main.bp", content }],
    assets: [],
  };
}

describe("BasicPlusFrontend", () => {
  it("lowers case-insensitive control flow and EV3 calls", async () => {
    const result = await new BasicPlusFrontend().compile(
      project(
        'Count = 0\nWHILE Count < 2\n  LCD.Text(1, 0, 0, 1, "Hi")\n  Count = Count + 1\nEndWhile\n',
      ),
      new AbortController().signal,
    );
    expect(result.diagnostics).toEqual([]);
    expect(result.ir?.functions[0]?.blocks.length).toBeGreaterThan(1);
  });

  it("reports unsupported calls", async () => {
    const result = await new BasicPlusFrontend().compile(
      project("Unknown.Do()\n"),
      new AbortController().signal,
    );
    expect(result.diagnostics[0]?.code).toBe("BP3001");
  });

  it("accepts bare and quoted Boolean values without turning display text into a Boolean", async () => {
    const result = await new BasicPlusFrontend().compile(
      project(
        'If "TrUe" Then\n  LCD.Text(1, 0, 0, 1, "True")\nEndIf\nWhile "False"\n  LCD.Clear()\nEndWhile\nMotor.Stop("A", true)\nMotor.Stop("A", "FaLsE")\n',
      ),
      new AbortController().signal,
    );

    expect(result.diagnostics).toEqual([]);
    expect(validateIR(result.ir!)).toEqual([]);
    const blocks = result.ir!.functions[0]!.blocks;
    const branches = blocks.map((block) => block.terminator).filter((item) => item.op === "branch");
    expect(branches.map((branch) => branch.condition)).toEqual(
      expect.arrayContaining([
        { kind: "boolean", value: true },
        { kind: "boolean", value: false },
      ]),
    );
    const calls = blocks
      .flatMap((block) => block.instructions)
      .filter((instruction) => instruction.op === "ev3-call");
    expect(calls.find((call) => call.operation === "LCD.Text")?.args[4]).toEqual({
      kind: "string",
      value: "True",
    });
    expect(
      calls.filter((call) => call.operation === "Motor.Stop").map((call) => call.args[1]),
    ).toEqual([
      { kind: "boolean", value: true },
      { kind: "boolean", value: false },
    ]);
  });

  it("formats blocks", () =>
    expect(formatBasicPlus("If True Then\nLCD.Clear()\nEndIf\n")).toContain("  LCD.Clear()"));

  it("describes keyword and EV3 API completions", () => {
    expect(BASIC_PLUS_KEYWORDS).toContain("Dim");
    expect(BASIC_PLUS_API_COMPLETIONS.find((item) => item.label === "Motor.Start")).toMatchObject({
      signature: "Motor.Start(string, integer)",
      insertText: 'Motor.Start("${1}", ${2:0})',
      category: "motor",
    });
    expect(
      BASIC_PLUS_API_COMPLETIONS.find((item) => item.label === "Button.IsPressed"),
    ).toMatchObject({
      signature: "Button.IsPressed(string): boolean",
    });
  });
});
