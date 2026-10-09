import { useEffect, useRef, useState } from "react";
import type { Locale } from "../i18n/copy.js";
import { Icon } from "../components/icon.js";

export interface CustomThemeConfig {
  name: string;
  accent: string;
  primary?: string;
  primaryHover?: string;
  selection?: string;
  onAccent?: string;
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
  backgroundImage: null,
  bgOpacity: 0.85,
  blur: 8,
};

export const THEME_COLOR_PRESETS: {
  id: string;
  labelZh: string;
  labelEn: string;
  accent: string;
  primary: string;
  selection: string;
}[] = [
  {
    id: "sakura-pink",
    labelZh: "🌸 櫻花粉（預設）",
    labelEn: "🌸 Sakura Pink (Default)",
    accent: "#ec4899",
    primary: "#db2777",
    selection: "rgba(244, 114, 182, 0.28)",
  },
  {
    id: "barbie-pink",
    labelZh: "💖 芭比亮粉",
    labelEn: "💖 Barbie Pink",
    accent: "#f43f5e",
    primary: "#e11d48",
    selection: "rgba(244, 63, 94, 0.28)",
  },
  {
    id: "lavender-purple",
    labelZh: "💜 夢幻薰衣草",
    labelEn: "💜 Lavender Purple",
    accent: "#a855f7",
    primary: "#9333ea",
    selection: "rgba(168, 85, 247, 0.28)",
  },
  {
    id: "sky-blue",
    labelZh: "💙 澄澈晴空藍",
    labelEn: "💙 Sky Blue",
    accent: "#38bdf8",
    primary: "#0284c7",
    selection: "rgba(56, 189, 248, 0.28)",
  },
  {
    id: "emerald-mint",
    labelZh: "🍃 翡翠薄荷綠",
    labelEn: "🍃 Mint Emerald",
    accent: "#34d399",
    primary: "#059669",
    selection: "rgba(52, 211, 153, 0.28)",
  },
  {
    id: "coral-orange",
    labelZh: "🍊 珊瑚暖橙",
    labelEn: "🍊 Coral Orange",
    accent: "#fb923c",
    primary: "#ea580c",
    selection: "rgba(251, 146, 60, 0.28)",
  },
  {
    id: "amber-gold",
    labelZh: "💛 琥珀明金",
    labelEn: "💛 Amber Gold",
    accent: "#facc15",
    primary: "#ca8a04",
    selection: "rgba(250, 204, 21, 0.28)",
  },
  {
    id: "classic-blue",
    labelZh: "🌊 經典鈷藍",
    labelEn: "🌊 Cobalt Blue",
    accent: "#88acff",
    primary: "#3768dc",
    selection: "rgba(136, 172, 255, 0.28)",
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

  // Darker shade for primary
  const pr = Math.max(0, Math.floor(r * 0.85));
  const pg = Math.max(0, Math.floor(g * 0.85));
  const pb = Math.max(0, Math.floor(b * 0.85));
  const primary = `#${pr.toString(16).padStart(2, "0")}${pg.toString(16).padStart(2, "0")}${pb.toString(16).padStart(2, "0")}`;

  // Slightly lighter shade for hover
  const hr = Math.min(255, Math.floor(r * 1.15));
  const hg = Math.min(255, Math.floor(g * 1.15));
  const hb = Math.min(255, Math.floor(b * 1.15));
  const primaryHover = `#${hr.toString(16).padStart(2, "0")}${hg.toString(16).padStart(2, "0")}${hb.toString(16).padStart(2, "0")}`;

  const selection = `rgba(${r}, ${g}, ${b}, 0.28)`;
  // Calculate relative luminance for text contrast
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const onAccent = luminance > 0.65 ? "#18212b" : "#ffffff";

  return {
    accent: hexColor,
    primary,
    primaryHover,
    selection,
    onAccent,
  };
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
    // quota exceeded or private mode
  }
  applyCustomTheme(config);
  window.dispatchEvent(new CustomEvent("kobrixa:theme-change", { detail: config }));
}

