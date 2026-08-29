import { BasicPlusFrontend } from "@kobrixa/basic-plus";
import type { Diagnostic } from "@kobrixa/compiler";
import type { WorkspaceService } from "./workspace.js";

export class LanguageService {
  constructor(private readonly workspaces: Pick<WorkspaceService, "project">) {}

  async diagnostics(workspaceId: string, overlays: Record<string, string>): Promise<Diagnostic[]> {
    const project = await this.workspaces.project(workspaceId, new Map(Object.entries(overlays)));
    const result = await new BasicPlusFrontend().compile(project, new AbortController().signal);
    return result.diagnostics;
  }
}
