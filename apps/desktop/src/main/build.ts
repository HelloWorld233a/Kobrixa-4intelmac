import { readFile } from "node:fs/promises";
import { BuildSession, type BuildArtifact } from "@kobrixa/compiler";
import { BasicPlusFrontend } from "@kobrixa/basic-plus";
import { EV3Backend } from "@kobrixa/backend-ev3";
import type { WebContents } from "electron";
import type { BuildEvent } from "../shared/api.js";
import type { WorkspaceService } from "./workspace.js";

interface BuildRecord {
  session: BuildSession;
  artifacts: BuildArtifact[];
}

export class BuildService {
  readonly #builds = new Map<string, BuildRecord>();

  constructor(
    private readonly workspaces: WorkspaceService,
    private readonly renderer: () => WebContents | undefined,
  ) {}

  async start(workspaceId: string, overlays: Record<string, string>): Promise<string> {
    const project = await this.workspaces.project(workspaceId, new Map(Object.entries(overlays)));
    const session = new BuildSession(new BasicPlusFrontend(), new EV3Backend(), (progress) => {
      this.send({ type: "progress", workspaceId, progress });
    });
    const record: BuildRecord = { session, artifacts: [] };
    this.#builds.set(session.id, record);
    void session.compile(project).then((result) => {
      record.artifacts = result.artifacts;
      this.send({ type: "complete", workspaceId, buildId: session.id, result });
    });
    return session.id;
  }

  cancel(buildId: string): void {
    this.require(buildId).session.cancel();
  }

  artifacts(buildId: string): BuildArtifact[] {
    return [...this.require(buildId).artifacts];
  }

  async artifactBytes(buildId: string): Promise<Uint8Array> {
    const artifact = this.require(buildId).artifacts.find((item) => item.kind === "rbf");
    if (!artifact) throw new Error("This build has no deployable .rbf artifact.");
    return readFile(artifact.path);
  }

  private require(id: string): BuildRecord {
    const record = this.#builds.get(id);
    if (!record) throw new Error("Unknown build.");
    return record;
  }

  private send(event: BuildEvent): void {
    this.renderer()?.send("build:event", event);
  }
}
