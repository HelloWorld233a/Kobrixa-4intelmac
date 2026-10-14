import { z } from "zod";
import { namespacedIdSchema } from "@kobrixa/plugin-protocol";
import type { PluginActionResult, PluginManager } from "@kobrixa/plugin-runtime";
import type { InstallPythonFileRequest, PluginEvent } from "../../shared/plugins.js";
import type { IpcHandle } from "../ipc.js";

const installFileSchema = z.strictObject({
  filename: z.string().min(1).max(255),
  content: z
    .string()
    .min(1)
    .max(2 * 1024 * 1024),
  id: z.string().min(1).max(128).optional(),
  name: z.string().min(1).max(200).optional(),
});

export interface PluginInstallHost {
  installFile?(request: InstallPythonFileRequest): Promise<PluginActionResult>;
  installFromDisk?(): Promise<PluginActionResult>;
  uninstall?(pluginId: string): Promise<PluginActionResult>;
}

export function registerPluginIpc(
  handle: IpcHandle,
  plugins: Pick<PluginManager, "state" | "executeCommand" | "setEnabled" | "onEvent">,
  publish: (event: PluginEvent) => void,
  installer?: PluginInstallHost,
): () => void {
  handle("plugins:state", () => plugins.state());
  handle("plugins:execute", (_event, commandId: unknown) =>
    plugins.executeCommand(namespacedIdSchema.parse(commandId)),
  );
  handle("plugins:set-enabled", (_event, pluginId: unknown, enabled: unknown) =>
    plugins.setEnabled(namespacedIdSchema.parse(pluginId), z.boolean().parse(enabled)),
  );
  if (installer?.installFile) {
    const installFile = installer.installFile;
    handle("plugins:install-file", (_event, request: unknown) => {
      const parsed = installFileSchema.parse(request);
      return installFile({
        filename: parsed.filename,
        content: parsed.content,
        ...(parsed.id ? { id: parsed.id } : {}),
        ...(parsed.name ? { name: parsed.name } : {}),
      });
    });
  }
  if (installer?.installFromDisk) {
    const installFromDisk = installer.installFromDisk;
    handle("plugins:install-disk", () => installFromDisk());
  }
  if (installer?.uninstall) {
    const uninstall = installer.uninstall;
    handle("plugins:uninstall", (_event, pluginId: unknown) =>
      uninstall(namespacedIdSchema.parse(pluginId)),
    );
  }
  return plugins.onEvent(publish);
}
