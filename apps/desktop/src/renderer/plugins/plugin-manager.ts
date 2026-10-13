import type {
  KobrixaPluginContext,
  KobrixaPluginManifest,
  PluginExecutionStatus,
  PluginRuntimeState,
  PluginSettingField,
  PluginSettingValue,
} from "./plugin-types.js";
import { BUILTIN_PLUGINS } from "./builtin-plugins.js";

const STORAGE_KEY = "kobrixa.plugins";
const SETTINGS_STORAGE_PREFIX = "kobrixa.pluginSettings.";
const EVENT_CHANGE = "kobrixa:plugins-change";

interface ActivePluginInstance {
  manifest: KobrixaPluginManifest;
  cleanupFns: (() => void)[];
  settingsListeners: ((values: Record<string, PluginSettingValue>) => void)[];
  status: PluginExecutionStatus;
  lastError?: string | undefined;
  lastExecutedAt?: number | undefined;
  logs: string[];
}

const activePlugins = new Map<string, ActivePluginInstance>();

/**
 * 將 TypeScript (.kbr) 插件原始碼轉譯為純 JavaScript
 * 使用詞法掃描器保護字串、樣板字串 (Template Literals) 與註解，並遞迴轉譯 ${...} 內的 TS 表達式
 */
export function transpilePluginCode(tsCode: string): string {
  const placeholders: string[] = [];
  const savePlaceholder = (text: string): string => {
    const id = `__KBR_PH_${placeholders.length}__`;
    placeholders.push(text);
    return id;
  };

  let masked = "";
  let i = 0;
  const len = tsCode.length;

  while (i < len) {
    const ch = tsCode[i];
    const next = tsCode[i + 1];

    // 單行註解
    if (ch === "/" && next === "/") {
      let end = i + 2;
      while (end < len && tsCode[end] !== "\n") end++;
      masked += savePlaceholder(tsCode.slice(i, end));
      i = end;
      continue;
    }

    // 多行註解
    if (ch === "/" && next === "*") {
      let end = i + 2;
      while (end < len && !(tsCode[end] === "*" && tsCode[end + 1] === "/")) end++;
      end = Math.min(len, end + 2);
      masked += savePlaceholder(tsCode.slice(i, end));
      i = end;
      continue;
    }

    // 單引號或雙引號字串
    if (ch === "'" || ch === '"') {
      const quote = ch;
      let end = i + 1;
      while (end < len) {
        if (tsCode[end] === "\\") {
          end += 2;
          continue;
        }
        if (tsCode[end] === quote) {
          end++;
          break;
        }
        end++;
      }
      masked += savePlaceholder(tsCode.slice(i, end));
      i = end;
      continue;
    }

    // 樣板字串 `...`，並遞迴轉譯內嵌的 ${...} TypeScript 表達式
    if (ch === "`") {
      let tpl = "`";
      let end = i + 1;
      while (end < len) {
        if (tsCode[end] === "\\") {
          tpl += tsCode.slice(end, end + 2);
          end += 2;
          continue;
        }
        if (tsCode[end] === "$" && tsCode[end + 1] === "{") {
          let depth = 1;
          let exprCursor = end + 2;
          while (exprCursor < len && depth > 0) {
            if (tsCode[exprCursor] === "{") depth++;
            else if (tsCode[exprCursor] === "}") depth--;
            exprCursor++;
          }
          const rawExpr = tsCode.slice(end + 2, exprCursor - 1);
          tpl += `\${${transpilePluginCode(rawExpr)}}`;
          end = exprCursor;
          continue;
        }
        if (tsCode[end] === "`") {
          tpl += "`";
          end++;
          break;
        }
        tpl += tsCode[end];
        end++;
      }
      masked += savePlaceholder(tpl);
      i = end;
      continue;
    }

    masked += ch;
    i++;
  }

  // 2. 移除 interface 宣告區塊 (支援巢狀大括號)
  masked = removeInterfaceBlocks(masked);

  // 3. 移除 import type 與 type alias 宣告
  masked = masked.replace(/^\s*import\s+type\s+[^\n;]+;?/gm, "");
  masked = masked.replace(/^\s*(?:export\s+)?type\s+[A-Za-z0-9_$]+(?:<[^>]+>)?\s*=\s*[^;]+;/gm, "");

  // 4. 轉換 export 關鍵字為本地宣告，讓 new Function 可直接執行並讀取
  masked = masked.replace(/\bexport\s+(async\s+)?function\s+([a-zA-Z0-9_$]+)/g, "$1function $2");
  masked = masked.replace(/\bexport\s+(const|let|var|class)\s+/g, "$1 ");
  masked = masked.replace(/\bexport\s+default\s+/g, "const __defaultExport = ");

  // 5. 移除泛型呼叫與函數泛型參數，如 .get<string>(...) 或 .set<{ count: number }>(...)
  masked = masked.replace(/([a-zA-Z0-9_$])\s*<[a-zA-Z0-9_$[\]{}:;|,&\s<>]+>\s*\(/g, "$1(");

  // 6. 移除變數型別標註，如 const x: string = ... 或 let count: Record<string, number>;
  masked = masked.replace(
    /\b(const|let|var)\s+([a-zA-Z0-9_$]+)\s*:\s*(?:[a-zA-Z0-9_$.[\]|&\s]|<[^>]*>|\{[^}]*\})+(?=\s*[=;])/g,
    "$1 $2",
  );

  // 7. 移除函數回傳型別標註，如 ): void { 或 ): Promise<Record<string, any>> =>
  masked = masked.replace(
    /\)\s*:\s*(?:[a-zA-Z0-9_$.[\]|&\s]|<[^>]*>|\{[^}]*\})+(?=\s*(?:\{|=>))/g,
    ")",
  );

  // 8. 移除函數與箭頭函數參數內的型別標註，支援巢狀括號與泛型如 (vals: Record<string, PluginSettingValue>)
  let prevMasked = "";
  while (prevMasked !== masked) {
    prevMasked = masked;
    masked = masked.replace(/\(([^()]*)\)/g, (_full, inner: string) => {
      const cleaned = inner.replace(
        /\b([a-zA-Z0-9_$]+)\s*\??\s*:\s*(?:[a-zA-Z0-9_$.[\]|&\s]|<[^>]*>|\{[^}]*\})+(?=\s*(?:[,=]|$))/g,
        "$1",
      );
      return `(${cleaned})`;
    });
  }

  // 9. 移除 TypeScript as 型別斷言，如 as HTMLElement, as string, as const
  masked = masked.replace(
    /\s+as\s+(?:const|any|unknown|string|number|boolean|[A-Z][a-zA-Z0-9_$.<>[\]|&,\s]*)/g,
    "",
  );

  // 10. 還原字串、樣板字串與註解佔位符
  const restored = masked.replace(
    /__KBR_PH_(\d+)__/g,
    (_m, idx) => placeholders[Number(idx)] ?? "",
  );
  return restored;
}

