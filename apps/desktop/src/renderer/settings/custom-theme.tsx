import { useEffect, useRef, useState } from "react";
import type { Locale } from "../i18n/copy.js";

export interface SyntaxThemeConfig {
  keyword?: string;
  controlKeyword?: string;
  string?: string;
  number?: string;
  comment?: string;
  function?: string;
  variable?: string;
  type?: string;
  operator?: string;
  delimiter?: string;
  lineHighlight?: string;
  cursor?: string;
}

export interface CustomThemeConfig {
  name: string;
  accent: string;
  primary?: string;
  primaryHover?: string;
  selection?: string;
  onAccent?: string;

  // Overall UI Background & Surfaces
  surface?: string;
  editorBg?: string;
  raised?: string;
  border?: string;
  hover?: string;

  // Typography & Fonts
  textColor?: string;
  mutedColor?: string;
  fontFamily?: string;
  codeFontFamily?: string;

  // Code Syntax Highlighting Tokens
  syntax?: SyntaxThemeConfig;

  // Wallpaper / Background Image
  backgroundImage?: string | null;
  bgOpacity?: number; // 0.5 to 0.98
  blur?: number; // 0 to 24px
}

export const DEFAULT_PINK_THEME: CustomThemeConfig = {
  name: "Sakura Pink (櫻花粉)",
  accent: "#ec4899",
  primary: "#db2777",
  primaryHover: "#f472b6",
  selection: "rgba(244, 114, 182, 0.28)",
  onAccent: "#ffffff",

  surface: "#1f242d",
  editorBg: "#181d24",
  raised: "#282f3a",
  border: "#3d4756",
  hover: "#2e3744",

  textColor: "#f3e8ee",
  mutedColor: "#b8a5b0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", system-ui, sans-serif',
  codeFontFamily: '"JetBrains Mono", SFMono-Regular, Menlo, Consolas, monospace',

  syntax: {
    keyword: "#f472b6",
    controlKeyword: "#fb7185",
    string: "#fbcfe8",
    number: "#cbd5e1",
    comment: "#86efac",
    function: "#f9a8d4",
    variable: "#fed7aa",
    type: "#a5f3fc",
    operator: "#f472b6",
    delimiter: "#e2e8f0",
    lineHighlight: "#252b36",
    cursor: "#ec4899",
  },

  backgroundImage: null,
  bgOpacity: 0.85,
  blur: 8,
};

