import type {
  KobrixaPluginContext,
  KobrixaPluginManifest,
  PluginExecutionStatus,
  PluginRuntimeState,
} from "./plugin-types.js";
import { BUILTIN_PLUGINS } from "./builtin-plugins.js";

const STORAGE_KEY = "kobrixa.plugins";
const EVENT_CHANGE = "kobrixa:plugins-change";

interface ActivePluginInstance {
  manifest: KobrixaPluginManifest;
  cleanupFns: (() => void)[];
  status: PluginExecutionStatus;
  lastError?: string | undefined;
  lastExecutedAt?: number | undefined;
  logs: string[];
}

const activePlugins = new Map<string, ActivePluginInstance>();

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

/** 獲取所有插件的當前運行狀態 */
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
    if (active) {
      return {
        manifest,
        status: active.status,
        lastError: active.lastError,
        lastExecutedAt: active.lastExecutedAt,
        logs: active.logs,
      };
    }
    return {
      manifest,
      status: manifest.enabled ? "stopped" : "idle",
      logs: [],
    };
  });
}

/** 建立提供給插件的極致開放 Context */
function createPluginContext(
  manifest: KobrixaPluginManifest,
  cleanupFns: (() => void)[],
): KobrixaPluginContext {
  const prefix = `kobrixa.plugin.${manifest.id}.`;

  return {
    plugin: { ...manifest },
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

/** 執行/啟動指定插件 (極致開放執行環境) */
export function activatePlugin(manifest: KobrixaPluginManifest): boolean {
  deactivatePlugin(manifest.id);

  const cleanupList: (() => void)[] = [];
  const logs: string[] = [];
  const instance: ActivePluginInstance = {
    manifest,
    cleanupFns: cleanupList,
    status: "running",
    lastExecutedAt: Date.now(),
    logs,
  };
  activePlugins.set(manifest.id, instance);

  const context = createPluginContext(manifest, cleanupList);

  try {
    // 預處理代碼：轉換 export 語法為本地函數，以便支援 ES 模組格式與直接執行
    let codeToRun = manifest.code;
    codeToRun = codeToRun.replace(
      /export\s+(async\s+)?function\s+([a-zA-Z0-9_$]+)/g,
      "$1function $2",
    );
    codeToRun = codeToRun.replace(/export\s+(const|let|var)\s+/g, "$1 ");
    codeToRun = codeToRun.replace(/export\s+default\s+/g, "const __defaultExport = ");

    // 建立隔離但全開放的執行器
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
    // 執行清理，避免半套殘留
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
  instance.status = "stopped";
  activePlugins.delete(pluginId);

  // 同時清除該插件可能掛載在 DOM 的元素
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

/** 新增或更新插件 */
export function saveOrUpdatePlugin(plugin: KobrixaPluginManifest): void {
  const plugins = loadSavedPlugins();
  const index = plugins.findIndex((p) => p.id === plugin.id);
  if (index >= 0) {
    plugins[index] = { ...plugin };
  } else {
    plugins.push({ ...plugin });
  }
  savePlugins(plugins);

  if (plugin.enabled) {
    activatePlugin(plugin);
  } else {
    deactivatePlugin(plugin.id);
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
  // 停用所有當前運行中插件
  activePlugins.forEach((_, id) => deactivatePlugin(id));
  savePlugins(BUILTIN_PLUGINS);
  initAllPlugins();
}

/** 匯出插件為 .kbr 檔案內容 */
export function exportPluginToKbr(plugin: KobrixaPluginManifest): string {
  return JSON.stringify(plugin, null, 2);
}

/** 解析 .kbr 檔案內容 (支援 JSON 格式或 UserScript/註解頭腳本格式) */
export function parseKbrFile(content: string, filename?: string): KobrixaPluginManifest {
  const trimmed = content.trim();

  // 嘗試作為標準 JSON 解析
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.code && typeof parsed.code === "string") {
        return {
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
        };
      }
    } catch {
      // 進入腳本模式解析
    }
  }

  // 腳本模式：嘗試提取元數據註解
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

  return {
    id: idMatch && idMatch[1] ? idMatch[1].trim() : fallbackId,
    name:
      nameMatch && nameMatch[1]
        ? nameMatch[1].trim()
        : filename?.replace(/\.kbr$/i, "") || "自訂插件",
    version: versionMatch && versionMatch[1] ? versionMatch[1].trim() : "1.0.0",
    author: authorMatch && authorMatch[1] ? authorMatch[1].trim() : "社群開發者",
    description:
      descMatch && descMatch[1] ? descMatch[1].trim() : "透過 .kbr 檔案匯入之自訂 JavaScript 插件",
    icon: iconMatch && iconMatch[1] ? iconMatch[1].trim() : "✨",
    enabled: true,
    code: content,
  };
}