function removeInterfaceBlocks(code: string): string {
  const interfaceRegex =
    /\b(?:export\s+)?interface\s+[A-Za-z0-9_$]+(?:\s*<[^>]*>)?(?:\s+extends\s+[^{]+)?\s*\{/g;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = interfaceRegex.exec(code)) !== null) {
    result += code.slice(lastIndex, match.index);
    let braceDepth = 1;
    let cursor = match.index + match[0].length;
    while (cursor < code.length && braceDepth > 0) {
      if (code[cursor] === "{") braceDepth++;
      else if (code[cursor] === "}") braceDepth--;
      cursor++;
    }
    lastIndex = cursor;
    interfaceRegex.lastIndex = cursor;
  }
  result += code.slice(lastIndex);
  return result;
}

/**
 * 檢查 TypeScript / JavaScript (.kbr) 插件語法是否正確
 * 支援 export function activate、export const settingsSchema、TypeScript 型別標註等
 */
export function checkPluginSyntax(code: string): {
  valid: boolean;
  error?: string;
  transpiledCode?: string;
} {
  try {
    const transpiledCode = transpilePluginCode(code);
    new Function(
      "context",
      "window",
      "document",
      "console",
      `
      "use strict";
      ${transpiledCode}
    `,
    );
    return { valid: true, transpiledCode };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: message };
  }
}

/**
 * 從插件腳本內提取 `export const settingsSchema` 定義，若腳本未定義則回退至 manifest.settingsSchema
 */