export const THEME_COLOR_PRESETS: {
  id: string;
  labelZh: string;
  labelEn: string;
  theme: CustomThemeConfig;
}[] = [
  {
    id: "sakura-pink",
    labelZh: "🌸 櫻花粉（預設）",
    labelEn: "🌸 Sakura Pink (Default)",
    theme: DEFAULT_PINK_THEME,
  },
  {
    id: "barbie-pink",
    labelZh: "💖 芭比亮粉",
    labelEn: "💖 Barbie Pink",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Barbie Pink",
      accent: "#f43f5e",
      primary: "#e11d48",
      primaryHover: "#fb7185",
      selection: "rgba(244, 63, 94, 0.28)",
      surface: "#211f26",
      editorBg: "#19171d",
      syntax: {
        ...DEFAULT_PINK_THEME.syntax,
        keyword: "#fb7185",
        controlKeyword: "#f43f5e",
        string: "#fda4af",
        function: "#f472b6",
        cursor: "#f43f5e",
      },
    },
  },
  {
    id: "lavender-purple",
    labelZh: "💜 夢幻薰衣草",
    labelEn: "💜 Lavender Purple",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Lavender Purple",
      accent: "#a855f7",
      primary: "#9333ea",
      primaryHover: "#c084fc",
      selection: "rgba(168, 85, 247, 0.28)",
      surface: "#201e2c",
      editorBg: "#171523",
      syntax: {
        ...DEFAULT_PINK_THEME.syntax,
        keyword: "#c084fc",
        controlKeyword: "#d8b4fe",
        string: "#f0abfc",
        function: "#a855f7",
        type: "#818cf8",
        cursor: "#a855f7",
      },
    },
  },
  {
    id: "sky-blue",
    labelZh: "💙 澄澈晴空藍",
    labelEn: "💙 Sky Blue",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Sky Blue",
      accent: "#38bdf8",
      primary: "#0284c7",
      primaryHover: "#7dd3fc",
      selection: "rgba(56, 189, 248, 0.28)",
      surface: "#1a2530",
      editorBg: "#131c25",
      syntax: {
        ...DEFAULT_PINK_THEME.syntax,
        keyword: "#38bdf8",
        controlKeyword: "#7dd3fc",
        string: "#bae6fd",
        function: "#67e8f9",
        type: "#93c5fd",
        cursor: "#38bdf8",
      },
    },
  },
  {
    id: "emerald-mint",
    labelZh: "🍃 翡翠薄荷綠",
    labelEn: "🍃 Mint Emerald",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Mint Emerald",
      accent: "#34d399",
      primary: "#059669",
      primaryHover: "#6ee7b7",
      selection: "rgba(52, 211, 153, 0.28)",
      surface: "#182622",
      editorBg: "#121d1a",
      syntax: {
        ...DEFAULT_PINK_THEME.syntax,
        keyword: "#34d399",
        controlKeyword: "#6ee7b7",
        string: "#a7f3d0",
        function: "#5eead4",
        type: "#6ee7b7",
        cursor: "#34d399",
      },
    },
  },
  {
    id: "cyberpunk-neon",
    labelZh: "🌌 賽博霓虹",
    labelEn: "🌌 Cyberpunk Neon",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Cyberpunk Neon",
      accent: "#f43f5e",
      primary: "#06b6d4",
      primaryHover: "#22d3ee",
      selection: "rgba(244, 63, 94, 0.35)",
      surface: "#111827",
      editorBg: "#0b0f19",
      border: "#374151",
      textColor: "#f9fafb",
      syntax: {
        keyword: "#06b6d4",
        controlKeyword: "#f43f5e",
        string: "#facc15",
        number: "#a855f7",
        comment: "#4ade80",
        function: "#ec4899",
        variable: "#38bdf8",
        type: "#fb923c",
        operator: "#f43f5e",
        cursor: "#22d3ee",
      },
    },
  },
  {
    id: "coral-orange",
    labelZh: "🍊 珊瑚暖橙",
    labelEn: "🍊 Coral Orange",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Coral Orange",
      accent: "#fb923c",
      primary: "#ea580c",
      primaryHover: "#fdba74",
      selection: "rgba(251, 146, 60, 0.28)",
      surface: "#28201a",
      editorBg: "#1f1813",
      syntax: {
        ...DEFAULT_PINK_THEME.syntax,
        keyword: "#fb923c",
        controlKeyword: "#f97316",
        string: "#fed7aa",
        function: "#fdba74",
        cursor: "#fb923c",
      },
    },
  },
  {
    id: "classic-blue",
    labelZh: "🌊 經典鈷藍",
    labelEn: "🌊 Cobalt Blue",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Classic Cobalt",
      accent: "#88acff",
      primary: "#3768dc",
      primaryHover: "#4678ed",
      selection: "rgba(136, 172, 255, 0.28)",
      surface: "#1e2933",
      editorBg: "#18212b",
      raised: "#25323f",
      border: "#364451",
      syntax: {
        keyword: "#569CD6",
        controlKeyword: "#C586C0",
        string: "#CE9178",
        number: "#B5CEA8",
        comment: "#6A9955",
        function: "#DCDCAA",
        variable: "#9CDCFE",
        type: "#4EC9B0",
        operator: "#E6EAF0",
        cursor: "#88acff",
      },
    },
  },
];

export const CUSTOM_THEME_STORAGE_KEY = "kobrixa.customTheme";

export function deriveColorVariants(hexColor: string): {
  accent: string;
  primary: string;
  primaryHover: string;
  selection: string;
  onAccent: string;
} {
  const cleanHex = hexColor.replace("#", "").trim();
  if (cleanHex.length !== 6 && cleanHex.length !== 3) {
    return {
      accent: hexColor,
      primary: hexColor,
      primaryHover: hexColor,
      selection: "rgba(244, 114, 182, 0.28)",
      onAccent: "#ffffff",
    };
  }
  const r = parseInt(
    cleanHex.length === 3 ? cleanHex[0]! + cleanHex[0]! : cleanHex.slice(0, 2),
    16,
  );
  const g = parseInt(
    cleanHex.length === 3 ? cleanHex[1]! + cleanHex[1]! : cleanHex.slice(2, 4),
    16,
  );
  const b = parseInt(
    cleanHex.length === 3 ? cleanHex[2]! + cleanHex[2]! : cleanHex.slice(4, 6),
    16,
  );

  const pr = Math.max(0, Math.floor(r * 0.85));
  const pg = Math.max(0, Math.floor(g * 0.85));
  const pb = Math.max(0, Math.floor(b * 0.85));
  const primary = `#${pr.toString(16).padStart(2, "0")}${pg.toString(16).padStart(2, "0")}${pb.toString(16).padStart(2, "0")}`;

  const hr = Math.min(255, Math.floor(r * 1.15));
  const hg = Math.min(255, Math.floor(g * 1.15));
  const hb = Math.min(255, Math.floor(b * 1.15));
  const primaryHover = `#${hr.toString(16).padStart(2, "0")}${hg.toString(16).padStart(2, "0")}${hb.toString(16).padStart(2, "0")}`;

  const selection = `rgba(${r}, ${g}, ${b}, 0.28)`;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const onAccent = luminance > 0.65 ? "#18212b" : "#ffffff";

  return { accent: hexColor, primary, primaryHover, selection, onAccent };
}

