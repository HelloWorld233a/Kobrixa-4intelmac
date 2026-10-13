import { useEffect, useRef, useState } from "react";
import type { Locale } from "../i18n/copy.js";
import type {
  KobrixaPluginManifest,
  PluginRuntimeState,
  PluginSettingField,
  PluginSettingValue,
} from "./plugin-types.js";
import {
  checkPluginSyntax,
  deletePlugin,
  exportPluginToKbr,
  extractPluginSettingsSchema,
  getPluginRuntimeStates,
  getPluginSettingsValues,
  parseKbrFile,
  resetPluginSettings,
  resetToBuiltinPlugins,
  saveOrUpdatePlugin,
  setPluginSettingValue,
  togglePlugin,
} from "./plugin-manager.js";

const DEFAULT_PLUGIN_TEMPLATE: KobrixaPluginManifest = {
  id: "my-custom-ts-plugin",
  name: "我的自訂 TypeScript 插件 (My TS Plugin)",
  version: "1.0.0",
  author: "Jimmy Li",
  description: "以 TypeScript 編寫的全開放 .kbr 插件，支援自訂插件設置與全域 DOM 操作！",
  enabled: true,
  icon: "🚀",
  settingsSchema: [
    {
      key: "bannerText",
      label: "顯示文字 (Banner Text)",
      type: "string",
      default: "Hello from TypeScript .kbr!",
      description: "插件啟動時彈出或顯示的自訂文字",
    },
    {
      key: "badgeColor",
      label: "強調顏色 (Accent Color)",
      type: "color",
      default: "#ec4899",
      description: "自訂元件的背景或邊框主題色",
    },
    {
      key: "enableToast",
      label: "啟動時顯示通知 (Show Toast)",
      type: "boolean",
      default: true,
      description: "是否在插件載入時彈出歡迎提示",
    },
  ],
  code: `// ============================================================================
// 🛠️ 插件設置區域 (Plugin Settings Schema)
// 在此定義此插件可讓用家在「⚙️ 插件設置」介面修改的選項
// 支援型別: "string" | "number" | "boolean" | "color" | "select"
// ============================================================================
export const settingsSchema: PluginSettingField[] = [
  {
    key: "bannerText",
    label: "顯示文字 (Banner Text)",
    type: "string",
    default: "Hello from TypeScript .kbr!",
    description: "插件啟動時彈出或顯示的自訂文字",
  },
  {
    key: "badgeColor",
    label: "強調顏色 (Accent Color)",
    type: "color",
    default: "#ec4899",
    description: "自訂元件的背景或邊框主題色",
  },
  {
    key: "enableToast",
    label: "啟動時顯示通知 (Show Toast)",
    type: "boolean",
    default: true,
    description: "是否在插件載入時彈出歡迎提示",
  },
];

// ============================================================================
// 🚀 插件主邏輯區域 (Plugin Main Logic - TypeScript)
// 具備 10 分開放性：可直接存取 document, window, 或使用 context 工具庫！
// ============================================================================
export function activate(context: KobrixaPluginContext): void {
  const bannerText: string = context.settings.get<string>("bannerText", "Hello from TypeScript .kbr!");
  const badgeColor: string = context.settings.get<string>("badgeColor", "#ec4899");
  const enableToast: boolean = context.settings.get<boolean>("enableToast", true);

  // 1. 注入自訂 CSS 樣式
  context.ui.injectStyle("my-custom-style", \`
    .my-custom-widget {
      padding: 4px 8px;
      font-size: 11px;
      background: \${badgeColor};
      color: #fff;
      border-radius: 4px;
    }
  \`);

  // 2. 顯示歡迎 Toast 提示
  if (enableToast) {
    context.ui.showToast(\`TypeScript 插件已載入：\${bannerText}\`, "success");
  }

  // 3. 監聽「⚙️ 插件設置」的即時修改
  context.settings.onChange((newValues: Record<string, PluginSettingValue>): void => {
    console.log("插件設置已更新：", newValues);
  });

  // 4. 註冊銷毀清理邏輯
  context.onDeactivate((): void => {
    console.log("插件已停止");
  });
}
`,
};