export function extractPluginSettingsSchema(manifest: KobrixaPluginManifest): PluginSettingField[] {
  try {
    const transpiled = transpilePluginCode(manifest.code);
    const extractor = new Function(
      `
      "use strict";
      ${transpiled}
      if (typeof settingsSchema !== "undefined" && Array.isArray(settingsSchema)) {
        return settingsSchema;
      }
      return null;
    `,
    );
    const extracted = extractor();
    if (Array.isArray(extracted) && extracted.length > 0) {
      return extracted as PluginSettingField[];
    }
  } catch {
    // 忽略解析錯誤，回退至 manifest.settingsSchema
  }
  return manifest.settingsSchema ? [...manifest.settingsSchema] : [];
}

/** 讀取指定插件的所有設置值 (自動合併預設值) */
export function getPluginSettingsValues(
  manifest: KobrixaPluginManifest,
): Record<string, PluginSettingValue> {
  const schema = extractPluginSettingsSchema(manifest);
  const defaults: Record<string, PluginSettingValue> = {};
  schema.forEach((field) => {
    defaults[field.key] = field.default;
  });

  try {
    const raw = localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}${manifest.id}`);
    if (!raw) return defaults;
    const saved = JSON.parse(raw) as Record<string, PluginSettingValue>;
    return { ...defaults, ...saved };
  } catch {
    return defaults;
  }
}

/** 更新指定插件的單一設置值，並即時通知運行中的插件 */
export function setPluginSettingValue(
  pluginId: string,
  key: string,
  value: PluginSettingValue,
): Record<string, PluginSettingValue> {
  const plugins = loadSavedPlugins();
  const manifest = plugins.find((p) => p.id === pluginId) ?? activePlugins.get(pluginId)?.manifest;

  const currentValues = manifest ? getPluginSettingsValues(manifest) : {};
  const nextValues: Record<string, PluginSettingValue> = {
    ...currentValues,
    [key]: value,
  };

  try {
    localStorage.setItem(`${SETTINGS_STORAGE_PREFIX}${pluginId}`, JSON.stringify(nextValues));
  } catch (err) {
    console.error(`[PluginManager] Failed to save settings for "${pluginId}":`, err);
  }

  const active = activePlugins.get(pluginId);
  if (active) {
    if (active.settingsListeners.length > 0) {
      active.settingsListeners.forEach((listener) => {
        try {
          listener(nextValues);
        } catch (err) {
          console.error(`[PluginManager] Settings listener error for "${pluginId}":`, err);
        }
      });
    } else if (manifest && manifest.enabled) {
      // 若插件未註冊 onChange 監聽器，自動熱重載插件使新設置立即生效
      activatePlugin(manifest);
    }
  }

  window.dispatchEvent(new CustomEvent(EVENT_CHANGE, { detail: plugins }));
  return nextValues;
}

/** 重置指定插件的所有設置回預設值 */
export function resetPluginSettings(pluginId: string): Record<string, PluginSettingValue> {
  localStorage.removeItem(`${SETTINGS_STORAGE_PREFIX}${pluginId}`);
  const plugins = loadSavedPlugins();
  const manifest = plugins.find((p) => p.id === pluginId) ?? activePlugins.get(pluginId)?.manifest;
  const defaults = manifest ? getPluginSettingsValues(manifest) : {};

  const active = activePlugins.get(pluginId);
  if (active) {
    if (active.settingsListeners.length > 0) {
      active.settingsListeners.forEach((listener) => {
        try {
          listener(defaults);
        } catch {
          /* ignore */
        }
      });
    } else if (manifest && manifest.enabled) {
      activatePlugin(manifest);
    }
  }

  window.dispatchEvent(new CustomEvent(EVENT_CHANGE, { detail: plugins }));
  return defaults;
}

/** 讀取所有儲存的插件清單 */
export function loadSavedPlugins(): KobrixaPluginManifest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      savePlugins(BUILTIN_PLUGINS);
      return [...BUILTIN_PLUGINS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...BUILTIN_PLUGINS];
  } catch {
    return [...BUILTIN_PLUGINS];
  }
}

/** 持久化保存插件清單 */
export function savePlugins(plugins: KobrixaPluginManifest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plugins, null, 2));
    window.dispatchEvent(new CustomEvent(EVENT_CHANGE, { detail: plugins }));
  } catch (err) {
    console.error("[PluginManager] Failed to save plugins:", err);
  }
}

/** 獲取所有插件的當前運行狀態與設置資訊 */
export function getPluginRuntimeStates(): PluginRuntimeState[] {
  const manifests = loadSavedPlugins();
  const manifestMap = new Map<string, KobrixaPluginManifest>();
  manifests.forEach((m) => manifestMap.set(m.id, m));
  activePlugins.forEach((active, id) => {
    if (!manifestMap.has(id)) {
      manifestMap.set(id, active.manifest);
    }
  });

  return Array.from(manifestMap.values()).map((manifest) => {
    const active = activePlugins.get(manifest.id);
    const settingsSchema = extractPluginSettingsSchema(manifest);
    const settingsValues = getPluginSettingsValues(manifest);
    if (active) {
      return {
        manifest,
        status: active.status,
        lastError: active.lastError,
        lastExecutedAt: active.lastExecutedAt,
        logs: active.logs,
        settingsSchema,
        settingsValues,
      };
    }
    return {
      manifest,
      status: manifest.enabled ? "stopped" : "idle",
      logs: [],
      settingsSchema,
      settingsValues,
    };
  });
}

/** 建立提供給插件的極致開放 Context */
function createPluginContext(
  manifest: KobrixaPluginManifest,
  cleanupFns: (() => void)[],
  settingsListeners: ((values: Record<string, PluginSettingValue>) => void)[],
): KobrixaPluginContext {
  const prefix = `kobrixa.plugin.${manifest.id}.`;

  return {
    plugin: { ...manifest },
    settings: {
      get<T extends PluginSettingValue = PluginSettingValue>(key: string, fallback?: T): T {
        const all = getPluginSettingsValues(manifest);
        if (key in all && all[key] !== undefined) {
          return all[key] as T;
        }
        return fallback as T;
      },
      getAll(): Record<string, PluginSettingValue> {
        return getPluginSettingsValues(manifest);
      },
      set(key: string, value: PluginSettingValue): void {
        setPluginSettingValue(manifest.id, key, value);
      },
      onChange(listener: (values: Record<string, PluginSettingValue>) => void): () => void {
        settingsListeners.push(listener);
        const cleanup = () => {
          const idx = settingsListeners.indexOf(listener);
          if (idx >= 0) settingsListeners.splice(idx, 1);
        };
        cleanupFns.push(cleanup);
        return cleanup;
      },
    },
    ui: {
      injectStyle(id: string, css: string) {
        const styleId = `kbr-style-${manifest.id}-${id}`;
        let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = css;

        const cleanup = () => {
          const el = document.getElementById(styleId);
          if (el) el.remove();
        };
        cleanupFns.push(cleanup);
        return cleanup;
      },
      addHeaderItem(id: string, element: HTMLElement) {
        element.dataset.kbrPlugin = manifest.id;
        element.dataset.kbrId = id;
        const container = document.querySelector(".preferences") || document.body;
        container.appendChild(element);

        const cleanup = () => {
          element.remove();
        };
        cleanupFns.push(cleanup);
        return cleanup;
      },
      addStatusBarItem(id: string, element: HTMLElement) {
        element.dataset.kbrPlugin = manifest.id;
        element.dataset.kbrId = id;
        const container = document.querySelector("footer") || document.body;
        container.appendChild(element);

        const cleanup = () => {
          element.remove();
        };
        cleanupFns.push(cleanup);
        return cleanup;
      },
      mountElement(containerSelector: string, element: HTMLElement) {
        element.dataset.kbrPlugin = manifest.id;
        const target = document.querySelector(containerSelector) || document.body;
        target.appendChild(element);

        const cleanup = () => {
          element.remove();
        };
        cleanupFns.push(cleanup);
        return cleanup;
      },
      showToast(message: string, type = "info") {
        const toast = document.createElement("div");
        toast.className = `kbr-toast kbr-toast-${type}`;
        toast.textContent = `[${manifest.name}] ${message}`;
        Object.assign(toast.style, {
          position: "fixed",
          bottom: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--raised, #281724)",
          color: "var(--text, #fff)",
          border: "1px solid var(--accent, #ec4899)",
          padding: "8px 16px",
          borderRadius: "8px",
          fontSize: "12px",
          zIndex: "100000",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          pointerEvents: "none",
        });
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = "0";
          toast.style.transform = "translateX(-50%) translateY(10px)";
          setTimeout(() => toast.remove(), 300);
        }, 2500);
      },
    },
    events: {
      on(eventName: string, handler: (e: CustomEvent | Event) => void) {
        window.addEventListener(eventName, handler);
        const cleanup = () => {
          window.removeEventListener(eventName, handler);
        };
        cleanupFns.push(cleanup);
        return cleanup;
      },
      emit(eventName: string, detail?: unknown) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
      },
    },
    storage: {
      get<T = unknown>(key: string, defaultValue?: T): T | undefined {
        try {
          const raw = localStorage.getItem(`${prefix}${key}`);
          return raw !== null ? JSON.parse(raw) : defaultValue;
        } catch {
          return defaultValue;
        }
      },
      set<T = unknown>(key: string, value: T): void {
        try {
          localStorage.setItem(`${prefix}${key}`, JSON.stringify(value));
        } catch (err) {
          console.error(`[PluginStorage:${manifest.id}] Set error:`, err);
        }
      },
      remove(key: string): void {
        localStorage.removeItem(`${prefix}${key}`);
      },
      clear(): void {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      },
    },
    app: {
      version: "0.1.0-v1-candidate.14",
      isArmMac: true,
      getTheme: () => document.documentElement.dataset.customTheme || "default",
    },
    onDeactivate(cleanupFn: () => void) {
      cleanupFns.push(cleanupFn);
    },
  };
}

/** 執行/啟動指定 TypeScript (.kbr) 插件 */
export function activatePlugin(manifest: KobrixaPluginManifest): boolean {
  deactivatePlugin(manifest.id);

  const cleanupList: (() => void)[] = [];
  const settingsListeners: ((values: Record<string, PluginSettingValue>) => void)[] = [];
  const logs: string[] = [];
  const instance: ActivePluginInstance = {
    manifest,
    cleanupFns: cleanupList,
    settingsListeners,
    status: "running",
    lastExecutedAt: Date.now(),
    logs,
  };
  activePlugins.set(manifest.id, instance);

  const context = createPluginContext(manifest, cleanupList, settingsListeners);

  try {
    const codeToRun = transpilePluginCode(manifest.code);

    const runner = new Function(
      "context",
      "window",
      "document",
      "console",
      `
      "use strict";
      ${codeToRun}
      if (typeof activate === "function") {
        return activate(context);
      }
    `,
    );

    runner(context, window, document, console);
    instance.status = "running";
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[PluginManager] Error running plugin "${manifest.name}":`, err);
    instance.status = "error";
    instance.lastError = errorMsg;
    cleanupList.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
    return false;
  }
}