export function loadCustomTheme(): CustomThemeConfig {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_PINK_THEME;
  }
  try {
    const raw = window.localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_PINK_THEME;
    const parsed = JSON.parse(raw) as Partial<CustomThemeConfig>;
    if (!parsed.accent) return DEFAULT_PINK_THEME;
    return {
      ...DEFAULT_PINK_THEME,
      ...parsed,
      syntax: {
        ...DEFAULT_PINK_THEME.syntax,
        ...(parsed.syntax ?? {}),
      },
    };
  } catch {
    return DEFAULT_PINK_THEME;
  }
}

export function saveCustomTheme(config: CustomThemeConfig): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // quota or private mode
  }
  applyCustomTheme(config);
  window.dispatchEvent(new CustomEvent("kobrixa:theme-change", { detail: config }));
}

export function applyCustomTheme(config: CustomThemeConfig = loadCustomTheme()): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Accent & Button colors
  root.style.setProperty("--accent", config.accent);
  root.style.setProperty("--primary", config.primary ?? config.accent);
  root.style.setProperty("--primary-hover", config.primaryHover ?? config.accent);
  root.style.setProperty("--selection", config.selection ?? "rgba(244, 114, 182, 0.28)");
  root.style.setProperty("--on-accent", config.onAccent ?? "#ffffff");

  // Overall UI Background & Panels
  if (config.surface) root.style.setProperty("--surface", config.surface);
  if (config.editorBg) root.style.setProperty("--editor", config.editorBg);
  if (config.raised) root.style.setProperty("--raised", config.raised);
  if (config.border) root.style.setProperty("--border", config.border);
  if (config.hover) root.style.setProperty("--hover", config.hover);

  // Typography & Text
  if (config.textColor) root.style.setProperty("--text", config.textColor);
  if (config.mutedColor) root.style.setProperty("--muted", config.mutedColor);
  if (config.fontFamily) root.style.setProperty("--font-sans", config.fontFamily);
  if (config.codeFontFamily) root.style.setProperty("--font-mono", config.codeFontFamily);

  // Dynamic style tag for font overrides and wallpaper
  let styleEl = document.getElementById("kobrixa-custom-theme-style") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "kobrixa-custom-theme-style";
    document.head.appendChild(styleEl);
  }

  const fontRules = `
    ${config.fontFamily ? `body, input, button, select, textarea { font-family: ${config.fontFamily} !important; }` : ""}
    ${config.codeFontFamily ? `.monaco-editor, .monaco-editor textarea, pre, code { font-family: ${config.codeFontFamily} !important; }` : ""}
  `;

  if (config.backgroundImage) {
    root.dataset.hasWallpaper = "true";
    const opacity = config.bgOpacity ?? 0.85;
    const blur = config.blur ?? 8;
    styleEl.textContent = `
      ${fontRules}
      :root[data-has-wallpaper="true"] .app-shell {
        background-image: url("${config.backgroundImage}") !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        background-attachment: fixed !important;
      }
      :root[data-has-wallpaper="true"] .workspace,
      :root[data-has-wallpaper="true"] .center,
      :root[data-has-wallpaper="true"] .sidebar,
      :root[data-has-wallpaper="true"] .topbar,
      :root[data-has-wallpaper="true"] footer {
        background: rgba(30, 41, 51, ${opacity}) !important;
        backdrop-filter: blur(${blur}px) !important;
        -webkit-backdrop-filter: blur(${blur}px) !important;
      }
      :root[data-has-wallpaper="true"][data-theme="light"] .workspace,
      :root[data-has-wallpaper="true"][data-theme="light"] .center,
      :root[data-has-wallpaper="true"][data-theme="light"] .sidebar,
      :root[data-has-wallpaper="true"][data-theme="light"] .topbar,
      :root[data-has-wallpaper="true"][data-theme="light"] footer {
        background: rgba(245, 240, 231, ${opacity}) !important;
      }
      :root[data-has-wallpaper="true"] .editor-stage,
      :root[data-has-wallpaper="true"] .editor {
        background: rgba(24, 33, 43, ${Math.min(1, opacity + 0.06)}) !important;
      }
      :root[data-has-wallpaper="true"][data-theme="light"] .editor-stage,
      :root[data-has-wallpaper="true"][data-theme="light"] .editor {
        background: rgba(253, 250, 244, ${Math.min(1, opacity + 0.06)}) !important;
      }
    `;
  } else {
    delete root.dataset.hasWallpaper;
    styleEl.textContent = fontRules;
  }
}

