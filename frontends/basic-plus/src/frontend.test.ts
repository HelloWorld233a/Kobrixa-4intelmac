import { describe, expect, it } from "vitest";
import type { SourceProject } from "@kobrixa/compiler";
import { validateIR } from "@kobrixa/ir";
import {
  BASIC_PLUS_API_COMPLETIONS,
  BASIC_PLUS_KEYWORDS,
  BasicPlusFrontend,
  formatBasicPlus,
  parse,
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
    expect(BASIC_PLUS_KEYWORDS).toEqual(
      expect.arrayContaining([
        "Include",
        "Import",
        "Folder",
        "For",
        "EndFor",
        "To",
        "Step",
        "If",
        "Then",
        "Else",
        "ElseIf",
        "EndIf",
        "Goto",
        "Function",
        "EndFunction",
        "Private",
        "Sub",
        "EndSub",
        "While",
        "EndWhile",
        "And",
        "Or",
        "In",
        "Out",
        "Number",
        "String",
        "Break",
        "Continue",
        "Return",
      ]),
    );
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

  it("parses the complete Clev3r keyword parameter syntax", () => {
    const result = parse(
      "main.bp",
      "Function Transform(in number value, out string text, in number[] samples)\nReturn\nEndFunction\n",
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.parsed.functions[0]?.parameters).toEqual([
      { name: "value", direction: "in", type: { kind: "number" } },
      { name: "text", direction: "out", type: { kind: "string" } },
      { name: "samples", direction: "in", type: { kind: "array", element: "number" } },
    ]);
  });

  it("loads Clev3r imports and accepts folder and private directives", async () => {
    const input = project('folder "prjs" "Demo"\nimport "lib"\nHelper("ok")\n');
    input.sources.push({
      path: "lib.bpm",
      content: "Private\nFunction Helper(in string message)\nReturn\nEndFunction\n",
    });
    const result = await new BasicPlusFrontend().compile(input, new AbortController().signal);

    expect(result.diagnostics).toEqual([]);
    expect(result.ir?.sourceFiles).toEqual(["lib.bpm", "main.bp"]);
    expect(result.ir?.functions.map((fn) => fn.name)).toContain("helper");
  });

  it("lowers break, continue, increment, and compound assignments", async () => {
    const result = await new BasicPlusFrontend().compile(
      project(
        "value = 0\nWhile value < 10\nvalue++\nIf value = 2 Then\nContinue\nEndIf\nIf value = 4 Then\nBreak\nEndIf\nvalue += 2\nEndWhile\nFor i = 3 To 1 Step -1\nContinue\nEndFor\n",
      ),
      new AbortController().signal,
    );

    expect(result.diagnostics).toEqual([]);
    expect(validateIR(result.ir!)).toEqual([]);
    const instructions = result.ir!.functions[0]!.blocks.flatMap((block) => block.instructions);
    expect(
      instructions.filter(
        (instruction) => instruction.op === "binary" && instruction.operator === "+",
      ),
    ).toHaveLength(3);
    expect(
      instructions.find(
        (instruction) => instruction.op === "binary" && instruction.operator === ">=",
      ),
    ).toBeDefined();
    const jumpTargets = result
      .ir!.functions[0]!.blocks.map((block) => block.terminator)
      .filter((terminator) => terminator.op === "jump")
      .map((terminator) => terminator.target);
    expect(jumpTargets.some((target) => target.startsWith("while_end_"))).toBe(true);
    expect(jumpTargets.some((target) => target.startsWith("for_update_"))).toBe(true);
  });

  it("rejects break and continue outside loops", async () => {
    const result = await new BasicPlusFrontend().compile(
      project("Break\nContinue\n"),
      new AbortController().signal,
    );
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(["BP2006", "BP2007"]);
  });
});