/** 停用/解除指定插件 */
export function deactivatePlugin(pluginId: string): void {
  const instance = activePlugins.get(pluginId);
  if (!instance) return;

  instance.cleanupFns.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error(`[PluginManager] Cleanup error for plugin "${pluginId}":`, err);
    }
  });
  instance.cleanupFns = [];
  instance.settingsListeners = [];
  instance.status = "stopped";
  activePlugins.delete(pluginId);

  const mounted = document.querySelectorAll(`[data-kbr-plugin="${pluginId}"]`);
  mounted.forEach((el) => el.remove());
}

/** 切換插件啟用狀態 */
export function togglePlugin(pluginId: string): boolean {
  const plugins = loadSavedPlugins();
  const target = plugins.find((p) => p.id === pluginId);
  if (!target) return false;

  target.enabled = !target.enabled;
  savePlugins(plugins);

  if (target.enabled) {
    activatePlugin(target);
  } else {
    deactivatePlugin(target.id);
  }
  return target.enabled;
}

/** 新增或更新插件 (自動同步腳本內的 settingsSchema) */
export function saveOrUpdatePlugin(plugin: KobrixaPluginManifest): void {
  const extractedSchema = extractPluginSettingsSchema(plugin);
  const enrichedPlugin: KobrixaPluginManifest = {
    ...plugin,
    ...(extractedSchema.length > 0 ? { settingsSchema: extractedSchema } : {}),
  };

  const plugins = loadSavedPlugins();
  const index = plugins.findIndex((p) => p.id === enrichedPlugin.id);
  if (index >= 0) {
    plugins[index] = enrichedPlugin;
  } else {
    plugins.push(enrichedPlugin);
  }
  savePlugins(plugins);

  if (enrichedPlugin.enabled) {
    activatePlugin(enrichedPlugin);
  } else {
    deactivatePlugin(enrichedPlugin.id);
  }
}

