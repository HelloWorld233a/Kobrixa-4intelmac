// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  activatePlugin,
  checkPluginSyntax,
  deactivatePlugin,
  exportPluginToKbr,
  extractPluginSettingsSchema,
  getPluginRuntimeStates,
  getPluginSettingsValues,
  loadSavedPlugins,
  parseKbrFile,
  resetPluginSettings,
  saveOrUpdatePlugin,
  setPluginSettingValue,
  togglePlugin,
  transpilePluginCode,
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

it("loads default builtin TypeScript plugins when localStorage is empty", () => {
  const plugins = loadSavedPlugins();
  expect(plugins.length).toBeGreaterThan(0);
  expect(plugins.some((p) => p.id === "kbr-topbar-clock")).toBe(true);
  for (const plugin of plugins) {
    const check = checkPluginSyntax(plugin.code);
    expect(check.valid).toBe(true);
  }
});

it("validates TypeScript plugin syntax with export, interfaces, and type annotations without error", () => {
  const tsPluginCode = `
    export interface CustomConfig {
      title: string;
      speed: number;
    }

    export const settingsSchema: PluginSettingField[] = [
      { key: "title", label: "標題", type: "string", default: "Hello TS" },
    ];

    export function activate(context: KobrixaPluginContext): void {
      const msg: string = context.settings.get<string>("title", "Hello TS");
      const el: HTMLDivElement = document.createElement("div") as HTMLDivElement;
      el.textContent = msg;
    }
  `;

  const result = checkPluginSyntax(tsPluginCode);
  expect(result.valid).toBe(true);
  expect(result.error).toBeUndefined();

  const badResult = checkPluginSyntax("export function activate(context {");
  expect(badResult.valid).toBe(false);
  expect(badResult.error).toBeDefined();
});

it("extracts settingsSchema from TypeScript plugin code and manages live plugin settings", () => {
  const manifest: KobrixaPluginManifest = {
    id: "ts-settings-plugin",
    name: "TS 設置測試插件",
    version: "1.0.0",
    enabled: true,
    code: `
      export const settingsSchema: PluginSettingField[] = [
        { key: "greeting", label: "問候語", type: "string", default: "We love 14" },
        { key: "count", label: "次數", type: "number", default: 5 },
      ];

      export function activate(context: KobrixaPluginContext): void {
        const box: HTMLDivElement = document.createElement("div");
        box.id = "ts-setting-output";
        box.textContent = \`\${context.settings.get<string>("greeting")}#\${context.settings.get<number>("count")}\`;
        context.ui.addHeaderItem("box", box);

        context.settings.onChange((vals: Record<string, PluginSettingValue>): void => {
          box.textContent = \`\${vals.greeting}#\${vals.count}\`;
        });
      }
    `,
  };

  const schema = extractPluginSettingsSchema(manifest);
  expect(schema).toHaveLength(2);
  expect(schema[0]?.key).toBe("greeting");
  expect(schema[1]?.default).toBe(5);

  saveOrUpdatePlugin(manifest);
  expect(document.getElementById("ts-setting-output")?.textContent).toBe("We love 14#5");

  // 修改插件設置應即時觸發 onChange 並更新 DOM
  setPluginSettingValue("ts-settings-plugin", "greeting", "Hello Macau");
  setPluginSettingValue("ts-settings-plugin", "count", 14);
  expect(getPluginSettingsValues(manifest)).toEqual({
    greeting: "Hello Macau",
    count: 14,
  });
  expect(document.getElementById("ts-setting-output")?.textContent).toBe("Hello Macau#14");

  // 重置回預設值
  resetPluginSettings("ts-settings-plugin");
  expect(document.getElementById("ts-setting-output")?.textContent).toBe("We love 14#5");

  deactivatePlugin("ts-settings-plugin");
});

