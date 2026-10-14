import { useEffect, useRef, useState } from "react";
import type { Locale } from "../i18n/copy.js";
import type {
  LocalizedText,
  PluginNotice,
  PluginsSnapshot,
  PluginSummary,
} from "../../shared/plugins.js";
import { pluginCopy, problemText } from "./plugin-copy.js";
import {
  DEFAULT_PLUGIN_TEMPLATE,
  PluginEditModal,
  PluginSettingsModal,
} from "../plugins/plugins-panel.js";
import {
  deletePlugin,
  exportPluginToKbr,
  getPluginRuntimeStates,
  parseKbrFile,
  resetToBuiltinPlugins,
  saveOrUpdatePlugin,
  setKbrSafeMode,
  togglePlugin,
} from "../plugins/plugin-manager.js";
import type { KobrixaPluginManifest, PluginRuntimeState } from "../plugins/plugin-types.js";

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
 * 安裝前自動檢測插件檔案類型：判斷屬於 Python (.py / kobrixa-plugin.json) 定係 TypeScript (.kbr)
 */
export function detectPluginPackage(filename: string, content: string): StagedPluginPackage {
  const lower = filename.toLowerCase();
  const trimmed = content.trim();

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
      description: descMatch?.[1]?.trim() || "Python 插件（JSON-RPC 2.0 over stdio）",
    };
  }

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
          description: `Python 插件 (${parsed.runtime.entry || "main.py"})`,
        };
      }
    } catch {
      // 繼續以 .kbr 解析
    }
  }

  const kbr = parseKbrFile(content, filename);
  return {
    filename,
    content,
    detectedType: "kbr",
    id: kbr.id,
    name: kbr.name,
    version: kbr.version,
    description: kbr.description || "TypeScript (.kbr) 插件",
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
  const [query, setQuery] = useState("");
  const [stagedPkg, setStagedPkg] = useState<StagedPluginPackage | null>(null);
  const [installNotice, setInstallNotice] = useState<string>();
  const [kbrStates, setKbrStates] = useState<PluginRuntimeState[]>(() => getPluginRuntimeStates());
  const [editingPlugin, setEditingPlugin] = useState<KobrixaPluginManifest | null>(null);
  const [configuringPlugin, setConfiguringPlugin] = useState<KobrixaPluginManifest | null>(null);
  const filePickerRef = useRef<HTMLInputElement>(null);

  const refreshKbr = () => {
    setKbrStates(getPluginRuntimeStates());
  };

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
    const onKbrChange = () => refreshKbr();
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
      setStagedPkg(detectPluginPackage(file.name, content));
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
      refreshKbr();
      setInstallNotice(
        isZh
          ? `已安裝並啟用 .kbr 插件：「${parsed.name}」`
          : `Installed .kbr plugin: "${parsed.name}"`,
      );
      setStagedPkg(null);
      return;
    }

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
              ? `已安裝 Python 插件：「${stagedPkg.name}」`
              : `Installed Python plugin: "${stagedPkg.name}"`,
          );
          setStagedPkg(null);
        }
        return res;
      });
    }
  };

  const handleExportKbr = (manifest: KobrixaPluginManifest) => {
    const content = exportPluginToKbr(manifest);
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${manifest.id}.kbr`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!state) return <p className="settings-hint">{t.loading}</p>;

  const q = query.trim().toLowerCase();
  const filteredHostPlugins = state.plugins.filter((p) => {
    if (!q) return true;
    const name = p.displayName ? localizedText(p.displayName, locale) : p.id;
    return name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });

  const filteredKbrPlugins = kbrStates.filter(({ manifest }) => {
    if (!q) return true;
    return (
      manifest.name.toLowerCase().includes(q) ||
      manifest.id.toLowerCase().includes(q) ||
      (manifest.description || "").toLowerCase().includes(q)
    );
  });

  const renderHostPluginToggle = (plugin: PluginSummary) => {
    if (plugin.source !== "development" || plugin.status === "invalid") return null;
    const enabling = plugin.status === "disabled" && plugin.disabledBy === "user";
    const label = enabling
      ? t.enable
      : plugin.disabledBy === "safe-mode"
        ? t.keepDisabled
        : t.disable;
    return (
      <button
        type="button"
        className="up-btn"
        disabled={busy !== undefined || (enabling && state.safeMode)}
        onClick={() =>
          void perform(plugin.id, () => window.kobrixa.plugins.setEnabled(plugin.id, enabling))
        }
      >
        {label}
      </button>
    );
  };

  const renderHostPluginItem = (plugin: PluginSummary) => {
    const isPy = plugin.runtime === "python";
    const isBuiltin = plugin.source === "builtin";
    return (
      <li key={`${plugin.source}:${plugin.directory ?? plugin.id}`} className="up-card">
        <div className="up-card-top">
          <div className="up-card-title-group">
            <span className="up-card-icon">{isPy ? "🐍" : isBuiltin ? "📦" : "🟢"}</span>
            <div className="up-card-title-text">
              <div className="up-card-name-row">
                <h3 className="settings-subheading">
                  {plugin.displayName ? localizedText(plugin.displayName, locale) : plugin.id}
                </h3>
                <span className={`up-tag ${isPy ? "up-tag-py" : "up-tag-sys"}`}>
                  {isPy ? "Python" : isBuiltin ? t.builtin : (plugin.runtime ?? t.development)}
                </span>
                <span className={`up-tag up-tag-status-${plugin.status}`}>
                  {t.status[plugin.status]}
                </span>
                {plugin.running && <span className="up-tag up-tag-running">{t.running}</span>}
              </div>
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
            </div>
          </div>

          <div className="up-card-actions">
            {plugin.commands.length > 0 && (
              <div role="group" aria-label={t.commands} className="up-cmd-group">
                {plugin.commands.map((command) => (
                  <button
                    key={command.id}
                    type="button"
                    className="up-btn up-btn-primary"
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
            {renderHostPluginToggle(plugin)}
            {plugin.source === "development" &&
              typeof window.kobrixa.plugins.uninstall === "function" &&
              plugin.directory?.includes("/plugins/installed/") && (
                <button
                  type="button"
                  className="up-btn up-btn-danger"
                  disabled={busy !== undefined}
                  onClick={() =>
                    void perform(`uninstall:${plugin.id}`, () =>
                      window.kobrixa.plugins.uninstall!(plugin.id),
                    )
                  }
                >
                  {isZh ? "移除插件" : "Uninstall"}
                </button>
              )}
          </div>
        </div>

        {plugin.directory && <p className="settings-hint up-path">{plugin.directory}</p>}
        {plugin.problems.map((problem, index) => (
          <p className="settings-hint up-problem" key={index}>
            {problemText(problem, locale)}
          </p>
        ))}
      </li>
    );
  };

  const renderKbrPluginItem = ({
    manifest,
    status,
    lastError,
    settingsSchema,
  }: PluginRuntimeState) => (
    <li key={`kbr:${manifest.id}`} className={`up-card ${!manifest.enabled ? "is-disabled" : ""}`}>
      <div className="up-card-top">
        <div className="up-card-title-group">
          <span className="up-card-icon">{manifest.icon || "🧩"}</span>
          <div className="up-card-title-text">
            <div className="up-card-name-row">
              <h3 className="settings-subheading">{manifest.name}</h3>
              <span className="up-tag up-tag-kbr">TypeScript · .kbr</span>
              <span className="up-tag">v{manifest.version}</span>
              <span
                className={`up-tag ${status === "running" ? "up-tag-running" : status === "error" ? "up-tag-error" : ""}`}
              >
                {status === "running"
                  ? isZh
                    ? "運行中"
                    : "Running"
                  : status === "error"
                    ? isZh
                      ? "錯誤"
                      : "Error"
                    : isZh
                      ? "已停止"
                      : "Stopped"}
              </span>
            </div>
            <p className="settings-hint">
              ID: {manifest.id}
              {manifest.author ? ` · ${manifest.author}` : ""}
              {settingsSchema.length > 0
                ? isZh
                  ? ` · ${settingsSchema.length} 項可調設置`
                  : ` · ${settingsSchema.length} settings`
                : ""}
            </p>
          </div>
        </div>

        <label className="up-switch-label">
          <input
            type="checkbox"
            checked={manifest.enabled}
            onChange={() => {
              togglePlugin(manifest.id);
              refreshKbr();
            }}
          />
          <span>
            {manifest.enabled ? (isZh ? "已啟用" : "Enabled") : isZh ? "已停用" : "Disabled"}
          </span>
        </label>
      </div>

      {manifest.description && <p className="up-desc">{manifest.description}</p>}
      {lastError && <p className="settings-hint up-problem">{lastError}</p>}

      {/* 按鈕順序：編輯代碼 -> 設置 (在編輯代碼與匯出中間) -> 匯出 .kbr -> 刪除 */}
      <div className="up-card-footer">
        <button type="button" className="up-btn" onClick={() => setEditingPlugin({ ...manifest })}>
          ✏️ {isZh ? "編輯代碼" : "Edit Code"}
        </button>
        <button
          type="button"
          className="up-btn up-btn-accent"
          onClick={() => setConfiguringPlugin({ ...manifest })}
        >
          ⚙️ {isZh ? "設置" : "Settings"}
          {settingsSchema.length > 0 ? ` (${settingsSchema.length})` : ""}
        </button>
        <button type="button" className="up-btn" onClick={() => handleExportKbr(manifest)}>
          📤 {isZh ? "匯出 .kbr" : "Export .kbr"}
        </button>
        <button
          type="button"
          className="up-btn up-btn-danger"
          onClick={() => {
            deletePlugin(manifest.id);
            refreshKbr();
          }}
        >
          🗑️ {isZh ? "刪除" : "Delete"}
        </button>
      </div>
    </li>
  );

  return (
    <div
      className="plugins-panel"
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

      {/* 頂部工具列：模式切換 + 搜尋 + App 式一鍵安裝 */}
      <div className="up-toolbar">
        <div className="up-toolbar-row">
          <div className="up-mode-tabs">
            <span
              className={`up-mode-tab ${viewMode === "unified" ? "active" : ""}`}
              role="presentation"
              onClick={() => switchViewMode("unified")}
            >
              {isZh ? "🔀 方式一：合埋一齊" : "🔀 Mode 1: Unified List"}
            </span>
            <span
              className={`up-mode-tab ${viewMode === "split" ? "active" : ""}`}
              role="presentation"
              onClick={() => switchViewMode("split")}
            >
              {isZh ? "📑 方式二：分開顯示" : "📑 Mode 2: Split Sections"}
            </span>
          </div>

          <input
            type="search"
            className="up-search-input"
            value={query}
            placeholder={isZh ? "搜尋插件名稱或 ID…" : "Search plugins by name or ID…"}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="up-toolbar-btns">
            <button
              type="button"
              className="up-btn up-btn-primary"
              onClick={() => filePickerRef.current?.click()}
            >
              📲 {isZh ? "安裝插件 (.kbr / .py)" : "Install Plugin (.kbr / .py)"}
            </button>
            {typeof window.kobrixa.plugins.installFromDisk === "function" && (
              <button
                type="button"
                className="up-btn"
                onClick={() =>
                  void perform("install-disk", () => window.kobrixa.plugins.installFromDisk!())
                }
              >
                📂 {isZh ? "安裝資料夾" : "Install Folder"}
              </button>
            )}
            <button
              type="button"
              className="up-btn"
              onClick={() =>
                setEditingPlugin({
                  ...DEFAULT_PLUGIN_TEMPLATE,
                  id: `plugin-${Date.now().toString(36)}`,
                })
              }
            >
              ➕ {isZh ? "新增 .kbr" : "New .kbr"}
            </button>
            <button
              type="button"
              className="up-btn"
              onClick={() => {
                resetToBuiltinPlugins();
                refreshKbr();
              }}
            >
              🔄 {isZh ? "重置預設" : "Reset Built-ins"}
            </button>
          </div>
        </div>

        {/* 安裝前自動判斷 (.kbr vs Python) 確認列 */}
        {stagedPkg && (
          <div className="up-staged-bar">
            <div className="up-staged-info">
              <span
                className={`up-tag ${stagedPkg.detectedType === "python" ? "up-tag-py" : "up-tag-kbr"}`}
              >
                {stagedPkg.detectedType === "python" ? "🐍 Python (.py)" : "⚡ TypeScript (.kbr)"}
              </span>
              <strong>{stagedPkg.name}</strong>
              <span className="settings-hint">({stagedPkg.filename})</span>
              <span className="settings-hint">— {stagedPkg.description}</span>
            </div>
            <div className="up-staged-actions">
              <button
                type="button"
                className="up-btn"
                onClick={() =>
                  setStagedPkg({
                    ...stagedPkg,
                    detectedType: stagedPkg.detectedType === "python" ? "kbr" : "python",
                  })
                }
              >
                🔄{" "}
                {isZh
                  ? `改為 ${stagedPkg.detectedType === "python" ? ".kbr" : "Python"}`
                  : `Switch to ${stagedPkg.detectedType === "python" ? ".kbr" : "Python"}`}
              </button>
              <button
                type="button"
                className="up-btn up-btn-primary"
                onClick={() => void handleConfirmStagedInstall()}
              >
                ✅ {isZh ? "確認安裝" : "Confirm Install"}
              </button>
              <button type="button" className="up-btn" onClick={() => setStagedPkg(null)}>
                ✕ {isZh ? "取消" : "Cancel"}
              </button>
            </div>
          </div>
        )}
      </div>

      {installNotice && <p className="settings-hint">{installNotice}</p>}
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

      {viewMode === "unified" ? (
        /* 方式一：合埋一齊 — 只有單一整合清單，絕不重複顯示第二個 .kbr 區塊！ */
        <ul className="plugins-list up-list">
          {filteredHostPlugins.map(renderHostPluginItem)}
          {filteredKbrPlugins.map(renderKbrPluginItem)}
        </ul>
      ) : (
        /* 方式二：分開顯示 — 上方 Python / 系統程序插件，下方 .kbr 擴充插件 */
        <div className="up-split-container">
          <div className="up-split-section">
            <h3 className="up-section-heading">
              🐍 {isZh ? "Python 與系統程序插件" : "Python & System Process Plugins"}
            </h3>
            <ul className="plugins-list up-list">
              {filteredHostPlugins.map(renderHostPluginItem)}
            </ul>
          </div>

          <div className="up-split-section">
            <h3 className="up-section-heading">
              ⚡ {isZh ? "TypeScript (.kbr) 腳本擴充插件" : "TypeScript (.kbr) Script Extensions"}
            </h3>
            <ul className="up-list">{filteredKbrPlugins.map(renderKbrPluginItem)}</ul>
          </div>
        </div>
      )}

      <div className="up-notices-box">
        <h3 className="settings-subheading">{t.notices}</h3>
        <ul aria-live="polite" className="up-notices-list">
          {notices.length === 0 && <li className="settings-hint">{t.noNotices}</li>}
          {notices.map((notice, index) => (
            <li key={`${notice.at}-${index}`}>
              <strong>{notice.pluginId}</strong> {notice.message}
            </li>
          ))}
        </ul>
      </div>

      {configuringPlugin && (
        <PluginSettingsModal
          plugin={configuringPlugin}
          locale={locale}
          onClose={() => {
            setConfiguringPlugin(null);
            refreshKbr();
          }}
          onOpenCodeEditor={() => {
            const target = configuringPlugin;
            setConfiguringPlugin(null);
            setEditingPlugin({ ...target });
          }}
        />
      )}

      {editingPlugin && (
        <PluginEditModal
          plugin={editingPlugin}
          locale={locale}
          onSave={(manifest) => {
            saveOrUpdatePlugin(manifest);
            setEditingPlugin(null);
            refreshKbr();
          }}
          onClose={() => setEditingPlugin(null)}
        />
      )}
    </div>
  );
}
