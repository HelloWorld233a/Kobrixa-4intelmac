import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { MANIFEST_FILE, type PluginSource } from "@kobrixa/plugin-runtime";

export interface InstalledPythonPluginPayload {
  filename: string;
  content: string;
  id?: string;
  name?: string;
}

function sanitizeSlug(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/\.(py|kbr|json|ts|js)$/i, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return cleaned || "custom-plugin";
}

/**
 * Scans `<userData>/plugins/installed` for all user-installed plugins so they load automatically
 * on startup without needing `--plugin-dev-dir`.
 */
export async function listInstalledPluginSources(userData: string): Promise<PluginSource[]> {
  const root = path.join(userData, "plugins", "installed");
  try {
    const entries = await readdir(root, { withFileTypes: true });
    const sources: PluginSource[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const directory = path.join(root, entry.name);
      try {
        await stat(path.join(directory, MANIFEST_FILE));
        sources.push({ kind: "development", directory });
      } catch {
        // skip incomplete folders
      }
    }
    return sources;
  } catch {
    return [];
  }
}

/**
 * Installs a Python plugin from a single `.py` file content (or wraps a script that doesn't yet
 * have a `kobrixa-plugin.json`) into `<userData>/plugins/installed/<slug>`.
 */
export async function installPythonFilePlugin(
  userData: string,
  payload: InstalledPythonPluginPayload,
): Promise<{ pluginId: string; directory: string }> {
  const slug = sanitizeSlug(payload.id || payload.filename);
  const pluginId = slug.includes(".") ? slug : `user.${slug}`;
  const commandId = `${pluginId}.run`;
  const displayTitle =
    payload.name?.trim() || payload.filename.replace(/\.py$/i, "") || "Python Plugin";

  const nameMatch = payload.content.match(/@name\s+([^\r\n]+)/);
  const title = nameMatch?.[1]?.trim() || displayTitle;

  const directory = path.join(userData, "plugins", "installed", pluginId);
  await mkdir(directory, { recursive: true });

  // If the .py file already uses `from kobrixa import Plugin`, keep its code and extract any @plugin.command ids;
  // otherwise wrap it so clicking "執行 / Run" in Kobrixa executes the script and displays its output!
  const commandMatches = [...payload.content.matchAll(/@\w+\.command\(\s*["']([^"']+)["']\s*\)/g)]
    .map((m) => m[1]!)
    .filter((id) => id.startsWith(`${pluginId}.`));

  let entryContent = payload.content;
  const commands =
    commandMatches.length > 0
      ? commandMatches.map((id) => ({
          id,
          title: { en: `Run ${title}`, "zh-TW": `執行 ${title}` },
        }))
      : [
          {
            id: commandId,
            title: { en: `Run ${title}`, "zh-TW": `執行 ${title}` },
          },
        ];

  if (
    !payload.content.includes("from kobrixa import") &&
    !payload.content.includes("import kobrixa")
  ) {
    entryContent = `from kobrixa import Plugin
import io
import contextlib

plugin = Plugin()

def _user_script():
${payload.content
  .split(/\r?\n/)
  .map((line) => "    " + line)
  .join("\n")}

@plugin.command("${commandId}")
async def _run_script(ctx):
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
        _user_script()
    out = buf.getvalue().strip()
    await ctx.ui.show_message(out if out else (${JSON.stringify(`🐍 Python 插件「${title}」執行完成！`)} if ctx.locale == "zh-TW" else ${JSON.stringify(`🐍 Python plugin "${title}" finished!`)}))

if __name__ == "__main__":
    plugin.run()
`;
  }

  const manifest = {
    id: pluginId,
    version: "1.0.0",
    apiVersion: "^1.0.0",
    displayName: { en: title, "zh-TW": title },
    runtime: { kind: "python", entry: "main.py" },
    activationEvents: commands.map((c) => `onCommand:${c.id}`),
    permissions: ["ui.notifications"],
    contributes: { commands },
  };

  await writeFile(path.join(directory, "main.py"), entryContent, "utf8");
  await writeFile(path.join(directory, MANIFEST_FILE), JSON.stringify(manifest, null, 2), "utf8");
  return { pluginId, directory };
}

/**
 * Installs a plugin folder (containing `kobrixa-plugin.json` or a `.py` file) into `<userData>/plugins/installed/`.
 */
export async function installPluginDirectory(
  userData: string,
  sourcePath: string,
): Promise<{ pluginId: string; directory: string }> {
  const info = await stat(sourcePath);
  if (info.isFile() && sourcePath.toLowerCase().endsWith(".py")) {
    const content = await readFile(sourcePath, "utf8");
    return installPythonFilePlugin(userData, {
      filename: path.basename(sourcePath),
      content,
    });
  }
  if (!info.isDirectory()) {
    throw new Error("Please select a plugin folder, a .py file, or a .kbr file.");
  }
  const manifestPath = path.join(sourcePath, MANIFEST_FILE);
  try {
    const raw = JSON.parse(await readFile(manifestPath, "utf8")) as { id?: string };
    const folderName = sanitizeSlug(raw.id || path.basename(sourcePath));
    const targetDir = path.join(userData, "plugins", "installed", folderName);
    await rm(targetDir, { recursive: true, force: true });
    await mkdir(path.dirname(targetDir), { recursive: true });
    await cp(sourcePath, targetDir, { recursive: true });
    return { pluginId: raw.id || folderName, directory: targetDir };
  } catch {
    // Check if the directory has a main.py or any .py file
    const files = await readdir(sourcePath);
    const pyFile = files.find((f) => f === "main.py") ?? files.find((f) => f.endsWith(".py"));
    if (pyFile) {
      const content = await readFile(path.join(sourcePath, pyFile), "utf8");
      return installPythonFilePlugin(userData, {
        filename: path.basename(sourcePath),
        content,
      });
    }
    throw new Error(
      `No ${MANIFEST_FILE} or Python (.py) file found in ${path.basename(sourcePath)}.`,
    );
  }
}

export async function uninstallInstalledPlugin(userData: string, pluginId: string): Promise<void> {
  const installedRoot = path.join(userData, "plugins", "installed");
  try {
    const entries = await readdir(installedRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(installedRoot, entry.name);
      try {
        const raw = JSON.parse(await readFile(path.join(dir, MANIFEST_FILE), "utf8")) as {
          id?: string;
        };
        if (raw.id === pluginId || entry.name === pluginId) {
          await rm(dir, { recursive: true, force: true });
        }
      } catch {
        if (entry.name === pluginId) {
          await rm(dir, { recursive: true, force: true });
        }
      }
    }
  } catch {
    // ignore if installed root doesn't exist
  }
}