it("activates a TypeScript plugin, preserves CSS inside template literals, and mounts DOM elements", () => {
  const manifest: KobrixaPluginManifest = {
    id: "test-plugin",
    name: "測試插件",
    version: "1.0.0",
    enabled: true,
    code: `
      export function activate(context: KobrixaPluginContext): void {
        context.ui.injectStyle("test-style", \`.test-box { color: red; background: var(--surface, #000); }\`);
        const el: HTMLDivElement = document.createElement("div");
        el.className = "test-mounted";
        context.ui.addHeaderItem("btn", el);
      }
    `,
  };

  const transpiled = transpilePluginCode(manifest.code);
  expect(transpiled).toContain("color: red;");

  const ok = activatePlugin(manifest);
  expect(ok).toBe(true);

  const styleEl = document.getElementById("kbr-style-test-plugin-test-style");
  expect(styleEl).not.toBeNull();
  expect(styleEl?.textContent).toContain(".test-box { color: red;");

  const mounted = document.querySelector(".test-mounted");
  expect(mounted).not.toBeNull();

  deactivatePlugin("test-plugin");
  expect(document.getElementById("kbr-style-test-plugin-test-style")).toBeNull();
  expect(document.querySelector(".test-mounted")).toBeNull();
});

it("supports scoped plugin storage (get, set, remove) with TypeScript generics", () => {
  const manifest: KobrixaPluginManifest = {
    id: "storage-plugin",
    name: "儲存插件",
    version: "1.0.0",
    enabled: true,
    code: `
      export function activate(context: KobrixaPluginContext): void {
        context.storage.set<{ count: number }>("myKey", { count: 42 });
      }
    `,
  };

  activatePlugin(manifest);
  const raw = localStorage.getItem("kobrixa.plugin.storage-plugin.myKey");
  expect(raw).toBe(JSON.stringify({ count: 42 }));

  deactivatePlugin("storage-plugin");
});

it("handles runtime error gracefully and marks plugin status as error", () => {
  const errorManifest: KobrixaPluginManifest = {
    id: "bad-plugin",
    name: "錯誤插件",
    version: "1.0.0",
    enabled: true,
    code: `
      export function activate(context: KobrixaPluginContext): void {
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
      export function activate(context: KobrixaPluginContext): void {
        context.ui.injectStyle("s", "body { margin: 0; }");
      }
    `,
  });

  expect(document.getElementById("kbr-style-toggle-test-s")).toBeNull();

  const enabled = togglePlugin("toggle-test");
  expect(enabled).toBe(true);
  expect(document.getElementById("kbr-style-toggle-test-s")).not.toBeNull();

  const disabled = togglePlugin("toggle-test");
  expect(disabled).toBe(false);
  expect(document.getElementById("kbr-style-toggle-test-s")).toBeNull();
});

it("exports plugin to .kbr and parses back faithfully including settingsSchema", () => {
  const original: KobrixaPluginManifest = {
    id: "custom-kbr",
    name: "客製化 TS 插件",
    version: "2.1.0",
    author: "Jimmy Li",
    description: "這是一個測試插件",
    enabled: true,
    icon: "💎",
    code: `
      export const settingsSchema: PluginSettingField[] = [
        { key: "mode", label: "模式", type: "string", default: "pro" }
      ];
      export function activate(context: KobrixaPluginContext): void {
        console.log('Hello .kbr!');
      }
    `,
  };

  const kbrContent = exportPluginToKbr(original);
  expect(kbrContent).toContain('"id": "custom-kbr"');

  const parsed = parseKbrFile(kbrContent, "custom-kbr.kbr");
  expect(parsed.id).toBe("custom-kbr");
  expect(parsed.name).toBe("客製化 TS 插件");
  expect(parsed.settingsSchema).toHaveLength(1);
  expect(parsed.settingsSchema?.[0]?.key).toBe("mode");
});

it("parses script-style TypeScript .kbr file with header metadata and settingsSchema", () => {
  const scriptKbr = `
// ==KobrixaPlugin==
// @id script-kbr
// @name 腳本 TS 插件
// @version 1.5.0
// @author Jimmy
// @description 透過註解定義的 TypeScript 插件
// @icon 🌟
// ==/KobrixaPlugin==

export const settingsSchema: PluginSettingField[] = [
  { key: "toastText", label: "提示文字", type: "string", default: "Hello TS!" }
];

export function activate(context: KobrixaPluginContext): void {
  const msg: string = context.settings.get<string>("toastText", "Hello TS!");
  context.ui.showToast(msg);
}
  `;

  const parsed = parseKbrFile(scriptKbr, "script-kbr.kbr");
  expect(parsed.id).toBe("script-kbr");
  expect(parsed.name).toBe("腳本 TS 插件");
  expect(parsed.settingsSchema).toHaveLength(1);
  expect(parsed.settingsSchema?.[0]?.key).toBe("toastText");
});
