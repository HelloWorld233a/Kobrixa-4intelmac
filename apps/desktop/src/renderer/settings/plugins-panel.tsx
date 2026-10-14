import { useEffect, useRef, useState } from "react";
import type { Locale } from "../i18n/copy.js";
import type {
  LocalizedText,
  PluginNotice,
  PluginsSnapshot,
  PluginSummary,
} from "../../shared/plugins.js";
import { pluginCopy, problemText } from "./plugin-copy.js";
import { PluginsPanel as KbrStudioPanel } from "../plugins/plugins-panel.js";
import {
  deletePlugin,
  exportPluginToKbr,
  getPluginRuntimeStates,
  parseKbrFile,
  saveOrUpdatePlugin,
  setKbrSafeMode,
  togglePlugin,
} from "../plugins/plugin-manager.js";
import type { PluginRuntimeState } from "../plugins/plugin-types.js";

export const localizedText = (text: LocalizedText, locale: Locale): string =>
  typeof text === "string" ? text : locale === "zh-TW" ? (text["zh-TW"] ?? text.en) : text.en;

export type DetectedPluginType = "kbr" | "python";

export interface StagedPluginPackage {
  filename: string;
  content: string;
  detectedType: DetectedPluginType;
  id: string;
  name: string;
  version: string;
  description: string;
}

/**
 * Automatically inspects a plugin file before installation to determine whether it is
 * a `.kbr` (TypeScript UI/script plugin) or a `Python` (`.py` / `kobrixa-plugin.json`) plugin.
 */
export function detectPluginPackage(filename: string, content: string): StagedPluginPackage {
  const lower = filename.toLowerCase();
  const trimmed = content.trim();

  // 1. Explicit .py extension or Python shebang / kobrixa Python SDK import
  if (
    lower.endsWith(".py") ||
    trimmed.startsWith("#!/usr/bin/env python") ||
    /^(?:from\s+kobrixa\s+import\s+Plugin|import\s+kobrixa)\b/m.test(trimmed) ||
    /@\w+\.command\(\s*["'][^"']+["']\s*\)/.test(trimmed)
  ) {
    const nameMatch = trimmed.match(/@name\s+([^\r\n]+)/);
    const idMatch = trimmed.match(/@id\s+([^\r\n]+)/);
    const descMatch = trimmed.match(/@description\s+([^\r\n]+)/);
    const baseName = filename.replace(/\.(py|kbr|json)$/i, "") || "python-plugin";
    const slug =
      idMatch?.[1]?.trim() ||
      `user.${
        baseName
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-+|-+$/g, "") || "python"
      }`;
    return {
      filename,
      content,
      detectedType: "python",
      id: slug,
      name: nameMatch?.[1]?.trim() || baseName,
      version: "1.0.0",
      description:
        descMatch?.[1]?.trim() ||
        "Python 獨立程序插件（透過 JSON-RPC 2.0 over stdio 執行，自動配置環境）",
    };
  }

  // 2. Check if JSON is a kobrixa-plugin.json with runtime.kind === "python"
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        id?: string;
        version?: string;
        displayName?: LocalizedText;
        runtime?: { kind?: string; entry?: string };
        code?: string;
      };
      if (parsed.runtime?.kind === "python" && !parsed.code) {
        const title =
          typeof parsed.displayName === "string"
            ? parsed.displayName
            : parsed.displayName?.["zh-TW"] || parsed.displayName?.en || parsed.id || filename;
        return {
          filename,
          content,
          detectedType: "python",
          id: parsed.id || "user.python-plugin",
          name: title,
          version: parsed.version || "1.0.0",
          description: `Python 插件設定檔 (${parsed.runtime.entry || "main.py"})`,
        };
      }
    } catch {
      // fall through to .kbr parser
    }
  }

  // 3. Otherwise treat as .kbr TypeScript plugin
  const kbr = parseKbrFile(content, filename);
  return {
    filename,
    content,
    detectedType: "kbr",
    id: kbr.id,
    name: kbr.name,
    version: kbr.version,
    description: kbr.description || "TypeScript (.kbr) 互動式擴充插件",
  };
}

const VIEW_MODE_KEY = "kobrixa.plugins.layoutMode";

