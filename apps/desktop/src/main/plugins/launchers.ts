import { spawnSync } from "node:child_process";
import { MessageChannelMain, utilityProcess } from "electron";
import {
  escalatingKill,
  ExitSignal,
  OutputTail,
  PluginError,
  spawnPluginProcess,
  type LaunchablePlugin,
  type PluginLauncher,
  type PluginProcess,
} from "@kobrixa/plugin-runtime";

let cachedAutoPython: string | null | undefined;

/** Automatically finds a usable Python 3.10+ interpreter so users don't need CLI flags. */
export function detectSystemPython(): string | undefined {
  if (cachedAutoPython !== undefined) return cachedAutoPython ?? undefined;
  const candidates = [
    process.env.KOBRIXA_TEST_PYTHON,
    "python3",
    "/opt/homebrew/bin/python3",
    "/usr/local/bin/python3",
    "/usr/bin/python3",
    "python",
  ].filter((item): item is string => Boolean(item));
  const found = candidates.find((cmd) => {
    try {
      return (
        spawnSync(cmd, ["-c", "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)"], {
          timeout: 3000,
        }).status === 0
      );
    } catch {
      return false;
    }
  });
  cachedAutoPython = found ?? null;
  return found;
}

async function launchNode(plugin: LaunchablePlugin): Promise<PluginProcess> {
  const child = utilityProcess.fork(plugin.entry, [], {
    cwd: plugin.directory,
    serviceName: `Kobrixa plugin ${plugin.id}`,
    stdio: "pipe",
  });
  await new Promise<void>((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("exit", (code) =>
      reject(new Error(`The plugin process exited during launch (code ${code}).`)),
    );
  });
  const { port1, port2 } = new MessageChannelMain();
  child.postMessage({ type: "kobrixa-plugin-port" }, [port2]);
  port1.start();
  const tail = new OutputTail();
  child.stdout?.on("data", (chunk: Buffer) => tail.push(chunk));
  child.stderr?.on("data", (chunk: Buffer) => tail.push(chunk));
  const exits = new ExitSignal();
  child.once("exit", (code) => {
    port1.close();
    exits.emit({ code });
  });
  const kill = escalatingKill(
    exits,
    () => child.kill(),
    () => {
      try {
        if (child.pid !== undefined) process.kill(child.pid, "SIGKILL");
        else child.kill();
      } catch {
        /* The process already exited. */
      }
    },
  );
  return {
    send: (text) => port1.postMessage(text),
    onMessage: (listener) => {
      const handler = (event: Electron.MessageEvent) =>
        listener(typeof event.data === "string" ? event.data : "");
      port1.on("message", handler);
      return () => port1.off("message", handler);
    },
    onExit: (listener) => exits.subscribe(listener),
    ...kill,
    stderrTail: () => tail.text(),
  };
}

export function createDesktopLauncher(options: {
  python?: string;
  sdkPythonPath?: string;
}): PluginLauncher {
  return async (plugin) => {
    if (plugin.runtime === "node") return launchNode(plugin);
    const python = options.python || detectSystemPython();
    if (!python)
      throw new PluginError(
        "PLUGIN_E_LAUNCH",
        "Python 3.10+ was not found on this computer. Please install Python 3.10+ to run Python plugins.",
      );
    const existingPythonPath = process.env.PYTHONPATH;
    const pythonPath = options.sdkPythonPath
      ? existingPythonPath
        ? `${options.sdkPythonPath}${process.platform === "win32" ? ";" : ":"}${existingPythonPath}`
        : options.sdkPythonPath
      : existingPythonPath;
    return spawnPluginProcess(python, ["-u", plugin.entry], {
      cwd: plugin.directory,
      env: {
        ...process.env,
        ...(pythonPath ? { PYTHONPATH: pythonPath } : {}),
        PYTHONUNBUFFERED: "1",
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      },
    });
  };
}