// Automatically apply custom theme (default pink) on initial load
if (typeof window !== "undefined") {
  applyCustomTheme();
}

export function CustomThemePanel({ locale }: { locale: Locale }): React.JSX.Element {
  const t = (zh: string, en: string) => (locale === "zh-TW" ? zh : en);
  const [theme, setTheme] = useState<CustomThemeConfig>(() => loadCustomTheme());
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"colors" | "syntax" | "fonts" | "import">("colors");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<CustomThemeConfig>;
      if (customEvent.detail) setTheme(customEvent.detail);
    };
    window.addEventListener("kobrixa:theme-change", handleThemeChange);
    return () => window.removeEventListener("kobrixa:theme-change", handleThemeChange);
  }, []);

  const updateThemeField = <K extends keyof CustomThemeConfig>(
    field: K,
    value: CustomThemeConfig[K],
  ) => {
    const updated = { ...theme, [field]: value };
    if (field === "accent" && typeof value === "string") {
      const derived = deriveColorVariants(value);
      updated.primary = derived.primary;
      updated.primaryHover = derived.primaryHover;
      updated.selection = derived.selection;
      updated.onAccent = derived.onAccent;
    }
    setTheme(updated);
    saveCustomTheme(updated);
  };

  const updateSyntaxToken = (token: keyof SyntaxThemeConfig, color: string) => {
    const updated: CustomThemeConfig = {
      ...theme,
      syntax: {
        ...(theme.syntax ?? {}),
        [token]: color,
      },
    };
    setTheme(updated);
    saveCustomTheme(updated);
  };

  const handleSelectPreset = (preset: (typeof THEME_COLOR_PRESETS)[number]) => {
    setTheme(preset.theme);
    saveCustomTheme(preset.theme);
    setStatusMessage(t(`已套用主題：${preset.labelZh}`, `Applied theme: ${preset.labelEn}`));
  };

  const handleFilesChosen = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setStatusMessage(t("正在處理檔案…", "Processing theme files…"));

    let jsonProcessed = false;
    let imageProcessed = false;
    const pendingTheme: CustomThemeConfig = { ...theme };

    const finalize = () => {
      setTheme(pendingTheme);
      saveCustomTheme(pendingTheme);
      const messages: string[] = [];
      if (jsonProcessed) messages.push(t("已匯入主題 JSON 設定", "Imported theme JSON config"));
      if (imageProcessed) messages.push(t("已載入主題背景圖片", "Loaded theme wallpaper image"));
      setStatusMessage(messages.join(" · ") || t("檔案處理完成", "Files processed successfully"));
    };

    let remaining = files.length;
    const checkDone = () => {
      remaining -= 1;
      if (remaining <= 0) finalize();
    };

    Array.from(files).forEach((file) => {
      const isJson = file.name.endsWith(".json") || file.type === "application/json";
      const isImage =
        file.type.startsWith("image/") || /\.(png|jpe?g|webp|svg|gif)$/i.test(file.name);

      if (isJson) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const parsed = JSON.parse(content) as Record<string, unknown>;

            // Extract Name
            if (typeof parsed.name === "string") pendingTheme.name = parsed.name;

            // Extract Accent & Core Colors
            const accent = (parsed.accent || parsed.accentColor || parsed.color) as
              string | undefined;
            if (accent && typeof accent === "string") {
              const derived = deriveColorVariants(accent);
              pendingTheme.accent = derived.accent;
              pendingTheme.primary = (parsed.primary as string) || derived.primary;
              pendingTheme.primaryHover = (parsed.primaryHover as string) || derived.primaryHover;
              pendingTheme.selection = (parsed.selection as string) || derived.selection;
              pendingTheme.onAccent = (parsed.onAccent as string) || derived.onAccent;
            }

            // Extract Overall UI colors
            if (typeof parsed.surface === "string") pendingTheme.surface = parsed.surface;
            if (
              typeof parsed.editorBg === "string" ||
              typeof parsed.editorBackground === "string"
            ) {
              pendingTheme.editorBg = (parsed.editorBg || parsed.editorBackground) as string;
            }
            if (typeof parsed.raised === "string") pendingTheme.raised = parsed.raised;
            if (typeof parsed.border === "string") pendingTheme.border = parsed.border;
            if (typeof parsed.hover === "string") pendingTheme.hover = parsed.hover;

            // Extract Typography & Fonts
            if (typeof parsed.textColor === "string" || typeof parsed.foreground === "string") {
              pendingTheme.textColor = (parsed.textColor || parsed.foreground) as string;
            }
            if (typeof parsed.mutedColor === "string") pendingTheme.mutedColor = parsed.mutedColor;
            if (typeof parsed.fontFamily === "string") pendingTheme.fontFamily = parsed.fontFamily;
            if (typeof parsed.codeFontFamily === "string" || typeof parsed.font === "string") {
              pendingTheme.codeFontFamily = (parsed.codeFontFamily || parsed.font) as string;
            }

            // Extract Syntax Tokens
            const syntaxObj = (parsed.syntax || parsed.tokens || parsed.syntaxTokens) as
              Record<string, string> | undefined;
            if (syntaxObj && typeof syntaxObj === "object") {
              pendingTheme.syntax = {
                ...(pendingTheme.syntax ?? {}),
                ...syntaxObj,
              };
            }

            // Extract Wallpaper
            if (
              typeof parsed.backgroundImage === "string" ||
              typeof parsed.wallpaper === "string"
            ) {
              pendingTheme.backgroundImage = (parsed.backgroundImage || parsed.wallpaper) as string;
              imageProcessed = true;
            }
            if (typeof parsed.bgOpacity === "number") {
              pendingTheme.bgOpacity = Math.max(0.4, Math.min(1, parsed.bgOpacity));
            }
            if (typeof parsed.blur === "number") {
              pendingTheme.blur = Math.max(0, Math.min(30, parsed.blur));
            }

            jsonProcessed = true;
          } catch {
            setStatusMessage(t("JSON 解析失敗，請檢查檔案格式。", "Failed to parse theme JSON."));
          }
          checkDone();
        };
        reader.onerror = () => checkDone();
        reader.readAsText(file);
      } else if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            pendingTheme.backgroundImage = dataUrl;
            imageProcessed = true;
          }
          checkDone();
        };
        reader.onerror = () => checkDone();
        reader.readAsDataURL(file);
      } else {
        checkDone();
      }
    });
  };

  const handleExportTheme = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(theme, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `${(theme.name || "kobrixa-theme").toLowerCase().replace(/[^a-z0-9_-]/g, "-")}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setStatusMessage(t("主題設定檔已成功匯出！", "Theme config exported successfully!"));
  };

  const handleResetPink = () => {
    setTheme(DEFAULT_PINK_THEME);
    saveCustomTheme(DEFAULT_PINK_THEME);
    setStatusMessage(
      t("已還原為預設櫻花粉色主題！🌸", "Restored to default Sakura Pink theme! 🌸"),
    );
  };

  const s = theme.syntax ?? DEFAULT_PINK_THEME.syntax!;

  return (
    <div
      className="custom-theme-container"
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* Dedication Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background:
            "linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(244, 114, 182, 0.05) 100%)",
          border: "1px solid var(--accent)",
          borderRadius: "10px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                background: "var(--accent)",
                color: "var(--on-accent)",
                padding: "2px 8px",
                borderRadius: "99px",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              We love 14
            </span>
            <strong style={{ fontSize: "15px" }}>
              {t("高級主題與代碼語法色彩系統", "Advanced Theme & Syntax Highlighting Engine")}
            </strong>
          </div>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>
            {t(
              "預設主題為粉色。支援自訂全域色彩、代碼語法 Token 色彩、字體與背景圖片。",
              "Default theme is Pink. Customize UI colors, syntax token colors, fonts and wallpaper images.",
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={handleResetPink}
          style={{
            padding: "6px 12px",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            background: "transparent",
            borderRadius: "6px",
            fontSize: "12px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {t("還原預設粉色", "Reset Pink Theme")}
        </button>
      </div>

      {statusMessage && (
        <div
          role="status"
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            background: "var(--selection)",
            border: "1px solid var(--accent)",
            fontSize: "13px",
            color: "var(--text)",
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "8px",
        }}
      >
        {[
          { key: "colors" as const, label: t("整體外觀與色彩", "Overall Colors") },
          { key: "syntax" as const, label: t("代碼語法色彩", "Syntax Highlighting") },
          { key: "fonts" as const, label: t("字體與文字", "Fonts & Typography") },
          { key: "import" as const, label: t("檔案匯入與匯出", "Import & Export") },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: activeTab === tab.key ? "1px solid var(--accent)" : "1px solid transparent",
              background: activeTab === tab.key ? "var(--selection)" : "transparent",
              color: activeTab === tab.key ? "var(--accent)" : "var(--muted)",
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Overall Colors */}
      {activeTab === "colors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--text)" }}>
              {t("精選主題預設風格", "Curated Theme Presets")}
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {THEME_COLOR_PRESETS.map((preset) => {
                const isSelected = theme.name === preset.labelZh || theme.name === preset.labelEn;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: isSelected ? "var(--selection)" : "var(--raised)",
                      color: isSelected ? "var(--accent)" : "var(--text)",
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: preset.theme.accent,
                        boxShadow: "0 0 3px rgba(0,0,0,0.3)",
                      }}
                    />
                    {locale === "zh-TW" ? preset.labelZh : preset.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            {[
              {
                label: t("強調主色 (Accent)", "Accent Color"),
                field: "accent" as const,
                val: theme.accent,
              },
              {
                label: t("工作區背景 (Surface)", "Surface Background"),
                field: "surface" as const,
                val: theme.surface || "#1f242d",
              },
              {
                label: t("編輯器背景 (Editor)", "Editor Background"),
                field: "editorBg" as const,
                val: theme.editorBg || "#181d24",
              },
              {
                label: t("面板卡片背景 (Raised)", "Raised Panel"),
                field: "raised" as const,
                val: theme.raised || "#282f3a",
              },
              {
                label: t("邊框顏色 (Border)", "Border Color"),
                field: "border" as const,
                val: theme.border || "#3d4756",
              },
              {
                label: t("懸停底色 (Hover)", "Hover Background"),
                field: "hover" as const,
                val: theme.hover || "#2e3744",
              },
            ].map((item) => (
              <label
                key={item.field}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <span>{item.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="color"
                    value={item.val.startsWith("#") ? item.val : "#ec4899"}
                    onChange={(e) => updateThemeField(item.field, e.target.value)}
                    style={{
                      width: "32px",
                      height: "26px",
                      padding: "1px",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      background: "transparent",
                    }}
                  />
                  <code style={{ fontSize: "11px", color: "var(--muted)" }}>{item.val}</code>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Syntax Token Colors */}
      {activeTab === "syntax" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            {t(
              "自訂程式碼編輯器中各類型語法元素的顯示色彩（JSON key：syntax）：",
              "Customize syntax token colors in the code editor:",
            )}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              {
                token: "keyword" as const,
                label: t("關鍵字 (Dim, Sub, As)", "Keywords (Dim, Sub, As)"),
                val: s.keyword || "#f472b6",
              },
              {
                token: "controlKeyword" as const,
                label: t("控制流程 (If, While, For)", "Control Flow (If, While, For)"),
                val: s.controlKeyword || "#fb7185",
              },
              {
                token: "string" as const,
                label: t('字串文字 ("text")', 'Strings ("text")'),
                val: s.string || "#fbcfe8",
              },
              {
                token: "number" as const,
                label: t("數字 (123, 3.14)", "Numbers (123, 3.14)"),
                val: s.number || "#cbd5e1",
              },
              {
                token: "comment" as const,
                label: t("程式碼註解 (' 注釋)", "Comments (' remark)"),
                val: s.comment || "#86efac",
              },
              {
                token: "function" as const,
                label: t("函式方法 (LCD.Clear)", "Functions & Methods"),
                val: s.function || "#f9a8d4",
              },
              {
                token: "variable" as const,
                label: t("變數識別碼 (speed, x)", "Variables & Identifiers"),
                val: s.variable || "#fed7aa",
              },
              {
                token: "type" as const,
                label: t("資料型別 (Integer, String)", "Types (Integer, String)"),
                val: s.type || "#a5f3fc",
              },
              {
                token: "operator" as const,
                label: t("運算子 (+, -, =, <)", "Operators (+, -, =, <)"),
                val: s.operator || "#f472b6",
              },
              {
                token: "cursor" as const,
                label: t("編輯器游標 (Cursor)", "Editor Cursor"),
                val: s.cursor || "#ec4899",
              },
              {
                token: "lineHighlight" as const,
                label: t("當前行高亮底色", "Line Highlight Background"),
                val: s.lineHighlight || "#252b36",
              },
            ].map((item) => (
              <label
                key={item.token}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <span>{item.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="color"
                    value={item.val.startsWith("#") ? item.val : "#ec4899"}
                    onChange={(e) => updateSyntaxToken(item.token, e.target.value)}
                    style={{
                      width: "32px",
                      height: "26px",
                      padding: "1px",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      background: "transparent",
                    }}
                  />
                  <code style={{ fontSize: "11px", color: "var(--muted)" }}>{item.val}</code>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Fonts & Typography */}
      {activeTab === "fonts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "var(--raised)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              <span>{t("主要文字顏色 (Text)", "Main Text Color")}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="color"
                  value={
                    (theme.textColor || "#f3e8ee").startsWith("#") ? theme.textColor! : "#f3e8ee"
                  }
                  onChange={(e) => updateThemeField("textColor", e.target.value)}
                  style={{
                    width: "32px",
                    height: "26px",
                    padding: "1px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                />
                <code style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {theme.textColor || "#f3e8ee"}
                </code>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "var(--raised)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              <span>{t("次要提示顏色 (Muted)", "Muted Text Color")}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="color"
                  value={
                    (theme.mutedColor || "#b8a5b0").startsWith("#") ? theme.mutedColor! : "#b8a5b0"
                  }
                  onChange={(e) => updateThemeField("mutedColor", e.target.value)}
                  style={{
                    width: "32px",
                    height: "26px",
                    padding: "1px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                />
                <code style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {theme.mutedColor || "#b8a5b0"}
                </code>
              </div>
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h4 style={{ margin: "0", fontSize: "13px", color: "var(--text)" }}>
              {t("程式碼字體 (Code Monospace Font)", "Code Editor Monospace Font")}
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                {
                  name: "JetBrains Mono",
                  value: '"JetBrains Mono", SFMono-Regular, Menlo, Consolas, monospace',
                },
                { name: "Fira Code", value: '"Fira Code", "JetBrains Mono", Consolas, monospace' },
                { name: "SF Mono (Apple)", value: '"SF Mono", Menlo, Monaco, monospace' },
                { name: "Menlo", value: "Menlo, Monaco, Consolas, monospace" },
                { name: "Consolas", value: 'Consolas, "Courier New", monospace' },
              ].map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => updateThemeField("codeFontFamily", f.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background:
                      theme.codeFontFamily === f.value ? "var(--selection)" : "var(--raised)",
                    color: theme.codeFontFamily === f.value ? "var(--accent)" : "var(--text)",
                    fontSize: "12px",
                    fontFamily: f.value,
                    cursor: "pointer",
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={theme.codeFontFamily || ""}
              placeholder='例如: "JetBrains Mono", Menlo, monospace'
              onChange={(e) => updateThemeField("codeFontFamily", e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--raised)",
                color: "var(--text)",
                fontSize: "13px",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h4 style={{ margin: "0", fontSize: "13px", color: "var(--text)" }}>
              {t("介面字體 (Interface UI Font)", "Interface UI Font")}
            </h4>
            <input
              type="text"
              value={theme.fontFamily || ""}
              placeholder='例如: system-ui, -apple-system, "Noto Sans TC", sans-serif'
              onChange={(e) => updateThemeField("fontFamily", e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--raised)",
                color: "var(--text)",
                fontSize: "13px",
              }}
            />
          </div>
        </div>
      )}

      {/* LIVE CODE PREVIEW (Shown in all tabs) */}
      <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <h4 style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
          {t("即時代碼語法渲染預覽效果", "Live Code Syntax Highlighting Preview")}
        </h4>
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "10px",
            background: theme.editorBg || "#181d24",
            border: `1px solid ${theme.border || "#3d4756"}`,
            fontFamily: theme.codeFontFamily || '"JetBrains Mono", monospace',
            fontSize: "13px",
            lineHeight: 1.6,
            color: theme.textColor || "#f3e8ee",
            overflowX: "auto",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          }}
        >
          <div>
            <span style={{ color: "#697a8b", marginRight: "16px", userSelect: "none" }}>1</span>
            <span style={{ color: s.comment || "#86efac" }}>
              ' We love 14 - Basic Plus Syntax Preview
            </span>
          </div>
          <div>
            <span style={{ color: "#697a8b", marginRight: "16px", userSelect: "none" }}>2</span>
            <span style={{ color: s.keyword || "#f472b6", fontWeight: 650 }}>Sub</span>{" "}
            <span style={{ color: s.function || "#f9a8d4", fontWeight: 650 }}>Main</span>()
          </div>
          <div>
            <span style={{ color: "#697a8b", marginRight: "16px", userSelect: "none" }}>3</span>
            {"  "}
            <span style={{ color: s.keyword || "#f472b6" }}>Dim</span>{" "}
            <span style={{ color: s.variable || "#fed7aa" }}>speed</span>{" "}
            <span style={{ color: s.keyword || "#f472b6" }}>As</span>{" "}
            <span style={{ color: s.type || "#a5f3fc" }}>Integer</span>{" "}
            <span style={{ color: s.operator || "#f472b6" }}>=</span>{" "}
            <span style={{ color: s.number || "#cbd5e1" }}>75</span>
          </div>
          <div>
            <span style={{ color: "#697a8b", marginRight: "16px", userSelect: "none" }}>4</span>
            {"  "}
            <span style={{ color: s.keyword || "#f472b6" }}>Dim</span>{" "}
            <span style={{ color: s.variable || "#fed7aa" }}>message</span>{" "}
            <span style={{ color: s.keyword || "#f472b6" }}>As</span>{" "}
            <span style={{ color: s.type || "#a5f3fc" }}>String</span>{" "}
            <span style={{ color: s.operator || "#f472b6" }}>=</span>{" "}
            <span style={{ color: s.string || "#fbcfe8" }}>"Kobrixa 14 ARM Edition"</span>
          </div>
          <div
            style={{
              background: s.lineHighlight || "#252b36",
              padding: "2px 0",
              borderRadius: "3px",
            }}
          >
            <span style={{ color: "#697a8b", marginRight: "16px", userSelect: "none" }}>5</span>
            {"  "}
            <span style={{ color: s.controlKeyword || "#fb7185", fontWeight: 650 }}>If</span>{" "}
            <span style={{ color: s.variable || "#fed7aa" }}>speed</span>{" "}
            <span style={{ color: s.operator || "#f472b6" }}>&gt;</span>{" "}
            <span style={{ color: s.number || "#cbd5e1" }}>50</span>{" "}
            <span style={{ color: s.controlKeyword || "#fb7185", fontWeight: 650 }}>Then</span>
          </div>
          <div>
            <span style={{ color: "#697a8b", marginRight: "16px", userSelect: "none" }}>6</span>
            {"    "}
            <span style={{ color: s.function || "#f9a8d4" }}>LCD.Clear</span>()
          </div>
          <div>
            <span style={{ color: "#697a8b", marginRight: "16px", userSelect: "none" }}>7</span>
            {"    "}
            <span style={{ color: s.function || "#f9a8d4" }}>Motor.Start</span>(
            <span style={{ color: s.string || "#fbcfe8" }}>"A"</span>
            <span style={{ color: s.delimiter || "#e2e8f0" }}>,</span>{" "}
            <span style={{ color: s.variable || "#fed7aa" }}>speed</span>)
          </div>
          <div>
            <span style={{ color: "#697a8b", marginRight: "16px", userSelect: "none" }}>8</span>
            {"  "}
            <span style={{ color: s.controlKeyword || "#fb7185", fontWeight: 650 }}>End If</span>
          </div>
          <div>
            <span style={{ color: "#697a8b", marginRight: "16px", userSelect: "none" }}>9</span>
            <span style={{ color: s.keyword || "#f472b6", fontWeight: 650 }}>End Sub</span>
          </div>
        </div>
      </section>

      {/* TAB 4: Import / Export / Wallpaper */}
      {activeTab === "import" && (
        <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            {t(
              "支援匯入完整自訂主題 JSON（包含代碼語法色彩、全域底色與字體）以及背景圖片：",
              "Import custom theme JSON (including syntax tokens, UI colors, fonts) and wallpaper images:",
            )}
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFilesChosen(e.dataTransfer.files);
            }}
            style={{
              border: "2px dashed var(--border)",
              borderRadius: "10px",
              padding: "24px",
              textAlign: "center",
              background: "var(--raised)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".json,image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              style={{ display: "none" }}
              onChange={(e) => {
                handleFilesChosen(e.target.files);
                e.target.value = "";
              }}
            />
            <span style={{ fontSize: "28px" }}>🎨</span>
            <strong style={{ fontSize: "14px" }}>
              {t("點擊選取或拖曳檔案至此處", "Click to select or drag and drop files here")}
            </strong>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              {t(
                "支援格式：JSON 主題配置檔、PNG / JPG / WebP / SVG 主題背景圖片",
                "Supported formats: JSON theme configs, PNG / JPG / WebP / SVG wallpaper images",
              )}
            </span>
          </div>

          {theme.backgroundImage && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "14px",
                background: "var(--editor)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <strong style={{ fontSize: "13px" }}>
                  {t("目前主題背景圖片", "Current Wallpaper Image")}
                </strong>
                <button
                  type="button"
                  onClick={() => updateThemeField("backgroundImage", null)}
                  style={{
                    color: "var(--error)",
                    border: "1px solid var(--border)",
                    borderRadius: "5px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {t("移除背景圖片", "Remove Wallpaper")}
                </button>
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div
                  style={{
                    width: "120px",
                    height: "75px",
                    borderRadius: "6px",
                    backgroundImage: `url("${theme.backgroundImage}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: "1px solid var(--border)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "12px",
                      color: "var(--muted)",
                    }}
                  >
                    <span style={{ minWidth: "90px" }}>{t("面板透明度：", "Panel opacity:")}</span>
                    <input
                      type="range"
                      min="0.5"
                      max="0.95"
                      step="0.05"
                      value={theme.bgOpacity ?? 0.85}
                      onChange={(e) => updateThemeField("bgOpacity", parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span>{Math.round((theme.bgOpacity ?? 0.85) * 100)}%</span>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "12px",
                      color: "var(--muted)",
                    }}
                  >
                    <span style={{ minWidth: "90px" }}>{t("背景毛玻璃：", "Backdrop blur:")}</span>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={theme.blur ?? 8}
                      onChange={(e) => updateThemeField("blur", parseInt(e.target.value, 10))}
                      style={{ flex: 1 }}
                    />
                    <span>{theme.blur ?? 8}px</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleExportTheme}
              style={{
                padding: "8px 16px",
                background: "var(--primary)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
                fontWeight: 650,
              }}
            >
              {t("匯出完整主題 JSON", "Export Theme (.json)")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
