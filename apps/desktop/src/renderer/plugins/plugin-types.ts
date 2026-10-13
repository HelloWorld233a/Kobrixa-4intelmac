/**
 * Kobrixa-4intelmac .kbr 插件擴充系統 (TypeScript Edition) - 類型定義
 */

export type PluginSettingValue = string | number | boolean;

export type PluginSettingFieldType = "string" | "number" | "boolean" | "color" | "select";

export interface PluginSettingOption {
  label: string;
  value: string | number;
}

export interface PluginSettingField {
  /** 設定鍵名 (例如 "greetingText") */
  key: string;
  /** 顯示名稱 (例如 "自訂問候語") */
  label: string;
  /** 設定控制項類型 */
  type: PluginSettingFieldType;
  /** 預設值 */
  default: PluginSettingValue;
  /** 說明提示 */
  description?: string | undefined;
  /** 下拉選單選項 (當 type === "select" 時使用) */
  options?: PluginSettingOption[] | undefined;
  /** 數值範圍與步進 (當 type === "number" 時使用) */
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
}

export interface KobrixaPluginManifest {
  /** 插件唯一識別碼 (英文/數字/連字號) */
  id: string;
  /** 插件名稱 */
  name: string;
  /** 版本號，如 "1.0.0" */
  version: string;
  /** 作者 */
  author?: string | undefined;
  /** 插件說明 */
  description?: string | undefined;
  /** 是否啟用 */
  enabled: boolean;
  /** 插件圖示 (Emoji 或 Icon 名稱) */
  icon?: string | undefined;
  /** TypeScript (.kbr) 原始碼 */
  code: string;
  /** 插件設置結構 (可由腳本內的 settingsSchema 自動解析同步) */
  settingsSchema?: PluginSettingField[] | undefined;
}

export type PluginExecutionStatus = "idle" | "running" | "error" | "stopped";

export interface PluginRuntimeState {
  manifest: KobrixaPluginManifest;
  status: PluginExecutionStatus;
  lastError?: string | undefined;
  lastExecutedAt?: number | undefined;
  logs: string[];
  settingsSchema: PluginSettingField[];
  settingsValues: Record<string, PluginSettingValue>;
}

/** 注入給 .kbr TypeScript 插件的極致開放 Context 上下文 */
export interface KobrixaPluginContext {
  /** 當前插件 Manifest 資訊 */
  plugin: KobrixaPluginManifest;
  /** 插件專屬可調設置 (對應腳本內定義的 settingsSchema) */
  settings: {
    /** 讀取指定設置項的值 (若未修改過則回傳該項目的 default 預設值) */
    get<T extends PluginSettingValue = PluginSettingValue>(key: string, fallback?: T): T;
    /** 獲取所有設置項的當前鍵值對 */
    getAll(): Record<string, PluginSettingValue>;
    /** 動態更新指定設置項的值 */
    set(key: string, value: PluginSettingValue): void;
    /** 當使用者在「⚙️ 插件設置」面板修改任何選項時即時觸發 */
    onChange(listener: (values: Record<string, PluginSettingValue>) => void): () => void;
  };
  /** DOM 與 UI 快捷操作 (亦可直接使用 document / window) */
  ui: {
    /** 動態注入 CSS 樣式，插件停用時自動銷毀 */
    injectStyle(id: string, css: string): () => void;
    /** 在頂部標題列快捷區域新增按鈕/元素 */
    addHeaderItem(id: string, element: HTMLElement): () => void;
    /** 在底部狀態列新增自訂狀態文字/徽章 */
    addStatusBarItem(id: string, element: HTMLElement): () => void;
    /** 掛載元素至任意 CSS Selector 容器中，插件停用時自動移除 */
    mountElement(containerSelector: string, element: HTMLElement): () => void;
    /** 顯示即時 Toast 通知提示 */
    showToast(message: string, type?: "info" | "success" | "warn" | "error"): void;
  };
  /** 事件通訊匯流排 (插件停用時自動註銷監聽器) */
  events: {
    on(eventName: string, handler: (e: CustomEvent | Event) => void): () => void;
    emit(eventName: string, detail?: unknown): void;
  };
  /** 插件專屬持久化 LocalStorage 儲存庫 */
  storage: {
    get<T = unknown>(key: string, defaultValue?: T): T | undefined;
    set<T = unknown>(key: string, value: T): void;
    remove(key: string): void;
    clear(): void;
  };
  /** 應用程式與環境資訊 */
  app: {
    version: string;
    isArmMac: boolean;
    getTheme(): string;
  };
  /** 註冊銷毀清理回調函數 (當插件被停用或重載時執行) */
  onDeactivate(cleanupFn: () => void): void;
}
