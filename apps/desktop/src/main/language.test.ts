import { describe, expect, it } from "vitest";
import type { SourceProject } from "@kobrixa/compiler";
import { LanguageService } from "./language.js";

const baseProject: SourceProject = {
  root: "/project",
  manifest: {
    schemaVersion: 1,
    name: "live-check",
    language: "bp",
    entry: "main.bp",
    target: "ev3-native",
    assets: [],
    outputDir: "build",
  },
  sources: [{ path: "main.bp", content: "LCD.Clear()\n" }],
  assets: [],
};

describe("LanguageService", () => {
  it("checks unsaved source overlays with the BASIC PLUS frontend", async () => {
    const workspaces = {
      project: async (_workspaceId: string, overlays: ReadonlyMap<string, string>) => ({
        ...baseProject,
        sources: [
          {
            path: "main.bp",
            content: overlays.get("main.bp") ?? baseProject.sources[0]!.content,
          },
        ],
      }),
    };
    const service = new LanguageService(workspaces);

    const diagnostics = await service.diagnostics("workspace", {
      "main.bp": "Unknown.Do()\n",
    });

    expect(diagnostics).toEqual([expect.objectContaining({ code: "BP3001", file: "main.bp" })]);
  });
});
