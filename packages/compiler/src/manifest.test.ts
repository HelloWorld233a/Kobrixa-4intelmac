import { describe, expect, it } from "vitest";
import { parseManifest } from "./manifest.js";

describe("manifest", () => {
  it("retains unknown fields", () => {
    const result = parseManifest({
      schemaVersion: 1,
      name: "demo",
      language: "bp",
      entry: "src/main.bp",
      target: "ev3-native",
      assets: [],
      outputDir: "build",
      future: true,
    });
    expect(result.manifest?.future).toBe(true);
  });

  it("rejects invalid known fields", () => {
    expect(parseManifest({ schemaVersion: 2 }).diagnostics[0]?.code).toBe("MAN1001");
  });
});
