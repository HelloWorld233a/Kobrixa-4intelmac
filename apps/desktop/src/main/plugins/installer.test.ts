import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { loadPlugins } from "@kobrixa/plugin-runtime";
import {
  installPythonFilePlugin,
  listInstalledPluginSources,
  uninstallInstalledPlugin,
} from "./installer.js";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "kobrixa-plugin-installer-"));
});
afterEach(() => rm(root, { recursive: true, force: true }));

it("installs a standalone .py script as a valid Kobrixa plugin without CLI flags and uninstalls it", async () => {
  const installed = await installPythonFilePlugin(root, {
    filename: "hello_world.py",
    content: 'print("Hello from app-installed Python plugin!")\n',
  });
  expect(installed.pluginId).toBe("user.hello-world");

  const sources = await listInstalledPluginSources(root);
  expect(sources).toHaveLength(1);

  const loaded = await loadPlugins(sources, { disabled: new Set(), safeMode: false });
  expect(loaded[0]).toMatchObject({
    id: "user.hello-world",
    status: "enabled",
  });

  await uninstallInstalledPlugin(root, "user.hello-world");
  expect(await listInstalledPluginSources(root)).toHaveLength(0);
});
