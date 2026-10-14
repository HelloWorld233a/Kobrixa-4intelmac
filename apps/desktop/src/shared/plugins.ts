import type {
  PluginActionResult,
  PluginCommandResult,
  PluginManagerEvent,
  PluginNotice,
  PluginsSnapshot,
  PluginSummary,
} from "@kobrixa/plugin-runtime";
import type { LocalizedText } from "@kobrixa/plugin-protocol";

export type {
  LocalizedText,
  PluginActionResult,
  PluginCommandResult,
  PluginNotice,
  PluginsSnapshot,
  PluginSummary,
};
export type PluginEvent = PluginManagerEvent;
export interface InstallPythonFileRequest {
  filename: string;
  content: string;
  id?: string;
  name?: string;
}
export interface PluginsApi {
  state(): Promise<PluginsSnapshot>;
  execute(commandId: string): Promise<PluginCommandResult>;
  setEnabled(pluginId: string, enabled: boolean): Promise<PluginActionResult>;
  installFile?(request: InstallPythonFileRequest): Promise<PluginActionResult>;
  installFromDisk?(): Promise<PluginActionResult>;
  uninstall?(pluginId: string): Promise<PluginActionResult>;
  onEvent(listener: (event: PluginEvent) => void): () => void;
}