/** 刪除插件 */
export function deletePlugin(pluginId: string): void {
  deactivatePlugin(pluginId);
  const plugins = loadSavedPlugins().filter((p) => p.id !== pluginId);
  savePlugins(plugins);
}

/** 重新啟動/重載所有已啟用的插件 */
export function initAllPlugins(): void {
  const plugins = loadSavedPlugins();
  plugins.forEach((p) => {
    if (p.enabled) {
      activatePlugin(p);
    }
  });
}

/** 恢復預設內建插件清單 */
export function resetToBuiltinPlugins(): void {
  activePlugins.forEach((_, id) => deactivatePlugin(id));
  savePlugins(BUILTIN_PLUGINS);
  initAllPlugins();
}

/** 匯出插件為 .kbr 檔案內容 */
export function exportPluginToKbr(plugin: KobrixaPluginManifest): string {
  const schema = extractPluginSettingsSchema(plugin);
  return JSON.stringify(
    {
      ...plugin,
      ...(schema.length > 0 ? { settingsSchema: schema } : {}),
    },
    null,
    2,
  );
}

/** 解析 .kbr 檔案內容 (支援 JSON 格式或 TypeScript/UserScript 腳本格式) */
export function parseKbrFile(content: string, filename?: string): KobrixaPluginManifest {
  const trimmed = content.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.code && typeof parsed.code === "string") {
        const manifest: KobrixaPluginManifest = {
          id: String(
            parsed.id || filename?.replace(/\.kbr$/i, "") || `kbr-${Date.now().toString(36)}`,
          ),
          name: String(parsed.name || filename?.replace(/\.kbr$/i, "") || "未命名插件"),
          version: String(parsed.version || "1.0.0"),
          author: parsed.author ? String(parsed.author) : "未知作者",
          description: parsed.description ? String(parsed.description) : "",
          enabled: true,
          icon: parsed.icon ? String(parsed.icon) : "🧩",
          code: parsed.code,
          ...(Array.isArray(parsed.settingsSchema)
            ? { settingsSchema: parsed.settingsSchema as PluginSettingField[] }
            : {}),
        };
        const schema = extractPluginSettingsSchema(manifest);
        if (schema.length > 0) manifest.settingsSchema = schema;
        return manifest;
      }
    } catch {
      // 進入腳本模式解析
    }
  }

  const nameMatch = trimmed.match(/@name\s+([^\r\n]+)/);
  const idMatch = trimmed.match(/@id\s+([^\r\n]+)/);
  const versionMatch = trimmed.match(/@version\s+([^\r\n]+)/);
  const authorMatch = trimmed.match(/@author\s+([^\r\n]+)/);
  const descMatch = trimmed.match(/@description\s+([^\r\n]+)/);
  const iconMatch = trimmed.match(/@icon\s+([^\r\n]+)/);

  const fallbackId = (filename || "plugin")
    .replace(/\.kbr$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");

  const manifest: KobrixaPluginManifest = {
    id: idMatch && idMatch[1] ? idMatch[1].trim() : fallbackId,
    name:
      nameMatch && nameMatch[1]
        ? nameMatch[1].trim()
        : filename?.replace(/\.kbr$/i, "") || "自訂 TypeScript 插件",
    version: versionMatch && versionMatch[1] ? versionMatch[1].trim() : "1.0.0",
    author: authorMatch && authorMatch[1] ? authorMatch[1].trim() : "社群開發者",
    description:
      descMatch && descMatch[1] ? descMatch[1].trim() : "透過 .kbr 檔案匯入之自訂 TypeScript 插件",
    icon: iconMatch && iconMatch[1] ? iconMatch[1].trim() : "✨",
    enabled: true,
    code: content,
  };
  const schema = extractPluginSettingsSchema(manifest);
  if (schema.length > 0) manifest.settingsSchema = schema;
  return manifest;
}
