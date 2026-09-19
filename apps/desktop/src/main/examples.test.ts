import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EV3Backend, inspectRbf } from "@kobrixa/backend-ev3";
import { BasicPlusFrontend } from "@kobrixa/basic-plus";
import { loadProject } from "@kobrixa/compiler";
import { validateIR } from "@kobrixa/ir";

const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const documentedExamples = [
  "buttons/button-feedback",
  "capstones/button-car",
  "capstones/obstacle-rover",
  "capstones/sensor-dashboard",
  "collections/row-vector",
  "collections/vector-workbench",
  "control-flow/boolean-logic",
  "control-flow/break-and-continue",
  "control-flow/comparison-operators",
  "control-flow/control-flow",
  "control-flow/if-elseif",
  "control-flow/labels-and-goto",
  "control-flow/nested-control",
  "control-flow/while-loop",
  "display/display-fonts",
  "display/display-shapes",
  "display/display-write",
  "display/double-buffer-animation",
  "display/drawing-primitives",
  "files/file-round-trip",
  "files/binary-record",
  "getting-started/hello-ev3",
  "language/case-insensitive",
  "language/byte-logic",
  "language/text-and-math",
  "language/local-functions",
  "mailboxes/mailbox-local",
  "motors/motor-counter",
  "motors/motor-move",
  "motors/motor-reverse",
  "motors/motor-sequence",
  "motors/motor-start-stop",
  "motors/motor-steer-sync",
  "motors/motor-schedule",
  "media/original-media",
  "program/program-end",
  "projects/include-multiple",
  "projects/include-settings",
  "projects/import-functions",
  "projects/import-module",
  "program/brick-status",
  "sensors/color-sensor",
  "sensors/gyro-sensor",
  "sensors/sensor-sampling",
  "sensors/sensor-threshold",
  "sensors/sensor-details",
  "sensors/i2c-registers",
  "sensors/raw-and-mode",
  "sound/speaker-melody",
  "sound/speaker-interrupt",
  "sound/speaker-scale",
  "concurrency/thread-mutex",
  "time/timer-slots",
].sort();
const documentedCategories = [
  "getting-started",
  "capstones",
  "buttons",
  "collections",
  "concurrency",
  "display",
  "files",
  "media",
  "sound",
  "control-flow",
  "language",
  "mailboxes",
  "program",
  "projects",
  "motors",
  "sensors",
  "time",
];

async function findExampleProjects(root: string, relative = ""): Promise<string[]> {
  const directory = path.join(root, relative);
  const entries = await readdir(directory, { withFileTypes: true });
  if (entries.some((entry) => entry.isFile() && entry.name === "kobrixa.json")) return [relative];
  const children = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => findExampleProjects(root, path.join(relative, entry.name))),
  );
  return children.flat();
}

describe("shipped examples", () => {
  it("compiles every example to a valid native RBF image", async () => {
    const examplesRoot = path.join(repositoryRoot, "examples");
    const examples = (await findExampleProjects(examplesRoot)).sort();
    expect(examples).toEqual(documentedExamples);
    const indexes = await Promise.all(
      ["README.md", "README.zh-TW.md"].map((name) =>
        readFile(path.join(examplesRoot, name), "utf8"),
      ),
    );
    for (const projectPath of documentedExamples) {
      for (const index of indexes) expect(index).toContain(`](${projectPath}/)`);
    }
    for (const category of documentedCategories) {
      for (const index of indexes) expect(index).toContain(`href="./${category}/"`);
      const categoryIndex = await readFile(path.join(examplesRoot, category, "README.md"), "utf8");
      expect(categoryIndex).toContain('href="../README.md"');
      expect(categoryIndex).toContain('href="../README.zh-TW.md"');
      for (const projectPath of documentedExamples.filter((item) =>
        item.startsWith(`${category}/`),
      )) {
        expect(categoryIndex).toContain(`](./${path.basename(projectPath)}/)`);
      }
    }

    for (const projectPath of examples) {
      const loaded = await loadProject(path.join(examplesRoot, projectPath));
      expect(loaded.diagnostics, projectPath).toEqual([]);
      expect(loaded.project, projectPath).toBeDefined();

      const frontend = await new BasicPlusFrontend().compile(
        loaded.project!,
        new AbortController().signal,
      );
      expect(frontend.diagnostics, projectPath).toEqual([]);
      expect(frontend.ir, projectPath).toBeDefined();
      expect(validateIR(frontend.ir!), projectPath).toEqual([]);

      const backend = await new EV3Backend().compile(frontend.ir!, new AbortController().signal);
      expect(backend.diagnostics, projectPath).toEqual([]);
      expect(backend.rbf, projectPath).toBeDefined();
      expect(inspectRbf(backend.rbf!).objectCount, projectPath).toBeGreaterThan(0);
    }
  });
});
