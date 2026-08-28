import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EV3Backend, inspectRbf } from "@kobrixa/backend-ev3";
import { BasicPlusFrontend } from "@kobrixa/basic-plus";
import { loadProject } from "@kobrixa/compiler";
import { validateIR } from "@kobrixa/ir";

const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));

describe("shipped examples", () => {
  it("compiles every example to a valid native RBF image", async () => {
    const examplesRoot = path.join(repositoryRoot, "examples");
    const entries = await readdir(examplesRoot, { withFileTypes: true });
    const examples = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    expect(examples.length).toBeGreaterThan(1);

    for (const name of examples) {
      const loaded = await loadProject(path.join(examplesRoot, name));
      expect(loaded.diagnostics, name).toEqual([]);
      expect(loaded.project, name).toBeDefined();

      const frontend = await new BasicPlusFrontend().compile(
        loaded.project!,
        new AbortController().signal,
      );
      expect(frontend.diagnostics, name).toEqual([]);
      expect(frontend.ir, name).toBeDefined();
      expect(validateIR(frontend.ir!), name).toEqual([]);

      const backend = await new EV3Backend().compile(frontend.ir!, new AbortController().signal);
      expect(backend.diagnostics, name).toEqual([]);
      expect(backend.rbf, name).toBeDefined();
      expect(inspectRbf(backend.rbf!).objectCount, name).toBeGreaterThan(0);
    }
  });
});
