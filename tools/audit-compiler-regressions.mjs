import assert from "node:assert/strict";
import { BasicPlusFrontend } from "../frontends/basic-plus/dist/index.js";
import { EV3Backend } from "../packages/backend-ev3/dist/index.js";
import { validateIR } from "../packages/ir/dist/index.js";

export async function auditCompilerRegressions(execute) {
  const countdown = (depth) => `LCD.Text(1, 0, 0, 1, "Result: " + Count(${depth}))
Function Count(in number n)
  If n > 0 Then
    Return 1 + Count(n - 1)
  EndIf
  Return 1
EndFunction
`;
  const fixtures = [
    {
      name: "byte high-bit literals and masks match stock EV3 semantics",
      source: `LCD.Text(1, 0, 0, 1, Byte.OR_(128, 0) + "," + Byte.SHR(128, 1))
LCD.Text(1, 0, 20, 1, Byte.BIT(165, 7) + "," + Byte.BIT(165, 1) + "," + Byte.BIT(1, 0))
LCD.Text(1, 0, 40, 1, Byte.ToHex(255) + "," + Byte.ToBinary(128))
`,
      texts: ["128,64", "1,0,1", "FF,10000000"],
    },
    {
      name: "32 recursive frames retain separate locals and return values",
      source: countdown(31),
      texts: ["Result: 32"],
    },
    {
      name: "recursion overflow stops with an explicit message",
      source: countdown(32),
      texts: ["Recursion exceeds 32 frames"],
    },
    {
      name: "mutual recursion uses separate native objects",
      source: `LCD.Text(1, 0, 0, 1, "Result: " + First(4))
Function First(in number n)
  If n > 0 Then
    Return 1 + Second(n - 1)
  EndIf
  Return 1
EndFunction
Function Second(in number n)
  If n > 0 Then
    Return 1 + First(n - 1)
  EndIf
  Return 1
EndFunction
`,
      texts: ["Result: 5"],
    },
  ];
  const results = [];
  for (const fixture of fixtures) {
    const front = await new BasicPlusFrontend().compile(
      {
        root: "/audit",
        manifest: {
          schemaVersion: 1,
          name: "regression",
          language: "bp",
          entry: "main.bp",
          target: "ev3-native",
          assets: [],
          outputDir: "build",
        },
        sources: [{ path: "main.bp", content: fixture.source }],
        assets: [],
      },
      new AbortController().signal,
    );
    assert.deepEqual(front.diagnostics, [], fixture.name);
    assert.deepEqual(validateIR(front.ir), [], fixture.name);
    const back = await new EV3Backend().compile(front.ir, new AbortController().signal);
    assert.deepEqual(back.diagnostics, [], fixture.name);
    const run = execute(back.rbf);
    assert.equal(run.status, "ended", fixture.name + ": " + run.error);
    assert.deepEqual(
      run.trace.filter((entry) => entry.op === "UI_DRAW.TEXT").map((entry) => entry.args[3]),
      fixture.texts,
      fixture.name,
    );
    results.push({ name: fixture.name, bytes: back.rbf.length, steps: run.steps, pass: true });
  }
  return results;
}
