import { describe, expect, it } from "vitest";
import type { SourceProject } from "@kobrixa/compiler";
import { BasicPlusFrontend, formatBasicPlus } from "./index.js";

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

  it("formats blocks", () =>
    expect(formatBasicPlus("If True Then\nLCD.Clear()\nEndIf\n")).toContain("  LCD.Clear()"));
});