export function applyCustomTheme(config: CustomThemeConfig = loadCustomTheme()): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Apply accent colors
  root.style.setProperty("--accent", config.accent);
  root.style.setProperty("--primary", config.primary ?? config.accent);
  root.style.setProperty("--primary-hover", config.primaryHover ?? config.accent);
  root.style.setProperty("--selection", config.selection ?? "rgba(244, 114, 182, 0.28)");
  root.style.setProperty("--on-accent", config.onAccent ?? "#ffffff");

  // Dynamic style for wallpaper backdrop
  let styleEl = document.getElementById("kobrixa-custom-theme-style") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "kobrixa-custom-theme-style";
    document.head.appendChild(styleEl);
  }

  if (config.backgroundImage) {
    root.dataset.hasWallpaper = "true";
    const opacity = config.bgOpacity ?? 0.85;
    const blur = config.blur ?? 8;
    styleEl.textContent = `
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
    styleEl.textContent = "";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<CustomThemeConfig>;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      }
    };
    window.addEventListener("kobrixa:theme-change", handleThemeChange);
    return () => window.removeEventListener("kobrixa:theme-change", handleThemeChange);
  }, []);

  const handleSelectPreset = (preset: (typeof THEME_COLOR_PRESETS)[number]) => {
    const updated: CustomThemeConfig = {
      ...theme,
      name: locale === "zh-TW" ? preset.labelZh : preset.labelEn,
      accent: preset.accent,
      primary: preset.primary,
      primaryHover: deriveColorVariants(preset.accent).primaryHover,
      selection: preset.selection,
      onAccent: "#ffffff",
    };
    setTheme(updated);
    saveCustomTheme(updated);
    setStatusMessage(t(`已套用配色：${preset.labelZh}`, `Applied theme color: ${preset.labelEn}`));
  };

  const handleCustomColor = (color: string) => {
    const derived = deriveColorVariants(color);
    const updated: CustomThemeConfig = {
      ...theme,
      name: t("自訂色彩", "Custom Color"),
      accent: derived.accent,
      primary: derived.primary,
      primaryHover: derived.primaryHover,
      selection: derived.selection,
      onAccent: derived.onAccent,
    };
    setTheme(updated);
    saveCustomTheme(updated);
    setStatusMessage(t(`自訂強調色彩已套用：${color}`, `Custom accent color applied: ${color}`));
  };

  const handleFilesChosen = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setStatusMessage(t("正在處理檔案…", "Processing theme files…"));

    let jsonProcessed = false;
    let imageProcessed = false;
    let pendingTheme: CustomThemeConfig = { ...theme };

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
            if (parsed.name && typeof parsed.name === "string") {
              pendingTheme.name = parsed.name;
            }
            if (parsed.backgroundImage && typeof parsed.backgroundImage === "string") {
              pendingTheme.backgroundImage = parsed.backgroundImage;
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

  const handleRemoveWallpaper = () => {
    const updated = { ...theme, backgroundImage: null };
    setTheme(updated);
    saveCustomTheme(updated);
    setStatusMessage(t("已清除背景圖片。", "Wallpaper removed."));
  };

  const handleResetPink = () => {
    setTheme(DEFAULT_PINK_THEME);
    saveCustomTheme(DEFAULT_PINK_THEME);
    setStatusMessage(
      t("已還原為預設櫻花粉色主題！🌸", "Restored to default Sakura Pink theme! 🌸"),
    );
  };

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
              {t("專屬客製版主題系統", "Dedicated Custom Theme Engine")}
            </strong>
          </div>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>
            {t(
              "預設主題為溫柔粉色，支援自訂強調色、匯入 JSON 主題設定與圖片背景。",
              "Default theme is Sakura Pink. Supports accent colors, JSON theme configs, and wallpaper images.",
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
            borderRadius: "6px",
            fontSize: "12px",
            cursor: "pointer",
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

      {/* Accent Colors Selection */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 650, color: "var(--text)" }}>
          {t("強調色彩（Accent Color）", "Accent & Highlight Color")}
        </h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
          {t(
            "點擊下方色彩預設，或使用自訂選色器選擇您喜愛的強調色彩：",
            "Choose from presets below or use the custom color picker:",
          )}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          {THEME_COLOR_PRESETS.map((preset) => {
            const isSelected = theme.accent.toLowerCase() === preset.accent.toLowerCase();
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
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: preset.accent,
                    boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                    display: "inline-block",
                  }}
                />
                {locale === "zh-TW" ? preset.labelZh : preset.labelEn}
              </button>
            );
          })}
        </div>

        {/* Custom Color Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            <span>{t("自訂強調色：", "Custom color:")}</span>
            <input
              type="color"
              value={theme.accent.startsWith("#") ? theme.accent : "#ec4899"}
              onChange={(e) => handleCustomColor(e.target.value)}
              style={{
                width: "36px",
                height: "28px",
                padding: "2px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                cursor: "pointer",
                background: "var(--raised)",
              }}
            />
          </label>
          <code
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              background: "var(--editor)",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid var(--border)",
            }}
          >
            {theme.accent}
          </code>
        </div>
      </section>

      {/* Visual Live Preview */}
      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h4 style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
          {t("色彩即時預覽效果", "Live Visual Preview")}
        </h4>
        <div
          style={{
            padding: "16px",
            borderRadius: "8px",
            background: "var(--editor)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <button type="button" className="primary" style={{ padding: "6px 14px" }}>
            {t("主要按鈕", "Primary Button")}
          </button>
          <span
            style={{
              background: "var(--selection)",
              color: "var(--accent)",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {t("強調選取項", "Active / Selected Item")}
          </span>
          <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "13px" }}>
            {t("強調文字鏈結", "Accent Text Link")}
          </span>
          <span
            style={{
              borderBottom: "2px solid var(--accent)",
              paddingBottom: "2px",
              fontWeight: 650,
              fontSize: "13px",
            }}
          >
            {t("分頁標籤作用中", "Active Tab Indicator")}
          </span>
        </div>
      </section>

      {/* Theme File Import (JSON & Images) */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 650, color: "var(--text)" }}>
          {t("個性化主題檔案匯入（JSON / 圖片）", "Personalized Theme File Import (JSON / Images)")}
        </h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
          {t(
            "您可以匯入主題設定檔（.json）以及主題背景/桌布圖片（.png, .jpg, .webp, .svg）。支援同時選取或拖曳多個檔案。",
            "Import theme configuration files (.json) and theme wallpaper images (.png, .jpg, .webp, .svg). You can select multiple files at once.",
          )}
        </p>

        {/* Drop zone / File selector */}
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
              "支援格式：JSON 主題配置、PNG / JPG / WebP / SVG 主題背景圖片",
              "Supported formats: JSON theme files, PNG / JPG / WebP / SVG background images",
            )}
          </span>
        </div>

        {/* Wallpaper Preview and Controls if image is present */}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: "13px" }}>
                {t("目前主題背景圖片", "Current Theme Wallpaper")}
              </strong>
              <button
                type="button"
                onClick={handleRemoveWallpaper}
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
                    onChange={(e) => {
                      const updated = { ...theme, bgOpacity: parseFloat(e.target.value) };
                      setTheme(updated);
                      saveCustomTheme(updated);
                    }}
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
                    onChange={(e) => {
                      const updated = { ...theme, blur: parseInt(e.target.value, 10) };
                      setTheme(updated);
                      saveCustomTheme(updated);
                    }}
                    style={{ flex: 1 }}
                  />
                  <span>{theme.blur ?? 8}px</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Export Theme */}
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button
            type="button"
            onClick={handleExportTheme}
            style={{
              padding: "7px 14px",
              background: "var(--raised)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {t("匯出主題設定（.json）", "Export Theme (.json)")}
          </button>
        </div>
      </section>
    </div>
  );
}
