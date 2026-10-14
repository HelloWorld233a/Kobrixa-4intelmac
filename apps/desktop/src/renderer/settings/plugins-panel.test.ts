// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { PluginEvent, PluginsSnapshot } from "../../shared/plugins.js";
import { detectPluginPackage, PluginsPanel } from "./plugins-panel.js";

let root: Root;
let container: HTMLDivElement;
let emit: (event: PluginEvent) => void;
const snapshot: PluginsSnapshot = {
  safeMode: false,
  developmentMode: true,
  plugins: [
    {
      id: "kobrixa.basic-plus",
      source: "builtin",
      runtime: "builtin",
      version: "1.0.0",
      status: "enabled",
      running: false,
      problems: [],
      commands: [],
      displayName: "Basic Plus",
    },
    {
      id: "acme.hello",
      source: "development",
      runtime: "python",
      version: "1.0.0",
      status: "enabled",
      running: false,
      problems: [{ code: "PLUGIN_E_LAUNCH", message: "python not found" }],
      commands: [{ id: "acme.hello.greet", title: { en: "Greet", "zh-TW": "打招呼" } }],
    },
  ],
};
const api = {
  state: vi.fn(async () => snapshot),
  execute: vi.fn(async () => ({
    ok: false as const,
    code: "PLUGIN_E_LAUNCH" as const,
    message: "python not found",
  })),
  setEnabled: vi.fn(async () => ({
    ok: true as const,
    state: {
      ...snapshot,
      plugins: [
        snapshot.plugins[0]!,
        {
          ...snapshot.plugins[1]!,
          status: "disabled" as const,
          disabledBy: "user" as const,
          commands: [],
        },
      ],
    },
  })),
  onEvent: vi.fn((listener: (event: PluginEvent) => void) => {
    emit = listener;
    return () => {};
  }),
};
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Object.assign(window, { kobrixa: { plugins: api } });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const render = async () => {
  await act(async () => root.render(createElement(PluginsPanel, { locale: "zh-TW" })));
};
const button = (text: string) =>
  [...container.querySelectorAll("button")].find((item) => item.textContent?.includes(text))!;

it("lists plugins in Traditional Chinese with the trust warning and problems", async () => {
  await render();
  expect(container.textContent).toContain("並不是沙箱");
  expect(container.textContent).toContain("acme.hello");
  expect(container.textContent).toContain("找不到 Python");
  expect(button("打招呼").disabled).toBe(false);
});

it("runs a command and shows the translated failure", async () => {
  await render();
  await act(async () => button("打招呼").click());
  expect(api.execute).toHaveBeenCalledWith("acme.hello.greet");
  expect(container.querySelector("[role=alert]")?.textContent).toContain("python not found");
});

it("disables development plugins but never offers it for built-ins", async () => {
  await render();
  const toggles = [...container.querySelectorAll("button")].filter(
    (item) => item.textContent === "停用",
  );
  expect(toggles).toHaveLength(1);
  await act(async () => toggles[0]!.click());
  expect(api.setEnabled).toHaveBeenCalledWith("acme.hello", false);
  expect(container.textContent).toContain("已停用");
});

it("shows notices with their plugin id", async () => {
  await render();
  await act(async () =>
    emit({
      type: "notice",
      notice: { pluginId: "acme.hello", severity: "info", message: "哈囉", at: 0 },
    }),
  );
  expect(container.querySelector("[aria-live=polite]")?.textContent).toContain("acme.hello");
  expect(container.querySelector("[aria-live=polite]")?.textContent).toContain("哈囉");
});

it("explains how to load development plugins and safe mode", async () => {
  api.state.mockResolvedValueOnce({
    safeMode: true,
    developmentMode: false,
    plugins: [snapshot.plugins[0]!],
  });
  await render();
  expect(container.textContent).toContain("--plugin-dev-dir");
  expect(container.textContent).toContain("安全模式");
});

it("shows an alert instead of hanging on loading when IPC state() or execute() rejects", async () => {
  api.state.mockRejectedValueOnce(new Error("ipc channel closed"));
  await render();
  expect(container.textContent).not.toContain("正在載入插件…");
  expect(container.querySelector("[role=alert]")?.textContent).toContain("ipc channel closed");

  await act(async () => emit({ type: "state", state: snapshot }));
  api.execute.mockRejectedValueOnce(new Error("execute ipc rejected"));
  await act(async () => button("打招呼").click());
  expect(container.querySelector("[role=alert]")?.textContent).toContain("execute ipc rejected");
});

it("detects whether a plugin file is .kbr or Python before installing", () => {
  const py = detectPluginPackage("sensor_tool.py", "from kobrixa import Plugin\nprint(123)");
  expect(py.detectedType).toBe("python");
  expect(py.id).toBe("user.sensor-tool");

  const pyManifest = detectPluginPackage(
    "kobrixa-plugin.json",
    JSON.stringify({
      id: "acme.py-tool",
      version: "1.2.0",
      runtime: { kind: "python", entry: "main.py" },
    }),
  );
  expect(pyManifest.detectedType).toBe("python");
  expect(pyManifest.id).toBe("acme.py-tool");

  const kbr = detectPluginPackage(
    "my-widget.kbr",
    "// @name My Widget\nexport function activate(ctx) {}",
  );
  expect(kbr.detectedType).toBe("kbr");
  expect(kbr.name).toBe("My Widget");
});
