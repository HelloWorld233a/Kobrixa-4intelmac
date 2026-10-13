import { useEffect, useRef, useState } from "react";
import type { Locale } from "../i18n/copy.js";
import type { KobrixaPluginManifest, PluginRuntimeState } from "./plugin-types.js";
import {
  deletePlugin,
  exportPluginToKbr,
  getPluginRuntimeStates,
  parseKbrFile,
  resetToBuiltinPlugins,
  saveOrUpdatePlugin,
  togglePlugin,
} from "./plugin-manager.js";

const DEFAULT_PLUGIN_TEMPLATE: KobrixaPluginManifest = {
  id: "my-custom-plugin",
  name: "我的自訂插件 (My Plugin)",
  version: "1.0.0",
  author: "Jimmy Li",
  description: "全開放 JavaScript 插件，可隨意修改 DOM、樣式或註冊快捷工具！",
  enabled: true,
  icon: "🚀",
  code: `// .kbr 插件入口函數
// 具備 10 分開放性：可直接存取 document, window, 或使用 context 工具庫！
export function activate(context) {
  // 1. 注入自訂 CSS 樣式
  context.ui.injectStyle("my-custom-style", \`
    .my-custom-widget {
      padding: 4px 8px;
      font-size: 11px;
      background: var(--primary, #db2777);
      color: #fff;
      border-radius: 4px;
    }
  \`);

  // 2. 顯示歡迎 Toast 提示
  context.ui.showToast("自訂插件已成功載入並運行！", "success");

  // 3. 註冊銷毀清理邏輯
  context.onDeactivate(() => {
    console.log("插件已停止");
  });
}
`,
};

export function PluginsPanel({ locale }: { locale: Locale }): React.JSX.Element {
  const isZh = locale === "zh-TW";
  const t = {
    title: isZh ? "外掛與插件 (.kbr)" : "Plugins & Extensions (.kbr)",
    subtitle: isZh
      ? "以現代 JavaScript 編寫的超高開放度擴充系統。支援任意 DOM 修改、全域樣式注入、事件監聽與 .kbr 格式匯出匯入。"
      : "High-freedom extension system powered by modern JavaScript. Modify DOM, inject custom CSS, listen to events, and import/export .kbr files.",
    newPlugin: isZh ? "新增插件" : "New Plugin",
    importKbr: isZh ? "匯入 .kbr 檔案" : "Import .kbr File",
    resetBuiltin: isZh ? "恢復預設插件" : "Restore Built-ins",
    searchPlaceholder: isZh
      ? "搜尋插件名稱、ID 或描述…"
      : "Search plugin name, ID, or description…",
    all: isZh ? "全部" : "All",
    enabled: isZh ? "已啟用" : "Enabled",
    disabled: isZh ? "已停用" : "Disabled",
    edit: isZh ? "編輯代碼" : "Edit Code",
    export: isZh ? "匯出 .kbr" : "Export .kbr",
    delete: isZh ? "刪除" : "Delete",
    confirmDelete: isZh ? "確定要刪除此插件嗎？" : "Are you sure you want to delete this plugin?",
    saveAndRun: isZh ? "保存並即時執行" : "Save & Run",
    cancel: isZh ? "取消" : "Cancel",
    running: isZh ? "運行中" : "Running",
    stopped: isZh ? "已停止" : "Stopped",
    error: isZh ? "執行錯誤" : "Error",
    empty: isZh ? "沒有找到符合的插件" : "No matching plugins found",
    dropHint: isZh
      ? "拖曳 .kbr 檔案至此處，或點擊上方按鈕匯入"
      : "Drag .kbr files here, or click Import above",
    apiDocsTitle: isZh
      ? "💡 .kbr 插件開放 API 快速參考"
      : "💡 .kbr Open Plugin API Quick Reference",
  };

  const [runtimeStates, setRuntimeStates] = useState<PluginRuntimeState[]>(() =>
    getPluginRuntimeStates(),
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [editingPlugin, setEditingPlugin] = useState<KobrixaPluginManifest | null>(null);
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
              ? `成功匯入 .kbr 插件：「${parsed.name}」！`
              : `Successfully imported .kbr plugin: "${parsed.name}"!`,
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
        accept=".kbr,.json,.js"
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
          ? `共 ${totalCount} 個插件（${runningCount} 個正在運行）`
          : `${totalCount} plugins installed (${runningCount} active)`}
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
          filtered.map(({ manifest, status, lastError }) => (
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

      {/* 編輯/建立插件 Modal */}
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
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 支援 Tab 鍵縮排 2 格
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

  return (
    <div className="kbr-modal-backdrop" onClick={onClose}>
      <div className="kbr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="kbr-modal-header">
          <h3>
            {form.icon || "⚙️"}{" "}
            {isZh ? `編輯 .kbr 插件代碼 - ${form.name}` : `Edit .kbr Plugin - ${form.name}`}
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
              {isZh ? "📖 點此查看極致開放 API 與 DOM 自由操作指引" : "📖 Open API & DOM Reference"}
            </summary>
            <div style={{ marginTop: "10px", lineHeight: "1.7" }}>
              <p>
                <strong>{isZh ? "全境開放執行：" : "Full Open Access: "}</strong>
                {isZh
                  ? "您可以直接呼叫 document、window、localStorage、fetch 或使用注入的 context 物件！"
                  : "You can directly access document, window, localStorage, fetch, or use the injected context!"}
              </p>
              <ul>
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
                <li>
                  <code>context.events.on(name, handler)</code>：
                  {isZh ? "監聽視窗或自訂事件" : "Listen to events with auto-cleanup"}
                </li>
                <li>
                  <code>context.storage.get / set(key, val)</code>：
                  {isZh ? "讀寫該插件專屬的持久化數據" : "Scoped persistent storage"}
                </li>
                <li>
                  <code>context.onDeactivate(fn)</code>：
                  {isZh ? "註冊停用清理函數" : "Register cleanup disposer"}
                </li>
              </ul>
            </div>
          </details>

          <div className="kbr-code-wrapper">
            <label className="kbr-form-label">
              {isZh ? "JavaScript 插件原始碼 (.kbr)" : "JavaScript Plugin Source Code (.kbr)"}
            </label>
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
                padding: "8px",
                borderRadius: "6px",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              {testResult}
            </div>
          )}
        </div>

        <div className="kbr-modal-footer">
          <button
            type="button"
            className="kbr-btn"
            onClick={() => {
              try {
                // 語法檢查
                new Function("context", "window", "document", "console", form.code);
                setTestResult(
                  isZh ? "✅ JavaScript 語法檢查通過！" : "✅ JavaScript syntax check passed!",
                );
              } catch (err) {
                setTestResult(
                  isZh ? `❌ 語法錯誤: ${String(err)}` : `❌ Syntax Error: ${String(err)}`,
                );
              }
            }}
          >
            {isZh ? "語法檢測" : "Check Syntax"}
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