export function PluginsPanel({ locale }: { locale: Locale }): React.JSX.Element {
  const isZh = locale === "zh-TW";
  const t = {
    title: isZh ? "外掛與插件 (TypeScript .kbr)" : "Plugins & Extensions (TypeScript .kbr)",
    subtitle: isZh
      ? "以 TypeScript (TS) 編寫的超高開放度擴充系統。支援腳本內定義專屬插件設置區域、任意 DOM 修改、全域樣式注入與 .kbr 格式匯出匯入。"
      : "High-freedom extension system powered by TypeScript (TS). Define custom plugin settings in script, modify DOM, inject CSS, and import/export .kbr files.",
    newPlugin: isZh ? "新增 TS 插件" : "New TS Plugin",
    importKbr: isZh ? "匯入 .kbr 檔案" : "Import .kbr File",
    resetBuiltin: isZh ? "恢復預設插件" : "Restore Built-ins",
    searchPlaceholder: isZh
      ? "搜尋插件名稱、ID 或描述…"
      : "Search plugin name, ID, or description…",
    all: isZh ? "全部" : "All",
    enabled: isZh ? "已啟用" : "Enabled",
    disabled: isZh ? "已停用" : "Disabled",
    settingsBtn: isZh ? "插件設置" : "Plugin Settings",
    edit: isZh ? "編輯 TS 代碼" : "Edit TS Code",
    export: isZh ? "匯出 .kbr" : "Export .kbr",
    delete: isZh ? "刪除" : "Delete",
    confirmDelete: isZh ? "確定要刪除此插件嗎？" : "Are you sure you want to delete this plugin?",
    running: isZh ? "運行中" : "Running",
    stopped: isZh ? "已停止" : "Stopped",
    error: isZh ? "執行錯誤" : "Error",
    empty: isZh ? "沒有找到符合的插件" : "No matching plugins found",
    dropHint: isZh
      ? "拖曳 .kbr 檔案至此處，或點擊上方按鈕匯入"
      : "Drag .kbr files here, or click Import above",
  };

  const [runtimeStates, setRuntimeStates] = useState<PluginRuntimeState[]>(() =>
    getPluginRuntimeStates(),
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [editingPlugin, setEditingPlugin] = useState<KobrixaPluginManifest | null>(null);
  const [configuringPlugin, setConfiguringPlugin] = useState<KobrixaPluginManifest | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshState = () => {
    setRuntimeStates(getPluginRuntimeStates());
  };

  useEffect(() => {
    const handleUpdate = () => refreshState();
    window.addEventListener("kobrixa:plugins-change", handleUpdate);
    return () => window.removeEventListener("kobrixa:plugins-change", handleUpdate);
  }, []);

  const handleToggle = (id: string) => {
    togglePlugin(id);
    refreshState();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`${t.confirmDelete}\n(${name})`)) {
      deletePlugin(id);
      refreshState();
    }
  };

  const handleExport = (manifest: KobrixaPluginManifest) => {
    const content = exportPluginToKbr(manifest);
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${manifest.id}.kbr`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        try {
          const parsed = parseKbrFile(text, file.name);
          saveOrUpdatePlugin(parsed);
          refreshState();
          alert(
            isZh
              ? `成功匯入 TypeScript .kbr 插件：「${parsed.name}」！`
              : `Successfully imported TypeScript .kbr plugin: "${parsed.name}"!`,
          );
        } catch (err) {
          alert((isZh ? "匯入失敗：" : "Import failed: ") + String(err));
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) handleImportFile(file);
    }
  };

  const handleSaveModal = (manifest: KobrixaPluginManifest) => {
    saveOrUpdatePlugin(manifest);
    setEditingPlugin(null);
    refreshState();
  };

  const filtered = runtimeStates.filter(({ manifest }) => {
    if (filter === "enabled" && !manifest.enabled) return false;
    if (filter === "disabled" && manifest.enabled) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      manifest.name.toLowerCase().includes(q) ||
      manifest.id.toLowerCase().includes(q) ||
      (manifest.description || "").toLowerCase().includes(q)
    );
  });

  const totalCount = runtimeStates.length;
  const runningCount = runtimeStates.filter((s) => s.status === "running").length;

  return (
    <div
      className="kbr-plugins-panel"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".kbr,.ts,.js,.json"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleImportFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      {/* 頂部操作工具列 */}
      <div className="kbr-plugins-toolbar">
        <div className="kbr-search-box">
          <input
            type="search"
            className="kbr-search-input"
            value={query}
            placeholder={t.searchPlaceholder}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className={`kbr-btn ${filter === "all" ? "kbr-btn-primary" : ""}`}
            onClick={() => setFilter("all")}
          >
            {t.all}
          </button>
          <button
            type="button"
            className={`kbr-btn ${filter === "enabled" ? "kbr-btn-primary" : ""}`}
            onClick={() => setFilter("enabled")}
          >
            {t.enabled}
          </button>
          <button
            type="button"
            className={`kbr-btn ${filter === "disabled" ? "kbr-btn-primary" : ""}`}
            onClick={() => setFilter("disabled")}
          >
            {t.disabled}
          </button>
        </div>

        <div className="kbr-toolbar-actions">
          <button
            type="button"
            className="kbr-btn kbr-btn-primary"
            onClick={() =>
              setEditingPlugin({
                ...DEFAULT_PLUGIN_TEMPLATE,
                id: `plugin-${Date.now().toString(36)}`,
              })
            }
          >
            <span>➕</span>
            {t.newPlugin}
          </button>
          <button type="button" className="kbr-btn" onClick={() => fileInputRef.current?.click()}>
            <span>📥</span>
            {t.importKbr}
          </button>
          <button
            type="button"
            className="kbr-btn"
            onClick={() => {
              if (
                window.confirm(isZh ? "確認要重置並恢復預設插件嗎？" : "Restore built-in plugins?")
              ) {
                resetToBuiltinPlugins();
                refreshState();
              }
            }}
          >
            <span>🔄</span>
            {t.resetBuiltin}
          </button>
        </div>
      </div>

      <div className="kbr-plugins-stats">
        {isZh
          ? `共 ${totalCount} 個 TypeScript (.kbr) 插件（${runningCount} 個正在運行）`
          : `${totalCount} TypeScript (.kbr) plugins installed (${runningCount} active)`}
      </div>

      {dragOver && (
        <div className="kbr-dropzone is-dragover">
          <p>{t.dropHint}</p>
        </div>
      )}

      {/* 插件卡片清單 */}
      <div className="kbr-plugin-list">
        {filtered.length === 0 ? (
          <div className="kbr-dropzone">
            <p>{t.empty}</p>
          </div>
        ) : (
          filtered.map(({ manifest, status, lastError, settingsSchema }) => (
            <div
              key={manifest.id}
              className={`kbr-plugin-card ${!manifest.enabled ? "is-disabled" : ""}`}
            >
              <div className="kbr-card-header">
                <div className="kbr-card-identity">
                  <div className="kbr-plugin-icon">{manifest.icon || "🧩"}</div>
                  <div className="kbr-card-meta">
                    <div className="kbr-plugin-title-row">
                      <span className="kbr-plugin-name">{manifest.name}</span>
                      <span className="kbr-badge kbr-badge-ver">v{manifest.version}</span>
                      <span className="kbr-badge kbr-badge-ts">TS · .kbr</span>
                      <span className={`kbr-badge kbr-badge-status-${status}`}>
                        {status === "running"
                          ? `🟢 ${t.running}`
                          : status === "error"
                            ? `🔴 ${t.error}`
                            : `⚪ ${t.stopped}`}
                      </span>
                    </div>
                    <div className="kbr-plugin-author-id">
                      <span>ID: {manifest.id}</span>
                      {manifest.author && (
                        <span>
                          {" "}
                          · {isZh ? "作者：" : "By: "}
                          {manifest.author}
                        </span>
                      )}
                      {settingsSchema.length > 0 && (
                        <span>
                          {" "}
                          ·{" "}
                          {isZh
                            ? `🛠️ 內含 ${settingsSchema.length} 項可調設置`
                            : `🛠️ ${settingsSchema.length} configurable settings`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="kbr-card-controls">
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      cursor: "pointer",
                      gap: "6px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={manifest.enabled}
                      onChange={() => handleToggle(manifest.id)}
                    />
                    <span style={{ fontSize: "12px" }}>
                      {manifest.enabled ? t.enabled : t.disabled}
                    </span>
                  </label>
                </div>
              </div>

              {manifest.description && <p className="kbr-plugin-desc">{manifest.description}</p>}

              {lastError && (
                <div className="kbr-plugin-error-banner">
                  <strong>⚠️ {t.error}: </strong>
                  {lastError}
                </div>
              )}

              <div className="kbr-card-footer">
                <button
                  type="button"
                  className="kbr-btn kbr-btn-settings"
                  onClick={() => setConfiguringPlugin({ ...manifest })}
                >
                  <span>⚙️</span>
                  {t.settingsBtn}
                  {settingsSchema.length > 0 ? ` (${settingsSchema.length})` : ""}
                </button>
                <button
                  type="button"
                  className="kbr-btn"
                  onClick={() => setEditingPlugin({ ...manifest })}
                >
                  <span>✏️</span>
                  {t.edit}
                </button>
                <button type="button" className="kbr-btn" onClick={() => handleExport(manifest)}>
                  <span>📤</span>
                  {t.export}
                </button>
                <button
                  type="button"
                  className="kbr-btn kbr-btn-danger"
                  onClick={() => handleDelete(manifest.id, manifest.name)}
                >
                  <span>🗑️</span>
                  {t.delete}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 插件專屬設置 Modal */}
      {configuringPlugin && (
        <PluginSettingsModal
          plugin={configuringPlugin}
          locale={locale}
          onClose={() => {
            setConfiguringPlugin(null);
            refreshState();
          }}
          onOpenCodeEditor={() => {
            const target = configuringPlugin;
            setConfiguringPlugin(null);
            setEditingPlugin({ ...target });
          }}
        />
      )}

      {/* 編輯/建立插件代碼 Modal */}
      {editingPlugin && (
        <PluginEditModal
          plugin={editingPlugin}
          locale={locale}
          onSave={handleSaveModal}
          onClose={() => setEditingPlugin(null)}
        />
      )}
    </div>
  );
}

/** 插件專屬設置面板 Modal (可即時修改腳本 settingsSchema 定義的項目) */
function PluginSettingsModal({
  plugin,
  locale,
  onClose,
  onOpenCodeEditor,
}: {
  plugin: KobrixaPluginManifest;
  locale: Locale;
  onClose(): void;
  onOpenCodeEditor(): void;
}): React.JSX.Element {
  const isZh = locale === "zh-TW";
  const schema = extractPluginSettingsSchema(plugin);
  const [values, setValues] = useState<Record<string, PluginSettingValue>>(() =>
    getPluginSettingsValues(plugin),
  );

  const handleChange = (key: string, nextVal: PluginSettingValue) => {
    const updated = setPluginSettingValue(plugin.id, key, nextVal);
    setValues({ ...updated });
  };

  const handleReset = () => {
    const defaults = resetPluginSettings(plugin.id);
    setValues({ ...defaults });
  };

  return (
    <div className="kbr-modal-backdrop" onClick={onClose}>
      <div className="kbr-modal-content kbr-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kbr-modal-header">
          <h3>⚙️ {isZh ? `插件專屬設置 — ${plugin.name}` : `Plugin Settings — ${plugin.name}`}</h3>
          <button type="button" className="kbr-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="kbr-modal-body">
          {schema.length === 0 ? (
            <div className="kbr-dropzone">
              <p>
                {isZh
                  ? "此插件目前尚未在腳本的「🛠️ 插件設置區域 (settingsSchema)」定義可調項目。"
                  : "This plugin has not defined any configurable fields in its settingsSchema section yet."}
              </p>
              <button type="button" className="kbr-btn kbr-btn-primary" onClick={onOpenCodeEditor}>
                ✏️ {isZh ? "前往腳本新增設置項目" : "Add Settings in Script"}
              </button>
            </div>
          ) : (
            <div className="kbr-plugin-settings-list">
              <div className="kbr-settings-banner">
                {isZh
                  ? "💡 以下設置項目由插件腳本內的「🛠️ 插件設置區域 (export const settingsSchema)」自動生成，修改後立即生效！"
                  : "💡 These settings are generated from the plugin script's `settingsSchema` region and take effect immediately!"}
              </div>
              {schema.map((field: PluginSettingField) => {
                const currentVal = values[field.key] ?? field.default;
                return (
                  <div key={field.key} className="kbr-setting-item">
                    <div className="kbr-setting-info">
                      <label className="kbr-setting-label">
                        {field.label} <code className="kbr-setting-key">({field.key})</code>
                      </label>
                      {field.description && (
                        <span className="kbr-setting-desc">{field.description}</span>
                      )}
                    </div>

                    <div className="kbr-setting-control">
                      {field.type === "boolean" ? (
                        <input
                          type="checkbox"
                          checked={Boolean(currentVal)}
                          onChange={(e) => handleChange(field.key, e.target.checked)}
                        />
                      ) : field.type === "color" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="color"
                            value={String(currentVal)}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                          />
                          <input
                            type="text"
                            className="kbr-form-input"
                            style={{ width: "100px" }}
                            value={String(currentVal)}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                          />
                        </div>
                      ) : field.type === "number" ? (
                        <input
                          type="number"
                          className="kbr-form-input"
                          style={{ width: "120px" }}
                          value={Number(currentVal)}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          onChange={(e) => handleChange(field.key, Number(e.target.value))}
                        />
                      ) : field.type === "select" && field.options ? (
                        <select
                          className="kbr-form-input"
                          value={String(currentVal)}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                        >
                          {field.options.map((opt) => (
                            <option key={String(opt.value)} value={String(opt.value)}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="kbr-form-input"
                          style={{ minWidth: "220px" }}
                          value={String(currentVal)}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="kbr-modal-footer">
          {schema.length > 0 && (
            <button type="button" className="kbr-btn" onClick={handleReset}>
              🔄 {isZh ? "恢復預設設置" : "Reset to Defaults"}
            </button>
          )}
          <button type="button" className="kbr-btn" onClick={onOpenCodeEditor}>
            ✏️ {isZh ? "編輯腳本與設置定義" : "Edit Script & Schema"}
          </button>
          <button type="button" className="kbr-btn kbr-btn-primary" onClick={onClose}>
            {isZh ? "完成" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PluginEditModal({
  plugin,
  locale,
  onSave,
  onClose,
}: {
  plugin: KobrixaPluginManifest;
  locale: Locale;
  onSave(manifest: KobrixaPluginManifest): void;
  onClose(): void;
}): React.JSX.Element {
  const isZh = locale === "zh-TW";
  const [form, setForm] = useState<KobrixaPluginManifest>({ ...plugin });
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const detectedSchema = extractPluginSettingsSchema(form);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const nextCode = form.code.substring(0, start) + "  " + form.code.substring(end);
      setForm({ ...form, code: nextCode });
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  const insertSettingFieldTemplate = () => {
    const fieldSnippet = `  {
    key: "customOption_${Date.now().toString(36).slice(-3)}",
    label: "自訂選項名稱",
    type: "string",
    default: "預設內容",
    description: "說明此插件設置的作用",
  },\n`;

    if (form.code.includes("settingsSchema")) {
      const updated = form.code.replace(
        /(export\s+const\s+settingsSchema[^=]*=\s*\[\s*\n?)/,
        `$1${fieldSnippet}`,
      );
      setForm({ ...form, code: updated });
    } else {
      const schemaRegion = `// ============================================================================
// 🛠️ 插件設置區域 (Plugin Settings Schema)
// 在此定義此插件可讓用家在「⚙️ 插件設置」介面修改的選項
// ============================================================================
export const settingsSchema: PluginSettingField[] = [
${fieldSnippet}];

`;
      setForm({ ...form, code: schemaRegion + form.code });
    }
  };

  return (
    <div className="kbr-modal-backdrop" onClick={onClose}>
      <div className="kbr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="kbr-modal-header">
          <h3>
            {form.icon || "⚙️"}{" "}
            {isZh
              ? `編輯 TypeScript (.kbr) 插件代碼 - ${form.name}`
              : `Edit TypeScript (.kbr) Plugin - ${form.name}`}
          </h3>
          <button type="button" className="kbr-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="kbr-modal-body">
          <div className="kbr-form-row">
            <div className="kbr-form-group">
              <label className="kbr-form-label">{isZh ? "唯一標識 (ID)" : "Plugin ID"}</label>
              <input
                className="kbr-form-input"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value.trim() })}
              />
            </div>
            <div className="kbr-form-group">
              <label className="kbr-form-label">{isZh ? "插件名稱" : "Plugin Name"}</label>
              <input
                className="kbr-form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="kbr-form-group">
              <label className="kbr-form-label">{isZh ? "版本號" : "Version"}</label>
              <input
                className="kbr-form-input"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
              />
            </div>
            <div className="kbr-form-group">
              <label className="kbr-form-label">{isZh ? "作者" : "Author"}</label>
              <input
                className="kbr-form-input"
                value={form.author || ""}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </div>
            <div className="kbr-form-group">
              <label className="kbr-form-label">{isZh ? "圖示 (Emoji)" : "Icon (Emoji)"}</label>
              <input
                className="kbr-form-input"
                style={{ width: "80px" }}
                value={form.icon || "🧩"}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
              />
            </div>
          </div>

          <div className="kbr-form-group">
            <label className="kbr-form-label">{isZh ? "功能描述" : "Description"}</label>
            <input
              className="kbr-form-input"
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <details className="kbr-api-docs">
            <summary>
              {isZh
                ? "📖 點此查看 TypeScript (.kbr) 插件設置區域與極致開放 API 指引"
                : "📖 TypeScript (.kbr) Settings Schema & Open API Reference"}
            </summary>
            <div style={{ marginTop: "10px", lineHeight: "1.7" }}>
              <p>
                <strong>{isZh ? "1. 腳本內插件設置區域：" : "1. Script Settings Region: "}</strong>
                {isZh
                  ? "在腳本頂部定義 `export const settingsSchema: PluginSettingField[] = [...]`，系統會自動在插件卡片的「⚙️ 插件設置」生成圖形化控制面板！"
                  : "Define `export const settingsSchema: PluginSettingField[] = [...]` at the top of your script to auto-generate the graphical settings UI!"}
              </p>
              <ul>
                <li>
                  <code>context.settings.get&lt;T&gt;(key, defaultVal)</code>：
                  {isZh ? "讀取此插件的當前設置值" : "Read current plugin setting value"}
                </li>
                <li>
                  <code>context.settings.onChange((values) =&gt; ...)</code>：
                  {isZh
                    ? "當用家修改「⚙️ 插件設置」時即時觸發回調"
                    : "Listen to live setting changes"}
                </li>
                <li>
                  <code>context.ui.injectStyle(id, css)</code>：
                  {isZh
                    ? "動態注入 CSS 樣式，停用時自動還原"
                    : "Inject CSS rules with auto-cleanup"}
                </li>
                <li>
                  <code>context.ui.mountElement(selector, element)</code>：
                  {isZh ? "將 DOM 節點掛載到任意容器中" : "Mount custom DOM element anywhere"}
                </li>
                <li>
                  <code>context.ui.showToast(message, type)</code>：
                  {isZh ? "彈出即時通知浮窗" : "Show toast message"}
                </li>
              </ul>
            </div>
          </details>

          <div className="kbr-code-wrapper">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <label className="kbr-form-label">
                {isZh
                  ? `TypeScript 插件原始碼 (.kbr) — 已偵測到 ${detectedSchema.length} 項插件設置`
                  : `TypeScript Plugin Source (.kbr) — ${detectedSchema.length} settings detected`}
              </label>
              <button
                type="button"
                className="kbr-btn"
                style={{ padding: "3px 10px", fontSize: "12px" }}
                onClick={insertSettingFieldTemplate}
              >
                ➕ {isZh ? "在腳本插入新設置項目" : "Insert Setting Field in Script"}
              </button>
            </div>
            <textarea
              className="kbr-code-editor"
              value={form.code}
              spellCheck={false}
              onKeyDown={handleKeyDown}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>

          {testResult && (
            <div
              style={{
                fontSize: "12px",
                padding: "8px 12px",
                borderRadius: "6px",
                background: testResult.ok ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                border: `1px solid ${testResult.ok ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                color: testResult.ok ? "#34d399" : "#f87171",
              }}
            >
              {testResult.msg}
            </div>
          )}
        </div>

        <div className="kbr-modal-footer">
          <button
            type="button"
            className="kbr-btn"
            onClick={() => {
              const check = checkPluginSyntax(form.code);
              if (check.valid) {
                const count = extractPluginSettingsSchema(form).length;
                setTestResult({
                  ok: true,
                  msg: isZh
                    ? `✅ TypeScript (.kbr) 語法檢測通過！（支援 export 與型別標註，共偵測到 ${count} 項插件設置）`
                    : `✅ TypeScript (.kbr) syntax check passed! (${count} plugin settings detected)`,
                });
              } else {
                setTestResult({
                  ok: false,
                  msg: isZh ? `❌ 語法錯誤: ${check.error}` : `❌ Syntax Error: ${check.error}`,
                });
              }
            }}
          >
            🔍 {isZh ? "TS 語法檢測" : "Check TS Syntax"}
          </button>
          <button type="button" className="kbr-btn" onClick={onClose}>
            {isZh ? "取消" : "Cancel"}
          </button>
          <button type="button" className="kbr-btn kbr-btn-primary" onClick={() => onSave(form)}>
            {isZh ? "保存並即時執行" : "Save & Run"}
          </button>
        </div>
      </div>
    </div>
  );
}
