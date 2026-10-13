// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  activatePlugin,
  deactivatePlugin,
  exportPluginToKbr,
  getPluginRuntimeStates,
  loadSavedPlugins,
  parseKbrFile,
  saveOrUpdatePlugin,
  togglePlugin,
} from "./plugin-manager.js";
import type { KobrixaPluginManifest } from "./plugin-types.js";

beforeEach(() => {
  localStorage.clear();
  document.head.innerHTML = "";
  document.body.innerHTML = '<div class="preferences"></div><footer></footer>';
});

afterEach(() => {
  localStorage.clear();
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

it("loads default builtin plugins when localStorage is empty", () => {
  const plugins = loadSavedPlugins();
  expect(plugins.length).toBeGreaterThan(0);
  expect(plugins.some((p) => p.id === "kbr-topbar-clock")).toBe(true);
});

it("activates a plugin, injects styles, and mounts DOM elements", () => {
  const manifest: KobrixaPluginManifest = {
    id: "test-plugin",
    name: "測試插件",
    version: "1.0.0",
    enabled: true,
    code: `
      export function activate(context) {
        context.ui.injectStyle("test-style", ".test-box { color: red; }");
        const el = document.createElement("div");
        el.className = "test-mounted";
        context.ui.addHeaderItem("btn", el);
      }
    `,
  };

  const ok = activatePlugin(manifest);
  expect(ok).toBe(true);

  // 驗證樣式是否成功注入
  const styleEl = document.getElementById("kbr-style-test-plugin-test-style");
  expect(styleEl).not.toBeNull();
  expect(styleEl?.textContent).toContain(".test-box { color: red; }");

  // 驗證 DOM 元素是否成功掛載
  const mounted = document.querySelector(".test-mounted");
  expect(mounted).not.toBeNull();

  // 停用插件後，樣式與 DOM 元素應自動清除
  deactivatePlugin("test-plugin");
  expect(document.getElementById("kbr-style-test-plugin-test-style")).toBeNull();
  expect(document.querySelector(".test-mounted")).toBeNull();
});

it("supports scoped plugin storage (get, set, remove)", () => {
  const manifest: KobrixaPluginManifest = {
    id: "storage-plugin",
    name: "儲存插件",
    version: "1.0.0",
    enabled: true,
    code: `
      export function activate(context) {
        context.storage.set("myKey", { count: 42 });
      }
    `,
  };

  activatePlugin(manifest);
  const raw = localStorage.getItem("kobrixa.plugin.storage-plugin.myKey");
  expect(raw).toBe(JSON.stringify({ count: 42 }));

  deactivatePlugin("storage-plugin");
});

it("handles syntax/runtime error gracefully and marks plugin status as error", () => {
  const errorManifest: KobrixaPluginManifest = {
    id: "bad-plugin",
    name: "錯誤插件",
    version: "1.0.0",
    enabled: true,
    code: `
      export function activate(context) {
        throw new Error("刻意引發的錯誤測試");
      }
    `,
  };

  const ok = activatePlugin(errorManifest);
  expect(ok).toBe(false);

  const states = getPluginRuntimeStates();
  const state = states.find((s) => s.manifest.id === "bad-plugin");
  expect(state?.status).toBe("error");
  expect(state?.lastError).toContain("刻意引發的錯誤測試");
});

it("toggles plugin state and persists to storage", () => {
  saveOrUpdatePlugin({
    id: "toggle-test",
    name: "切換測試",
    version: "1.0.0",
    enabled: false,
    code: `
      export function activate(context) {
        context.ui.injectStyle("s", "body { margin: 0; }");
      }
    `,
  });

  expect(document.getElementById("kbr-style-toggle-test-s")).toBeNull();

  // 切換啟用
  const enabled = togglePlugin("toggle-test");
  expect(enabled).toBe(true);
  expect(document.getElementById("kbr-style-toggle-test-s")).not.toBeNull();

  // 切換停用
  const disabled = togglePlugin("toggle-test");
  expect(disabled).toBe(false);
  expect(document.getElementById("kbr-style-toggle-test-s")).toBeNull();
});

it("exports plugin to .kbr and parses back faithfully", () => {
  const original: KobrixaPluginManifest = {
    id: "custom-kbr",
    name: "客製化插件",
    version: "2.1.0",
    author: "Jimmy Li",
    description: "這是一個測試插件",
    enabled: true,
    icon: "💎",
    code: "console.log('Hello .kbr!');",
  };

  const kbrContent = exportPluginToKbr(original);
  expect(kbrContent).toContain('"id": "custom-kbr"');

  const parsed = parseKbrFile(kbrContent, "custom-kbr.kbr");
  expect(parsed.id).toBe("custom-kbr");
  expect(parsed.name).toBe("客製化插件");
  expect(parsed.version).toBe("2.1.0");
  expect(parsed.author).toBe("Jimmy Li");
  expect(parsed.code).toBe("console.log('Hello .kbr!');");
});

it("parses script-style .kbr file with header metadata annotations", () => {
  const scriptKbr = `
// ==KobrixaPlugin==
// @id script-kbr
// @name 腳本插件
// @version 1.5.0
// @author Jimmy
// @description 透過註解定義的插件
// @icon 🌟
// ==/KobrixaPlugin==

export function activate(context) {
  context.ui.showToast("Hello from script .kbr!");
}
  `;

  const parsed = parseKbrFile(scriptKbr, "script-kbr.kbr");
  expect(parsed.id).toBe("script-kbr");
  expect(parsed.name).toBe("腳本插件");
  expect(parsed.version).toBe("1.5.0");
  expect(parsed.author).toBe("Jimmy");
  expect(parsed.description).toBe("透過註解定義的插件");
  expect(parsed.icon).toBe("🌟");
  expect(parsed.code).toContain("showToast");
});
