import type {
  BuildArtifact,
  BuildProgress,
  CompileResult,
  Diagnostic,
  ProjectManifest,
} from "@kobrixa/compiler";
import type { DeviceDescriptor, DeviceErrorCategory } from "@kobrixa/device";

export interface WorkspaceSummary {
  id: string;
  name: string;
  rootLabel: string;
  files: string[];
  manifest?: ProjectManifest;
  implicit: boolean;
  entryCandidates: string[];
  drafts: Record<string, string>;
}

export type BuildEvent =
  | { type: "progress"; workspaceId: string; progress: BuildProgress }
  | { type: "complete"; workspaceId: string; buildId: string; result: CompileResult };

export type DeviceEvent =
  | {
      type: "state";
      state: "disconnected" | "connecting" | "connected" | "busy" | "error";
      sessionId?: string;
      transport?: string;
    }
  | { type: "error"; category: DeviceErrorCategory; message: string; recoverable: boolean };

export interface KobrixaApi {
  workspace: {
    open(): Promise<WorkspaceSummary | undefined>;
    create(name: string): Promise<WorkspaceSummary | undefined>;
    selectEntry(workspaceId: string, entry: string): Promise<WorkspaceSummary>;
    read(workspaceId: string, file: string): Promise<string>;
    write(workspaceId: string, file: string, content: string): Promise<void>;
    saveDraft(workspaceId: string, file: string, content: string | undefined): Promise<void>;
  };
  build: {
    start(workspaceId: string, overlays: Record<string, string>): Promise<string>;
    cancel(buildId: string): Promise<void>;
    artifacts(buildId: string): Promise<BuildArtifact[]>;
    onEvent(listener: (event: BuildEvent) => void): () => void;
  };
  device: {
    discover(): Promise<DeviceDescriptor[]>;
    connect(descriptor: DeviceDescriptor): Promise<string>;
    connectWifi(address: string): Promise<string>;
    disconnect(sessionId: string): Promise<void>;
    upload(sessionId: string, buildId: string, remotePath: string): Promise<void>;
    run(sessionId: string, remotePath: string): Promise<void>;
    stop(sessionId: string): Promise<void>;
    delete(sessionId: string, remotePath: string): Promise<void>;
    onEvent(listener: (event: DeviceEvent) => void): () => void;
  };
}

export type { BuildArtifact, CompileResult, Diagnostic, DeviceDescriptor };
