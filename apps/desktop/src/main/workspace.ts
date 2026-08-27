import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { app, dialog } from "electron";
import { loadProject, resolveInside, type SourceProject } from "@kobrixa/compiler";
import type { WorkspaceSummary } from "../shared/api.js";

interface WorkspaceRecord {
  id: string;
  inputPath: string;
  root: string;
  selectedEntry?: string;
}

export class WorkspaceService {
  readonly #records = new Map<string, WorkspaceRecord>();

  async open(): Promise<WorkspaceSummary | undefined> {
    const result = await dialog.showOpenDialog({
      title: "Open Kobrixa project",
      properties: ["openFile", "openDirectory"],
      filters: [{ name: "Kobrixa", extensions: ["json", "bp"] }],
    });
    const inputPath = result.filePaths[0];
    return inputPath ? this.register(inputPath) : undefined;
  }

  async create(name: string): Promise<WorkspaceSummary | undefined> {
    const safe = name
      .trim()
      .replace(/[^A-Za-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!safe) throw new Error("Project name must contain letters or numbers.");
    const result = await dialog.showOpenDialog({
      title: "Choose project location",
      properties: ["openDirectory", "createDirectory"],
    });
    const parent = result.filePaths[0];
    if (!parent) return undefined;
    const root = path.join(parent, safe);
    const sourceDir = path.join(root, "src");
    await mkdir(sourceDir, { recursive: true });
    const manifest = {
      schemaVersion: 1,
      name: safe,
      language: "bp",
      entry: "src/main.bp",
      target: "ev3-native",
      assets: ["assets/**/*"],
      outputDir: "build",
    };
    await writeFile(path.join(root, "kobrixa.json"), `${JSON.stringify(manifest, null, 2)}\n`, {
      flag: "wx",
    });
    await writeFile(
      path.join(sourceDir, "main.bp"),
      'LCD.Clear()\nLCD.Text(8, 18, "Hello from Kobrixa")\nLCD.Update()\n',
      { flag: "wx" },
    );
    return this.register(root);
  }

  async selectEntry(id: string, entry: string): Promise<WorkspaceSummary> {
    const record = this.require(id);
    record.selectedEntry = entry;
    return this.summary(record);
  }

  async read(id: string, file: string): Promise<string> {
    const record = this.require(id);
    return readFile(await resolveInside(record.root, file), "utf8");
  }

  async write(id: string, file: string, content: string): Promise<void> {
    const record = this.require(id);
    const target = await resolveInside(record.root, file);
    const temporary = `${target}.${randomUUID()}.tmp`;
    await writeFile(temporary, content, "utf8");
    await rename(temporary, target);
    await this.saveDraft(id, file, undefined);
  }

  async saveDraft(id: string, file: string, content: string | undefined): Promise<void> {
    const record = this.require(id);
    await resolveInside(record.root, file);
    const directory = this.draftDirectory(record.root);
    const target = path.join(directory, `${createHash("sha256").update(file).digest("hex")}.json`);
    if (content === undefined) await rm(target, { force: true });
    else {
      await mkdir(directory, { recursive: true });
      await writeFile(target, JSON.stringify({ file, content }), "utf8");
    }
  }

  async project(id: string, overlays: ReadonlyMap<string, string>): Promise<SourceProject> {
    const record = this.require(id);
    const result = await loadProject(record.inputPath, overlays, record.selectedEntry);
    if (!result.project)
      throw new Error(
        result.diagnostics.map((item) => item.message).join("\n") ||
          "Choose an entry file before building.",
      );
    return result.project;
  }

  private async register(inputPath: string): Promise<WorkspaceSummary> {
    const loaded = await loadProject(inputPath);
    const statRoot =
      loaded.project?.root ?? (path.extname(inputPath) ? path.dirname(inputPath) : inputPath);
    const record: WorkspaceRecord = { id: randomUUID(), inputPath, root: statRoot };
    this.#records.set(record.id, record);
    return this.summary(record);
  }

  private async summary(record: WorkspaceRecord): Promise<WorkspaceSummary> {
    const loaded = await loadProject(record.inputPath, new Map(), record.selectedEntry);
    const files = await this.listSourceFiles(record.root);
    const drafts = await this.loadDrafts(record.root);
    const manifest = loaded.project?.manifest;
    return {
      id: record.id,
      name: manifest?.name ?? path.basename(record.root),
      rootLabel: path.basename(record.root),
      files,
      ...(manifest ? { manifest } : {}),
      implicit: loaded.implicit,
      entryCandidates: loaded.candidates ?? [],
      drafts,
    };
  }

  private async listSourceFiles(root: string): Promise<string[]> {
    const entries = await readdir(root, { recursive: true, withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.(bp|bpi|bpm|json)$/i.test(entry.name))
      .map((entry) =>
        path.relative(root, path.join(entry.parentPath, entry.name)).replaceAll(path.sep, "/"),
      )
      .filter((file) => !file.startsWith("build/"))
      .sort();
  }

  private draftDirectory(root: string): string {
    return path.join(
      app.getPath("userData"),
      "drafts",
      createHash("sha256").update(root).digest("hex"),
    );
  }

  private async loadDrafts(root: string): Promise<Record<string, string>> {
    const directory = this.draftDirectory(root);
    try {
      const files = await readdir(directory);
      const drafts: Record<string, string> = {};
      for (const file of files) {
        const value: unknown = JSON.parse(await readFile(path.join(directory, file), "utf8"));
        if (
          value &&
          typeof value === "object" &&
          "file" in value &&
          "content" in value &&
          typeof value.file === "string" &&
          typeof value.content === "string"
        ) {
          drafts[value.file] = value.content;
        }
      }
      return drafts;
    } catch {
      return {};
    }
  }

  private require(id: string): WorkspaceRecord {
    const record = this.#records.get(id);
    if (!record) throw new Error("Unknown workspace.");
    return record;
  }
}