export function PluginsPanel({ locale }: { locale: Locale }): React.JSX.Element {
  const isZh = locale === "zh-TW";
  const t = pluginCopy[locale];
  const [state, setState] = useState<PluginsSnapshot>();
  const [notices, setNotices] = useState<PluginNotice[]>([]);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [viewMode, setViewMode] = useState<"unified" | "split">(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      return saved === "unified" || saved === "split" ? saved : "unified";
    } catch {
      return "unified";
    }
  });
  const [stagedPkg, setStagedPkg] = useState<StagedPluginPackage | null>(null);
  const [installNotice, setInstallNotice] = useState<string>();
  const [kbrStates, setKbrStates] = useState<PluginRuntimeState[]>(() => getPluginRuntimeStates());
  const filePickerRef = useRef<HTMLInputElement>(null);

  const switchViewMode = (mode: "unified" | "split") => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let live = true;
    void window.kobrixa.plugins
      .state()
      .then((value) => {
        if (!live) return;
        setState(value);
        setKbrSafeMode(value.safeMode);
      })
      .catch((err: unknown) => {
        if (!live) return;
        setError(
          problemText(
            {
              code: "PLUGIN_E_COMMAND_FAILED",
              message: err instanceof Error ? err.message : String(err),
            },
            locale,
          ),
        );
        setState({ safeMode: false, developmentMode: false, plugins: [] });
      });
    const off = window.kobrixa.plugins.onEvent((event) => {
      if (event.type === "state") {
        setState(event.state);
        setKbrSafeMode(event.state.safeMode);
      } else {
        setNotices((list) => [event.notice, ...list].slice(0, 20));
      }
    });
    const onKbrNotice = (event: Event) => {
      const custom = event as CustomEvent<PluginNotice>;
      if (custom.detail) {
        setNotices((list) => [custom.detail, ...list].slice(0, 20));
      }
    };
    const onKbrChange = () => {
      setKbrStates(getPluginRuntimeStates());
    };
    window.addEventListener("kobrixa:kbr-notice", onKbrNotice);
    window.addEventListener("kobrixa:plugins-change", onKbrChange);
    return () => {
      live = false;
      off();
      window.removeEventListener("kobrixa:kbr-notice", onKbrNotice);
      window.removeEventListener("kobrixa:plugins-change", onKbrChange);
    };
  }, [locale]);

  const perform = async (
    key: string,
    work: () => Promise<
      { ok: true; state?: PluginsSnapshot } | { ok: false; code: string; message: string }
    >,
  ) => {
    setBusy(key);
    setError(undefined);
    try {
      const result = await work();
      if (!result.ok) setError(problemText(result, locale));
      else if (result.state) setState(result.state);
    } catch (err: unknown) {
      setError(
        problemText(
          {
            code: "PLUGIN_E_COMMAND_FAILED",
            message: err instanceof Error ? err.message : String(err),
          },
          locale,
        ),
      );
    } finally {
      setBusy(undefined);
    }
  };

  const handleSelectFileToStage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content !== "string") return;
      const detected = detectPluginPackage(file.name, content);
      setStagedPkg(detected);
      setInstallNotice(undefined);
    };
    reader.readAsText(file);
  };

  const handleConfirmStagedInstall = async () => {
    if (!stagedPkg) return;
    if (stagedPkg.detectedType === "kbr") {
      const parsed = parseKbrFile(stagedPkg.content, stagedPkg.filename);
      parsed.id = stagedPkg.id || parsed.id;
      parsed.name = stagedPkg.name || parsed.name;
      saveOrUpdatePlugin(parsed);
      setKbrStates(getPluginRuntimeStates());
      setInstallNotice(
        isZh
          ? `✅ 已成功安裝並啟用 .kbr 插件：「${parsed.name}」`
          : `✅ Installed and enabled .kbr plugin: "${parsed.name}"`,
      );
      setStagedPkg(null);
      return;
    }

    // Python plugin installation via IPC
    if (typeof window.kobrixa.plugins.installFile === "function") {
      await perform(`install:${stagedPkg.id}`, async () => {
        const res = await window.kobrixa.plugins.installFile!({
          filename: stagedPkg.filename,
          content: stagedPkg.content,
          id: stagedPkg.id,
          name: stagedPkg.name,
        });
        if (res.ok) {
          setInstallNotice(
            isZh
              ? `✅ 已成功安裝 Python 插件：「${stagedPkg.name}」（免命令自動掛載）`
              : `✅ Installed Python plugin: "${stagedPkg.name}"`,
          );
          setStagedPkg(null);
        }
        return res;
      });
    }
  };

  if (!state) return <p className="settings-hint">{t.loading}</p>;

  const toggle = (plugin: PluginSummary) => {
    if (plugin.source !== "development" || plugin.status === "invalid") return null;
    const enabling = plugin.status === "disabled" && plugin.disabledBy === "user";
    const label = enabling
      ? t.enable
      : plugin.disabledBy === "safe-mode"
        ? t.keepDisabled
        : t.disable;
    return (
      <button
        disabled={busy !== undefined || (enabling && state.safeMode)}
        onClick={() =>
          void perform(plugin.id, () => window.kobrixa.plugins.setEnabled(plugin.id, enabling))
        }
      >
        {label}
      </button>
    );
  };

  return (
    <div className="plugins-panel">
      {/* 頂部：App 式一鍵安裝器 + 兩種顯示模式切換器 */}
      <div
        className="appearance-studio-board"
        style={{ marginBottom: 18 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleSelectFileToStage(f);
        }}
      >
        <input
          ref={filePickerRef}
          type="file"
          accept=".kbr,.py,.ts,.js,.json"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              handleSelectFileToStage(f);
              e.target.value = "";
            }
          }}
        />
        <div className="appearance-studio-header">
          <div>
            <span className="appearance-studio-kicker">
              {isZh ? "📲 零命令 App 式插件中心" : "📲 Zero-Command App Plugin Center"}
            </span>
            <h3>
              {isZh
                ? "一鍵安裝插件（自動判斷 .kbr 或 Python）"
                : "One-Click Plugin Installer (Auto-detects .kbr or Python)"}
            </h3>
            <p>
              {isZh
                ? "唔使打任何終端機命令！直接揀選或拖入 .kbr / .py 檔案，系統會喺安裝前自動識別屬於 TypeScript (.kbr) 定係 Python 插件並自動配置環境。"
                : "No terminal commands needed! Pick or drop a .kbr or .py file—Kobrixa detects whether it is TypeScript (.kbr) or Python before installing."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span
              className="appearance-studio-open-theme"
              role="presentation"
              onClick={() => filePickerRef.current?.click()}
            >
              📥 {isZh ? "安裝插件檔案 (.kbr / .py)" : "Install Plugin File (.kbr / .py)"}
            </span>
            {typeof window.kobrixa.plugins.installFromDisk === "function" && (
              <span
                className="appearance-scale-pill"
                role="presentation"
                onClick={() =>
                  void perform("install-disk", () => window.kobrixa.plugins.installFromDisk!())
                }
              >
                📂 {isZh ? "選擇插件資料夾" : "Install Folder"}
              </span>
            )}
          </div>
        </div>

        {/* 安裝前自動識別確認卡 (Staged Pre-Install Inspector) */}
        {stagedPkg && (
          <div
            className="appearance-strip-block"
            style={{
              borderColor: stagedPkg.detectedType === "python" ? "#10b981" : "#ec4899",
              background: "var(--bg-elevated)",
            }}
          >
            <div className="appearance-strip-label">
              <strong>
                {stagedPkg.detectedType === "python"
                  ? isZh
                    ? "🐍 安裝前檢測結果：識別為 Python 插件 (.py)"
                    : "🐍 Pre-Install Check: Detected Python Plugin (.py)"
                  : isZh
                    ? "⚡ 安裝前檢測結果：識別為 TypeScript 擴充插件 (.kbr)"
                    : "⚡ Pre-Install Check: Detected TypeScript Extension (.kbr)"}
              </strong>
              <span>{stagedPkg.filename}</span>
            </div>
            <p className="settings-hint" style={{ margin: "4px 0" }}>
              <strong>{stagedPkg.name}</strong> ({stagedPkg.id} · v{stagedPkg.version}) —{" "}
              {stagedPkg.description}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <span
                className="appearance-scale-pill active"
                role="presentation"
                onClick={() =>
                  setStagedPkg({
                    ...stagedPkg,
                    detectedType: stagedPkg.detectedType === "python" ? "kbr" : "python",
                  })
                }
              >
                🔄{" "}
                {isZh
                  ? `切換類型（目前：${stagedPkg.detectedType === "python" ? "Python" : ".kbr"}）`
                  : `Switch Type (Current: ${stagedPkg.detectedType.toUpperCase()})`}
              </span>
              <span
                className="appearance-studio-open-theme"
                role="presentation"
                onClick={() => void handleConfirmStagedInstall()}
              >
                ✅ {isZh ? "確認安裝並立即啟用" : "Confirm Install & Enable"}
              </span>
              <span
                className="appearance-scale-pill"
                role="presentation"
                onClick={() => setStagedPkg(null)}
              >
                ✖ {isZh ? "取消" : "Cancel"}
              </span>
            </div>
          </div>
        )}

        {installNotice && <p className="settings-hint">{installNotice}</p>}

        {/* 兩種顯示方式切換列 */}
        <div className="appearance-strip-block">
          <div className="appearance-strip-label">
            <strong>
              {isZh ? "🎛️ 插件設置顯示方式（兩種模式自由切換）" : "🎛️ Plugin Panel Display Mode"}
            </strong>
            <span>
              {viewMode === "unified"
                ? isZh
                  ? "方式一：合二為一整合視圖"
                  : "Mode 1: Unified All-in-One"
                : isZh
                  ? "方式二：上下分開獨立視圖"
                  : "Mode 2: Split Dual View"}
            </span>
          </div>
          <div className="appearance-scale-pills">
            <span
              className={`appearance-scale-pill ${viewMode === "unified" ? "active" : ""}`}
              role="presentation"
              onClick={() => switchViewMode("unified")}
            >
              {isZh
                ? "🔀 方式一：合埋一齊（自動區分 .kbr / Python）"
                : "🔀 Mode 1: Unified (.kbr + Python Together)"}
            </span>
            <span
              className={`appearance-scale-pill ${viewMode === "split" ? "active" : ""}`}
              role="presentation"
              onClick={() => switchViewMode("split")}
            >
              {isZh
                ? "📑 方式二：分開顯示（獨立程序與 .kbr 分區）"
                : "📑 Mode 2: Split Sections (Separate Panels)"}
            </span>
          </div>
        </div>
      </div>

      <p className="settings-hint">{t.trust}</p>
      {!state.developmentMode && <p className="settings-hint">{t.howTo}</p>}
      {state.safeMode && (
        <p className="settings-hint" role="status">
          {t.safeMode}
        </p>
      )}
      {error && (
        <p className="settings-hint" role="alert">
          {error}
        </p>
      )}

      {/* 獨立程序與內建插件清單（在方式一與方式二皆完整呈現，並在方式一整合 .kbr 卡片） */}
      <ul className="plugins-list">
        {state.plugins.map((plugin) => (
          <li key={`${plugin.source}:${plugin.directory ?? plugin.id}`}>
            <h3 className="settings-subheading">
              {plugin.runtime === "python" ? "🐍 " : plugin.source === "builtin" ? "📦 " : "🟢 "}
              {plugin.displayName ? localizedText(plugin.displayName, locale) : plugin.id}
            </h3>
            <p className="settings-hint">
              {[
                plugin.id,
                plugin.version,
                plugin.source === "builtin" ? t.builtin : t.development,
                plugin.runtime,
                t.status[plugin.status],
                plugin.running ? t.running : undefined,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {plugin.directory && <p className="settings-hint">{plugin.directory}</p>}
            {plugin.problems.map((problem, index) => (
              <p className="settings-hint" key={index}>
                {problemText(problem, locale)}
              </p>
            ))}
            {plugin.commands.length > 0 && (
              <div role="group" aria-label={t.commands}>
                {plugin.commands.map((command) => (
                  <button
                    key={command.id}
                    disabled={busy !== undefined}
                    onClick={() =>
                      void perform(command.id, () => window.kobrixa.plugins.execute(command.id))
                    }
                  >
                    {localizedText(command.title, locale)}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              {toggle(plugin)}
              {plugin.source === "development" &&
                typeof window.kobrixa.plugins.uninstall === "function" &&
                plugin.directory?.includes("/plugins/installed/") && (
                  <span
                    className="appearance-scale-pill"
                    style={{ flex: "0 0 auto" }}
                    role="presentation"
                    onClick={() =>
                      void perform(`uninstall:${plugin.id}`, () =>
                        window.kobrixa.plugins.uninstall!(plugin.id),
                      )
                    }
                  >
                    🗑️ {isZh ? "移除插件" : "Uninstall"}
                  </span>
                )}
            </div>
          </li>
        ))}

        {/* 方式一（合埋一齊）：將所有 .kbr TypeScript 插件直接合併喺同一個 App 清單入面顯示！ */}
        {viewMode === "unified" &&
          kbrStates.map(({ manifest, status, lastError }) => (
            <li key={`kbr:${manifest.id}`}>
              <h3 className="settings-subheading">
                ⚡ {manifest.icon || "🧩"} {manifest.name}
              </h3>
              <p className="settings-hint">
                {[
                  manifest.id,
                  manifest.version,
                  "TypeScript (.kbr)",
                  manifest.enabled ? t.status.enabled : t.status.disabled,
                  status === "running" ? t.running : undefined,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {manifest.description && <p className="settings-hint">{manifest.description}</p>}
              {lastError && <p className="settings-hint">❌ {lastError}</p>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                <span
                  className={`appearance-scale-pill ${manifest.enabled ? "active" : ""}`}
                  style={{ flex: "0 0 auto" }}
                  role="presentation"
                  onClick={() => {
                    togglePlugin(manifest.id);
                    setKbrStates(getPluginRuntimeStates());
                  }}
                >
                  {manifest.enabled
                    ? isZh
                      ? "🟢 已啟用 (.kbr)"
                      : "🟢 Enabled (.kbr)"
                    : isZh
                      ? "⚪ 已停用 (.kbr)"
                      : "⚪ Disabled (.kbr)"}
                </span>
                <span
                  className="appearance-scale-pill"
                  style={{ flex: "0 0 auto" }}
                  role="presentation"
                  onClick={() => {
                    const content = exportPluginToKbr(manifest);
                    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${manifest.id}.kbr`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  📤 {isZh ? "匯出 .kbr" : "Export .kbr"}
                </span>
                <span
                  className="appearance-scale-pill"
                  style={{ flex: "0 0 auto" }}
                  role="presentation"
                  onClick={() => {
                    deletePlugin(manifest.id);
                    setKbrStates(getPluginRuntimeStates());
                  }}
                >
                  🗑️ {isZh ? "刪除 .kbr" : "Delete .kbr"}
                </span>
              </div>
            </li>
          ))}
      </ul>

      <h3 className="settings-subheading">{t.notices}</h3>
      <ul aria-live="polite">
        {notices.length === 0 && <li className="settings-hint">{t.noNotices}</li>}
        {notices.map((notice, index) => (
          <li key={`${notice.at}-${index}`}>
            <strong>{notice.pluginId}</strong> {notice.message}
          </li>
        ))}
      </ul>

      {/* 完整 .kbr 程式碼編輯與專屬設置工作坊（在方式二直接獨立分區展開；在方式一亦可直接管理詳細設置與編輯代碼） */}
      <div className="kbr-unified-section" style={{ marginTop: 24 }}>
        <h3 className="settings-subheading">
          {viewMode === "split"
            ? isZh
              ? "⚡ 獨立分區二：TypeScript (.kbr) 腳本與插件專屬設置工作坊"
              : "⚡ Section 2: TypeScript (.kbr) Scripts & Plugin Settings Studio"
            : isZh
              ? "🛠️ .kbr 插件代碼編輯器與專屬設置表單"
              : "🛠️ .kbr Code Editor & Custom Settings Forms"}
        </h3>
        <KbrStudioPanel locale={locale} />
      </div>
    </div>
  );
}
