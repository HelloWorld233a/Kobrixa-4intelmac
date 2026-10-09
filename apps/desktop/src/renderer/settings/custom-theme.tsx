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
  mode?: "custom" | "standard";
  name: string;
  accent: string;
  primary?: string;
  primaryHover?: string;
  selection?: string;
  onAccent?: string;

  // Overall UI Background & Surfaces (Entire Application)
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

export function hexToRgb(hexColor: string): [number, number, number] {
  if (!hexColor) return [0, 0, 0];
  const cleanHex = hexColor.replace("#", "").trim();
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return [0, 0, 0];
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
  return [Number.isNaN(r) ? 0 : r, Number.isNaN(g) ? 0 : g, Number.isNaN(b) ? 0 : b];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) =>
    Math.round(Math.max(0, Math.min(255, val)))
      .toString(16)
      .padStart(2, "0");
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

export function hexToRgba(hexColor: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hexColor);
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rNorm) {
      h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / d + 2) / 6;
    } else {
      h = ((rNorm - gNorm) / d + 4) / 6;
    }
  }
  return [Math.round(h * 360), s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const normH = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((normH / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (normH >= 0 && normH < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (normH >= 60 && normH < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (normH >= 120 && normH < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (normH >= 180 && normH < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (normH >= 240 && normH < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function getLuminance(hexColor: string): number {
  const [r, g, b] = hexToRgb(hexColor);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function isColorDark(hexColor: string): boolean {
  return getLuminance(hexColor) < 0.55;
}

export const DEFAULT_PINK_THEME: CustomThemeConfig = {
  mode: "custom",
  name: "Sakura Pink (櫻花粉全境沉浸)",
  accent: "#ec4899",
  primary: "#db2777",
  primaryHover: "#f472b6",
  selection: "rgba(244, 114, 182, 0.35)",
  onAccent: "#ffffff",

  surface: "#281724", // Entire app background in rich pink
  editorBg: "#1e101b", // Code editor in deep pink
  raised: "#382032", // Panels and cards in berry pink
  border: "#562e4c", // Pink border
  hover: "#3f253a",

  textColor: "#fdf2f8",
  mutedColor: "#d4a5be",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", system-ui, sans-serif',
  codeFontFamily: '"JetBrains Mono", SFMono-Regular, Menlo, Consolas, monospace',

  syntax: {
    keyword: "#f472b6",
    controlKeyword: "#fb7185",
    string: "#fed7aa",
    number: "#cbd5e1",
    comment: "#86efac",
    function: "#f9a8d4",
    variable: "#fde047",
    type: "#a5f3fc",
    operator: "#f472b6",
    delimiter: "#e2e8f0",
    lineHighlight: "#331b2d",
    cursor: "#ec4899",
  },

  backgroundImage: null,
  bgOpacity: 0.85,
  blur: 8,
};

export function generateThemeFromBaseColor(
  baseHex: string,
  name = "自訂全域色彩",
): CustomThemeConfig {
  const cleanHex = baseHex.replace("#", "").trim();
  if (cleanHex.length !== 6 && cleanHex.length !== 3) {
    return DEFAULT_PINK_THEME;
  }
  const [r, g, b] = hexToRgb(baseHex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const luminance = getLuminance(baseHex);

  // The chosen base color becomes the accent highlight
  const accent = baseHex;
  // High-contrast text on accent: use dark text if accent is bright (prevents white-on-white)
  const onAccent = luminance > 0.5 ? "#0f172a" : "#ffffff";
  const primary = hslToHex(h, Math.min(1, s * 0.95), Math.max(0.25, Math.min(0.65, l * 0.9)));
  const primaryHover = hslToHex(h, Math.min(1, s * 1.05), Math.max(0.35, Math.min(0.85, l * 1.15)));
  const selection = hexToRgba(baseHex, 0.32);

  // Pull background surfaces dark ("背景要拉黑") based on the hue of the chosen color
  const bgSat = Math.min(0.42, Math.max(0.1, s * 0.4));
  const surface = hslToHex(h, bgSat, 0.11);
  const editorBg = hslToHex(h, bgSat * 0.85, 0.07);
  const raised = hslToHex(h, bgSat * 1.1, 0.16);
  const border = hslToHex(h, bgSat * 1.25, 0.25);
  const hover = hslToHex(h, bgSat * 1.15, 0.2);

  // High contrast text on dark background surfaces
  const textColor = "#f8fafc";
  const mutedColor = hslToHex(h, Math.min(0.45, s * 0.5), 0.72);

  // Harmonized code syntax tokens
  const syntax: SyntaxThemeConfig = {
    keyword: baseHex,
    controlKeyword: hslToHex((h + 30) % 360, 0.85, 0.68),
    string: hslToHex((h + 60) % 360, 0.85, 0.75),
    number: hslToHex((h + 120) % 360, 0.75, 0.75),
    comment: hslToHex(h, 0.25, 0.55),
    function: hslToHex((h + 300) % 360, 0.85, 0.72),
    variable: hslToHex((h + 180) % 360, 0.85, 0.75),
    type: hslToHex((h + 210) % 360, 0.8, 0.75),
    operator: baseHex,
    delimiter: "#e2e8f0",
    lineHighlight: hslToHex(h, bgSat, 0.14),
    cursor: baseHex,
  };

  return {
    mode: "custom",
    name,
    accent,
    primary,
    primaryHover,
    selection,
    onAccent,
    surface,
    editorBg,
    raised,
    border,
    hover,
    textColor,
    mutedColor,
    syntax,
  };
}

export async function extractDominantColorFromImage(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !imageUrl) {
      resolve("#ec4899");
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve("#ec4899");
          return;
        }
        const w = 48;
        const h = 48;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h).data;

        let bestColor = "#ec4899";
        let bestScore = -1;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i]!;
          const g = imgData[i + 1]!;
          const b = imgData[i + 2]!;
          const a = imgData[i + 3]!;
          if (a < 128) continue;

          const [, sVal, lVal] = rgbToHsl(r, g, b);
          // Prioritize colorful pixels (high saturation, pleasant medium lightness)
          const satScore = sVal * 2.8;
          const lightScore = 1.0 - Math.abs(lVal - 0.55) * 2;
          const score = satScore + lightScore;

          if (score > bestScore) {
            bestScore = score;
            bestColor = rgbToHex(r, g, b);
          }
        }
        resolve(bestColor);
      } catch {
        resolve("#ec4899");
      }
    };
    img.onerror = () => resolve("#ec4899");
    img.src = imageUrl;
  });
}

export const THEME_COLOR_PRESETS: {
  id: string;
  labelZh: string;
  labelEn: string;
  theme: CustomThemeConfig;
}[] = [
  {
    id: "sakura-pink",
    labelZh: "🌸 櫻花粉全境（預設）",
    labelEn: "🌸 Sakura Pink Immersion (Default)",
    theme: DEFAULT_PINK_THEME,
  },
  {
    id: "sweet-peach",
    labelZh: "🎀 蜜桃粉明亮模式",
    labelEn: "🎀 Sweet Peach Light Mode",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Sweet Peach Light",
      accent: "#db2777",
      primary: "#be185d",
      primaryHover: "#9d174d",
      selection: "rgba(219, 39, 119, 0.18)",
      onAccent: "#ffffff",
      surface: "#fdf2f8", // Entire app background in soft pink
      editorBg: "#fff5f9", // Editor in blush pink
      raised: "#fce7f3", // Panels in light pink
      border: "#fbcfe8",
      hover: "#f9a8d4",
      textColor: "#831843",
      mutedColor: "#9d174d",
      syntax: {
        keyword: "#be185d",
        controlKeyword: "#9d174d",
        string: "#b45309",
        number: "#047857",
        comment: "#4b5563",
        function: "#db2777",
        variable: "#1d4ed8",
        type: "#0e7490",
        operator: "#db2777",
        delimiter: "#475569",
        lineHighlight: "#fce7f3",
        cursor: "#be185d",
      },
    },
  },
  {
    id: "lavender-purple",
    labelZh: "💜 幻夜紫羅蘭全境",
    labelEn: "💜 Lavender Violet Immersion",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Lavender Violet Immersion",
      accent: "#c084fc",
      primary: "#9333ea",
      primaryHover: "#a855f7",
      selection: "rgba(192, 132, 252, 0.32)",
      surface: "#1e142a", // Entire app in deep violet
      editorBg: "#170e22",
      raised: "#2b1d3d",
      border: "#473065",
      hover: "#35244a",
      textColor: "#f5f3ff",
      mutedColor: "#c4b5fd",
      syntax: {
        keyword: "#c084fc",
        controlKeyword: "#d8b4fe",
        string: "#fed7aa",
        number: "#a7f3d0",
        comment: "#86efac",
        function: "#f0abfc",
        variable: "#38bdf8",
        type: "#818cf8",
        operator: "#c084fc",
        cursor: "#c084fc",
        lineHighlight: "#251936",
      },
    },
  },
  {
    id: "deep-ocean",
    labelZh: "🌊 深海蔚藍全境",
    labelEn: "🌊 Deep Ocean Blue Immersion",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Deep Ocean Blue Immersion",
      accent: "#38bdf8",
      primary: "#0284c7",
      primaryHover: "#7dd3fc",
      selection: "rgba(56, 189, 248, 0.32)",
      surface: "#0d1b2a", // Entire app in deep ocean blue
      editorBg: "#091420",
      raised: "#172a3e",
      border: "#284869",
      hover: "#1f3750",
      textColor: "#f0f9ff",
      mutedColor: "#7dd3fc",
      syntax: {
        keyword: "#38bdf8",
        controlKeyword: "#7dd3fc",
        string: "#fde047",
        number: "#a7f3d0",
        comment: "#6ee7b7",
        function: "#67e8f9",
        variable: "#93c5fd",
        type: "#bfdbfe",
        operator: "#38bdf8",
        cursor: "#38bdf8",
        lineHighlight: "#122336",
      },
    },
  },
  {
    id: "emerald-mint",
    labelZh: "🍃 翠綠薄荷森全境",
    labelEn: "🍃 Emerald Forest Immersion",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Emerald Forest Immersion",
      accent: "#34d399",
      primary: "#059669",
      primaryHover: "#6ee7b7",
      selection: "rgba(52, 211, 153, 0.32)",
      surface: "#0f221a", // Entire app in forest green
      editorBg: "#0a1a13",
      raised: "#19362a",
      border: "#2a5743",
      hover: "#204435",
      textColor: "#ecfdf5",
      mutedColor: "#6ee7b7",
      syntax: {
        keyword: "#34d399",
        controlKeyword: "#6ee7b7",
        string: "#fef08a",
        number: "#bae6fd",
        comment: "#a7f3d0",
        function: "#5eead4",
        variable: "#fcd34d",
        type: "#6ee7b7",
        operator: "#34d399",
        cursor: "#34d399",
        lineHighlight: "#142c22",
      },
    },
  },
  {
    id: "coral-sunset",
    labelZh: "🍊 日落落霞橙全境",
    labelEn: "🍊 Sunset Coral Immersion",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Sunset Coral Immersion",
      accent: "#fb923c",
      primary: "#ea580c",
      primaryHover: "#fdba74",
      selection: "rgba(251, 146, 60, 0.32)",
      surface: "#2b1810", // Entire app in sunset coral
      editorBg: "#21110a",
      raised: "#3d2317",
      border: "#5e3725",
      hover: "#492a1c",
      textColor: "#fff7ed",
      mutedColor: "#fdba74",
      syntax: {
        keyword: "#fb923c",
        controlKeyword: "#f97316",
        string: "#fde047",
        number: "#86efac",
        comment: "#cbd5e1",
        function: "#fdba74",
        variable: "#fed7aa",
        type: "#f472b6",
        operator: "#fb923c",
        cursor: "#fb923c",
        lineHighlight: "#331c13",
      },
    },
  },
  {
    id: "cyberpunk-neon",
    labelZh: "🌌 賽博霓虹全境",
    labelEn: "🌌 Cyberpunk Neon Immersion",
    theme: {
      ...DEFAULT_PINK_THEME,
      name: "Cyberpunk Neon",
      accent: "#f43f5e",
      primary: "#06b6d4",
      primaryHover: "#22d3ee",
      selection: "rgba(244, 63, 94, 0.38)",
      surface: "#0d0f18",
      editorBg: "#07080e",
      raised: "#181a28",
      border: "#2f334e",
      hover: "#222538",
      textColor: "#f8fafc",
      mutedColor: "#94a3b8",
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
        lineHighlight: "#141724",
      },
    },
  },
  {
    id: "classic-obsidian",
    labelZh: "🌑 標準深色模式（曜石黑）",
    labelEn: "🌑 Standard Dark Mode (Obsidian)",
    theme: {
      ...DEFAULT_PINK_THEME,
      mode: "custom",
      name: "Obsidian Pure Dark",
      accent: "#88acff",
      primary: "#3768dc",
      primaryHover: "#4678ed",
      selection: "rgba(136, 172, 255, 0.28)",
      surface: "#121212",
      editorBg: "#0a0a0a",
      raised: "#1e1e1e",
      border: "#2e2e2e",
      hover: "#262626",
      textColor: "#e5e5e5",
      mutedColor: "#a3a3a3",
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
        lineHighlight: "#181818",
      },
    },
  },
  {
    id: "classic-light",
    labelZh: "☀️ 標準淺色模式（極簡純白）",
    labelEn: "☀️ Standard Light Mode (Clean White)",
    theme: {
      ...DEFAULT_PINK_THEME,
      mode: "custom",
      name: "Minimalist Pure Light",
      accent: "#2563eb",
      primary: "#2563eb",
      primaryHover: "#1d4ed8",
      selection: "rgba(37, 99, 235, 0.15)",
      surface: "#f8fafc",
      editorBg: "#ffffff",
      raised: "#f1f5f9",
      border: "#e2e8f0",
      hover: "#e2e8f0",
      textColor: "#0f172a",
      mutedColor: "#64748b",
      syntax: {
        keyword: "#0000ff",
        controlKeyword: "#af00db",
        string: "#a31515",
        number: "#098658",
        comment: "#008000",
        function: "#795e26",
        variable: "#001080",
        type: "#267f99",
        operator: "#1e2933",
        cursor: "#2563eb",
        lineHighlight: "#f1f5f9",
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
  const [r, g, b] = hexToRgb(hexColor);
  const [h, s, l] = rgbToHsl(r, g, b);
  const luminance = getLuminance(hexColor);
  const onAccent = luminance > 0.5 ? "#0f172a" : "#ffffff";
  const primary = hslToHex(h, Math.min(1, s * 0.95), Math.max(0.25, Math.min(0.65, l * 0.9)));
  const primaryHover = hslToHex(h, Math.min(1, s * 1.05), Math.max(0.35, Math.min(0.85, l * 1.15)));
  const selection = hexToRgba(hexColor, 0.32);

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
      mode: "custom",
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
  const toSave: CustomThemeConfig = { ...config, mode: "custom" };
  try {
    window.localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // quota
  }
  applyCustomTheme(toSave);
  window.dispatchEvent(new CustomEvent("kobrixa:theme-change", { detail: toSave }));
}

export function applyCustomTheme(config: CustomThemeConfig = loadCustomTheme()): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

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

  root.dataset.customTheme = "true";

  // Set CSS variables on root
  root.style.setProperty("--accent", config.accent);
  root.style.setProperty("--primary", config.primary ?? config.accent);
  root.style.setProperty("--primary-hover", config.primaryHover ?? config.accent);
  root.style.setProperty("--selection", config.selection ?? "rgba(244, 114, 182, 0.32)");
  root.style.setProperty("--on-accent", config.onAccent ?? "#ffffff");

  if (config.surface) root.style.setProperty("--surface", config.surface);
  if (config.editorBg) root.style.setProperty("--editor", config.editorBg);
  if (config.raised) root.style.setProperty("--raised", config.raised);
  if (config.border) root.style.setProperty("--border", config.border);
  if (config.hover) root.style.setProperty("--hover", config.hover);

  if (config.textColor) root.style.setProperty("--text", config.textColor);
  if (config.mutedColor) root.style.setProperty("--muted", config.mutedColor);
  if (config.fontFamily) root.style.setProperty("--font-sans", config.fontFamily);
  if (config.codeFontFamily) root.style.setProperty("--font-mono", config.codeFontFamily);

  const surface = config.surface || "#281724";
  const editorBg = config.editorBg || "#1e101b";
  const raised = config.raised || "#382032";
  const border = config.border || "#562e4c";
  const hover = config.hover || "#3f253a";
  const text = config.textColor || "#fdf2f8";
  const muted = config.mutedColor || "#d4a5be";
  const accent = config.accent || "#ec4899";
  const primary = config.primary || "#db2777";
  const primaryHover = config.primaryHover || "#f472b6";
  const selection = config.selection || "rgba(244, 114, 182, 0.32)";

  const surfaceRgba = hexToRgba(surface, config.bgOpacity ?? 0.82);
  const editorRgba = hexToRgba(editorBg, Math.max(0.4, (config.bgOpacity ?? 0.82) - 0.06));
  const raisedRgba = hexToRgba(raised, Math.min(0.95, (config.bgOpacity ?? 0.82) + 0.08));
  const blurPx = `${config.blur ?? 10}px`;

  const wallpaperCss = config.backgroundImage
    ? `
      :root[data-has-wallpaper="true"] body,
      :root[data-has-wallpaper="true"] #root,
      :root[data-has-wallpaper="true"] .app-shell {
        background-image: url("${config.backgroundImage}") !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
        background-attachment: fixed !important;
        background-color: transparent !important;
      }
      :root[data-has-wallpaper="true"] .workspace,
      :root[data-has-wallpaper="true"] .sidebar,
      :root[data-has-wallpaper="true"] .topbar,
      :root[data-has-wallpaper="true"] footer,
      :root[data-has-wallpaper="true"] .files-panel,
      :root[data-has-wallpaper="true"] .project-tree,
      :root[data-has-wallpaper="true"] .settings-page,
      :root[data-has-wallpaper="true"] .settings-body,
      :root[data-has-wallpaper="true"] .settings-content,
      :root[data-has-wallpaper="true"] .settings-categories,
      :root[data-has-wallpaper="true"] .device-panel,
      :root[data-has-wallpaper="true"] .tool-content,
      :root[data-has-wallpaper="true"] .problem-list,
      :root[data-has-wallpaper="true"] .activity-list,
      :root[data-has-wallpaper="true"] .bottom-tabs {
        background: ${surfaceRgba} !important;
        backdrop-filter: blur(${blurPx}) !important;
        -webkit-backdrop-filter: blur(${blurPx}) !important;
      }
      :root[data-has-wallpaper="true"] .center,
      :root[data-has-wallpaper="true"] .editor-stage,
      :root[data-has-wallpaper="true"] .editor,
      :root[data-has-wallpaper="true"] .welcome {
        background: ${editorRgba} !important;
        backdrop-filter: blur(${blurPx}) !important;
        -webkit-backdrop-filter: blur(${blurPx}) !important;
      }
      :root[data-has-wallpaper="true"] .monaco-editor,
      :root[data-has-wallpaper="true"] .monaco-editor .overflow-guard,
      :root[data-has-wallpaper="true"] .monaco-editor .monaco-scrollable-element,
      :root[data-has-wallpaper="true"] .monaco-editor .lines-content,
      :root[data-has-wallpaper="true"] .monaco-editor-background,
      :root[data-has-wallpaper="true"] .monaco-editor .margin,
      :root[data-has-wallpaper="true"] .monaco-editor .margin-view-overlays,
      :root[data-has-wallpaper="true"] .monaco-editor .glyph-margin {
        background: transparent !important;
        background-color: transparent !important;
      }
      :root[data-has-wallpaper="true"] .card,
      :root[data-has-wallpaper="true"] .setting-entry,
      :root[data-has-wallpaper="true"] dialog,
      :root[data-has-wallpaper="true"] .modal,
      :root[data-has-wallpaper="true"] .modal-card {
        background: ${raisedRgba} !important;
        backdrop-filter: blur(${blurPx}) !important;
        -webkit-backdrop-filter: blur(${blurPx}) !important;
      }
      :root[data-has-wallpaper="true"] .tab.active,
      :root[data-has-wallpaper="true"] .project-tab[aria-selected="true"] {
        background: ${editorRgba} !important;
        color: var(--text) !important;
      }
    `
    : "";

  styleEl.textContent = `
    ${fontRules}
    :root[data-custom-theme="true"],
    :root[data-custom-theme="true"][data-theme="dark"],
    :root[data-custom-theme="true"][data-theme="light"] {
      --surface: ${surface} !important;
      --editor: ${editorBg} !important;
      --raised: ${raised} !important;
      --border: ${border} !important;
      --hover: ${hover} !important;
      --text: ${text} !important;
      --muted: ${muted} !important;
      --accent: ${accent} !important;
      --primary: ${primary} !important;
      --primary-hover: ${primaryHover} !important;
      --selection: ${selection} !important;
    }

    :root[data-custom-theme="true"] body,
    :root[data-custom-theme="true"] html,
    :root[data-custom-theme="true"] #root,
    :root[data-custom-theme="true"] .app-shell,
    :root[data-custom-theme="true"] .workspace,
    :root[data-custom-theme="true"] .center,
    :root[data-custom-theme="true"] .sidebar,
    :root[data-custom-theme="true"] .files-panel,
    :root[data-custom-theme="true"] .project-tree,
    :root[data-custom-theme="true"] .topbar,
    :root[data-custom-theme="true"] footer,
    :root[data-custom-theme="true"] .settings-page,
    :root[data-custom-theme="true"] .settings-heading,
    :root[data-custom-theme="true"] .settings-body,
    :root[data-custom-theme="true"] .settings-content,
    :root[data-custom-theme="true"] .settings-categories,
    :root[data-custom-theme="true"] .editor-toolbar,
    :root[data-custom-theme="true"] .problems,
    :root[data-custom-theme="true"] .problem-list,
    :root[data-custom-theme="true"] .activity-list,
    :root[data-custom-theme="true"] .tabs,
    :root[data-custom-theme="true"] .project-tabs,
    :root[data-custom-theme="true"] .device-panel,
    :root[data-custom-theme="true"] .tools-heading,
    :root[data-custom-theme="true"] .tool-content,
    :root[data-custom-theme="true"] .bottom-tabs,
    :root[data-custom-theme="true"] .welcome {
      background-color: var(--surface) !important;
      color: var(--text) !important;
    }

    :root[data-custom-theme="true"] .editor-stage,
    :root[data-custom-theme="true"] .editor,
    :root[data-custom-theme="true"] .monaco-editor,
    :root[data-custom-theme="true"] .monaco-editor .overflow-guard,
    :root[data-custom-theme="true"] .monaco-editor .monaco-scrollable-element,
    :root[data-custom-theme="true"] .monaco-editor .lines-content,
    :root[data-custom-theme="true"] .monaco-editor-background,
    :root[data-custom-theme="true"] .monaco-editor .margin,
    :root[data-custom-theme="true"] .monaco-editor .margin-view-overlays,
    :root[data-custom-theme="true"] .monaco-editor .glyph-margin {
      background-color: var(--editor) !important;
    }

    :root[data-custom-theme="true"] .tab.active,
    :root[data-custom-theme="true"] .project-tab[aria-selected="true"] {
      background-color: var(--editor) !important;
      color: var(--text) !important;
    }

    :root[data-custom-theme="true"] .setting-entry,
    :root[data-custom-theme="true"] .card,
    :root[data-custom-theme="true"] dialog,
    :root[data-custom-theme="true"] .modal,
    :root[data-custom-theme="true"] .modal-card,
    :root[data-custom-theme="true"] input,
    :root[data-custom-theme="true"] select,
    :root[data-custom-theme="true"] textarea,
    :root[data-custom-theme="true"] .picker,
    :root[data-custom-theme="true"] button.secondary {
      background-color: var(--raised) !important;
      border-color: var(--border) !important;
      color: var(--text) !important;
    }

    ${wallpaperCss}
  `;

  if (config.backgroundImage) {
    root.dataset.hasWallpaper = "true";
  } else {
    delete root.dataset.hasWallpaper;
  }
}

// Automatically apply// Automatically apply custom theme (default pink) on initial load
if (typeof window !== "undefined") {
  applyCustomTheme();
}

export function CustomThemePanel({ locale }: { locale: Locale }): React.JSX.Element {
  const t = (zh: string, en: string) => (locale === "zh-TW" ? zh : en);
  const [theme, setTheme] = useState<CustomThemeConfig>(() => loadCustomTheme());
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "presets" | "background" | "wallpaper" | "syntax" | "fonts" | "import"
  >("presets");
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
    setStatusMessage(
      t(`已切換全境主題：${preset.labelZh}`, `Applied full immersion theme: ${preset.labelEn}`),
    );
  };

  const handleBaseColorChange = (baseColor: string) => {
    const generated = generateThemeFromBaseColor(
      baseColor,
      t("自訂色彩全域主題", "Custom Overall Theme"),
    );
    const updated: CustomThemeConfig = {
      ...generated,
      backgroundImage: theme.backgroundImage ?? null,
      ...(typeof theme.bgOpacity === "number" ? { bgOpacity: theme.bgOpacity } : {}),
      ...(typeof theme.blur === "number" ? { blur: theme.blur } : {}),
    };
    setTheme(updated);
    saveCustomTheme(updated);
    setStatusMessage(
      t(
        `已將背景拉黑並將強調色設為 ${baseColor}，套用整機色彩風格！`,
        `Pulled background dark and set accent highlight to ${baseColor}!`,
      ),
    );
  };

  const handleExtractColorFromWallpaper = async () => {
    if (!theme.backgroundImage) return;
    setStatusMessage(t("正在從背景圖片提取色彩…", "Extracting dominant color from wallpaper…"));
    const extractedColor = await extractDominantColorFromImage(theme.backgroundImage);
    const generated = generateThemeFromBaseColor(
      extractedColor,
      t("桌布自動配搭主題", "Wallpaper Harmonized Theme"),
    );
    const updated: CustomThemeConfig = {
      ...generated,
      backgroundImage: theme.backgroundImage ?? null,
      ...(typeof theme.bgOpacity === "number" ? { bgOpacity: theme.bgOpacity } : {}),
      ...(typeof theme.blur === "number" ? { blur: theme.blur } : {}),
    };
    setTheme(updated);
    saveCustomTheme(updated);
    setStatusMessage(
      t(
        `已成功從桌布提取色彩 ${extractedColor}，並將背景拉黑、強調色套用至全境！🎨`,
        `Extracted color ${extractedColor} from wallpaper, pulled backgrounds dark, and applied full immersion theme! 🎨`,
      ),
    );
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
      if (imageProcessed)
        messages.push(t("已載入主題背景圖片並同步配色", "Loaded wallpaper & harmonized theme"));
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

            if (typeof parsed.name === "string") pendingTheme.name = parsed.name;

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

            if (typeof parsed.textColor === "string" || typeof parsed.foreground === "string") {
              pendingTheme.textColor = (parsed.textColor || parsed.foreground) as string;
            }
            if (typeof parsed.mutedColor === "string") pendingTheme.mutedColor = parsed.mutedColor;
            if (typeof parsed.fontFamily === "string") pendingTheme.fontFamily = parsed.fontFamily;
            if (typeof parsed.codeFontFamily === "string" || typeof parsed.font === "string") {
              pendingTheme.codeFontFamily = (parsed.codeFontFamily || parsed.font) as string;
            }

            const syntaxObj = (parsed.syntax || parsed.tokens || parsed.syntaxTokens) as
              Record<string, string> | undefined;
            if (syntaxObj && typeof syntaxObj === "object") {
              pendingTheme.syntax = {
                ...(pendingTheme.syntax ?? {}),
                ...syntaxObj,
              };
            }

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
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            pendingTheme.backgroundImage = dataUrl;
            imageProcessed = true;
            try {
              const dominant = await extractDominantColorFromImage(dataUrl);
              const generated = generateThemeFromBaseColor(
                dominant,
                locale === "zh-TW" ? "桌布自動配搭主題" : "Wallpaper Harmonized Theme",
              );
              Object.assign(pendingTheme, {
                ...generated,
                backgroundImage: dataUrl,
                bgOpacity: pendingTheme.bgOpacity ?? 0.82,
                blur: pendingTheme.blur ?? 10,
              });
            } catch {
              // fallback
            }
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
      t("已還原為預設櫻花粉色全境主題！🌸", "Restored to default Sakura Pink immersion theme! 🌸"),
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
          padding: "16px 20px",
          background:
            "linear-gradient(135deg, rgba(236, 72, 153, 0.22) 0%, rgba(244, 114, 182, 0.08) 100%)",
          border: "1px solid var(--accent)",
          borderRadius: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                background: "var(--accent)",
                color: "var(--on-accent)",
                padding: "2px 10px",
                borderRadius: "99px",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              We love 14
            </span>
            <strong style={{ fontSize: "16px" }}>
              {t(
                "全域全境主題系統（非僅黑白模式）",
                "Total Immersion Theme Engine (Beyond Light & Dark)",
              )}
            </strong>
          </div>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>
            {t(
              "支援徹底改變整個應用程式的背景色（側邊欄、編輯器、工作區、標題欄全盤同步），支援粉色及任意自訂全域色彩。",
              "Transform the entire app background (sidebar, editor, workspace, tabs, panels) in full pink or any custom color.",
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={handleResetPink}
          style={{
            padding: "8px 14px",
            border: "1px solid var(--accent)",
            color: "var(--accent)",
            background: "transparent",
            borderRadius: "6px",
            fontSize: "13px",
            cursor: "pointer",
            fontWeight: 650,
          }}
        >
          {t("還原預設全境粉色", "Reset Pink Immersion")}
        </button>
      </div>

      {statusMessage && (
        <div
          role="status"
          style={{
            padding: "8px 14px",
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
          flexWrap: "wrap",
          gap: "8px",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "8px",
        }}
      >
        {[
          {
            key: "presets" as const,
            label: t("🎨 全域主題模式（粉色／多色彩）", "🎨 Full Immersion Presets"),
          },
          {
            key: "background" as const,
            label: t("🖼️ 整體背景與底色調整", "🖼️ Overall Background & Surfaces"),
          },
          {
            key: "wallpaper" as const,
            label: t("🌄 背景圖片與毛玻璃效果", "🌄 Wallpaper & Frosted Glass"),
          },
          { key: "syntax" as const, label: t("💻 代碼語法類型著色", "💻 Syntax Highlighting") },
          { key: "fonts" as const, label: t("🔤 字體與字體顏色", "🔤 Fonts & Typography") },
          { key: "import" as const, label: t("📁 檔案匯入／匯出", "📁 Import & Export") },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              border: activeTab === tab.key ? "1px solid var(--accent)" : "1px solid transparent",
              background: activeTab === tab.key ? "var(--selection)" : "transparent",
              color: activeTab === tab.key ? "var(--accent)" : "var(--muted)",
              fontWeight: activeTab === tab.key ? 750 : 500,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Total Immersion Presets */}
      {activeTab === "presets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h4
              style={{
                margin: "0 0 10px 0",
                fontSize: "14px",
                color: "var(--text)",
                fontWeight: 650,
              }}
            >
              {t(
                "點擊即時切換整個應用程式的完整配色風格：",
                "Click to switch the entire application's color theme:",
              )}
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
              }}
            >
              {THEME_COLOR_PRESETS.map((preset) => {
                const isSelected =
                  theme.name === preset.labelZh ||
                  theme.name === preset.labelEn ||
                  theme.name === preset.theme.name;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: isSelected ? "var(--selection)" : "var(--raised)",
                      color: isSelected ? "var(--accent)" : "var(--text)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <strong style={{ fontSize: "13px" }}>
                        {locale === "zh-TW" ? preset.labelZh : preset.labelEn}
                      </strong>
                      <span
                        style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          backgroundColor: preset.theme.accent,
                          boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                        }}
                      />
                    </div>
                    {/* Color Swatch Bars */}
                    <div
                      style={{
                        display: "flex",
                        height: "16px",
                        borderRadius: "4px",
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ flex: 2, background: preset.theme.surface }} title="Surface" />
                      <div style={{ flex: 3, background: preset.theme.editorBg }} title="Editor" />
                      <div style={{ flex: 1, background: preset.theme.accent }} title="Accent" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick One-Click Whole-App Base Color Generator */}
          <div
            style={{
              padding: "14px 18px",
              background: "var(--raised)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
            }}
          >
            <div>
              <strong style={{ fontSize: "14px", display: "block" }}>
                {t(
                  "自選強調色一鍵拉黑背景全境風格",
                  "One-Click Theme Generator (Dark Surface & Custom Accent)",
                )}
              </strong>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                {t(
                  "選擇任意顏色，自動將工作區與編輯器背景拉黑帶淡色調，強調色即時同步，文字高對比不反白！",
                  "Pick any color; automatically pulls backgrounds dark and matches accent highlight without white-on-white text.",
                )}
              </span>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="color"
                value={(theme.accent || "#ec4899").startsWith("#") ? theme.accent! : "#ec4899"}
                onChange={(e) => handleBaseColorChange(e.target.value)}
                style={{
                  width: "42px",
                  height: "34px",
                  padding: "2px",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: "transparent",
                }}
              />
              <span style={{ fontSize: "12px", fontWeight: 650, color: "var(--accent)" }}>
                {t("選擇顏色", "Pick Color")}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: Overall Background & Surfaces */}
      {activeTab === "background" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            {t(
              "個別精確調整應用程式各個區塊的背景色彩，全域即時生效：",
              "Fine-tune background colors for each individual area of the application:",
            )}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              {
                label: t(
                  "全域底色 (側邊欄、標題欄、工作區)",
                  "Overall Surface (Sidebar, Topbar, Workspace)",
                ),
                field: "surface" as const,
                val: theme.surface || "#281724",
              },
              {
                label: t("代碼編輯器主背景 (Editor Background)", "Code Editor Background"),
                field: "editorBg" as const,
                val: theme.editorBg || "#1e101b",
              },
              {
                label: t(
                  "面板卡片與輸入框底色 (Raised Panel)",
                  "Raised Card, Dialog & Input Background",
                ),
                field: "raised" as const,
                val: theme.raised || "#382032",
              },
              {
                label: t("邊框與分隔線色彩 (Border Color)", "Borders & Dividers Color"),
                field: "border" as const,
                val: theme.border || "#562e4c",
              },
              {
                label: t("強調色彩 (Accent Color)", "Accent Highlight Color"),
                field: "accent" as const,
                val: theme.accent || "#ec4899",
              },
              {
                label: t("主要按鈕色彩 (Primary Button)", "Primary Button Color"),
                field: "primary" as const,
                val: theme.primary || "#db2777",
              },
            ].map((item) => (
              <label
                key={item.field}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
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
                      width: "34px",
                      height: "28px",
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

      {/* TAB: Wallpaper & Frosted Glass Backdrop */}
      {activeTab === "wallpaper" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h4
              style={{
                margin: "0 0 6px 0",
                fontSize: "14px",
                color: "var(--text)",
                fontWeight: 650,
              }}
            >
              {t(
                "全體毛玻璃透明效果與自訂背景桌布",
                "Full Frosted Glass Backdrop & Custom Wallpaper",
              )}
            </h4>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
              {t(
                "為代碼編輯器、側邊欄、標題欄與全境視窗套用現代質感毛玻璃模糊效果。上傳桌布後，支援一鍵智慧提取主色彩，並自動拉黑背景與同步強調色！",
                "Apply frosted glass blur effect to code editor, sidebar, and all panels. Supports auto-extracting colors from wallpaper to pull backgrounds dark and sync accent highlights!",
              )}
            </p>
          </div>

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
            <span style={{ fontSize: "32px" }}>🌄</span>
            <strong style={{ fontSize: "14px" }}>
              {t("點擊選取或拖曳背景圖片至此處", "Click to select or drag and drop wallpaper here")}
            </strong>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              {t(
                "支援格式：PNG、JPG、JPEG、WebP、SVG、GIF（載入後自動套用編輯器與全視窗毛玻璃）",
                "Supported formats: PNG, JPG, WebP, SVG, GIF (auto-applies editor & panel frosted glass)",
              )}
            </span>
          </div>

          {theme.backgroundImage && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                padding: "16px",
                background: "var(--raised)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <strong style={{ fontSize: "14px" }}>
                  {t("目前背景桌布與毛玻璃配置", "Current Wallpaper & Frosted Glass Settings")}
                </strong>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleExtractColorFromWallpaper}
                    style={{
                      background: "var(--accent)",
                      color: "var(--on-accent)",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 650,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  >
                    <span>🎨</span>
                    <span>{t("根據此圖片自動生成主題配色", "Auto-extract Theme Color")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateThemeField("backgroundImage", null)}
                    style={{
                      color: "var(--error, #ef4444)",
                      border: "1px solid var(--border)",
                      background: "transparent",
                      borderRadius: "6px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {t("移除背景圖片", "Remove Wallpaper")}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: "160px",
                    height: "100px",
                    borderRadius: "8px",
                    backgroundImage: `url("${theme.backgroundImage}")`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: "1px solid var(--border)",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    flex: 1,
                    minWidth: "260px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "13px",
                      color: "var(--text)",
                    }}
                  >
                    <span style={{ minWidth: "130px" }}>
                      {t("面板與編輯器透明度：", "Panel & Editor Opacity:")}
                    </span>
                    <input
                      type="range"
                      min="0.4"
                      max="0.95"
                      step="0.05"
                      value={theme.bgOpacity ?? 0.82}
                      onChange={(e) => updateThemeField("bgOpacity", parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span
                      style={{
                        minWidth: "45px",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {Math.round((theme.bgOpacity ?? 0.82) * 100)}%
                    </span>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "13px",
                      color: "var(--text)",
                    }}
                  >
                    <span style={{ minWidth: "130px" }}>
                      {t("背景毛玻璃模糊度：", "Backdrop Blur:")}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="1"
                      value={theme.blur ?? 10}
                      onChange={(e) => updateThemeField("blur", parseInt(e.target.value, 10))}
                      style={{ flex: 1 }}
                    />
                    <span
                      style={{
                        minWidth: "45px",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {theme.blur ?? 10}px
                    </span>
                  </label>

                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {t(
                      "💡 提示：編輯器主視窗已啟用穿透毛玻璃效果，可自由調低透明度以透出背景圖片！",
                      "💡 Tip: Code editor has frosted glass enabled; reduce opacity to let wallpaper show through!",
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Syntax Token Colors */}
      {activeTab === "syntax" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            {t(
              "自訂程式碼編輯器中各種語法 Token 的顯示顏色（可於 JSON 中的 syntax 欄位設定）：",
              "Customize syntax token colors in the code editor (configurable in JSON 'syntax' block):",
            )}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              {
                token: "keyword" as const,
                label: t("關鍵字 (Dim, Sub, As, Const)", "Keywords (Dim, Sub, As, Const)"),
                val: s.keyword || "#f472b6",
              },
              {
                token: "controlKeyword" as const,
                label: t("控制流程 (If, Else, While, For)", "Control Flow (If, Else, While, For)"),
                val: s.controlKeyword || "#fb7185",
              },
              {
                token: "string" as const,
                label: t('字串文字 ("Hello World")', 'Strings ("Hello World")'),
                val: s.string || "#fed7aa",
              },
              {
                token: "number" as const,
                label: t("數字 (123, 3.14)", "Numbers (123, 3.14)"),
                val: s.number || "#cbd5e1",
              },
              {
                token: "comment" as const,
                label: t("程式碼註解 (' 注釋內容)", "Comments (' remark content)"),
                val: s.comment || "#86efac",
              },
              {
                token: "function" as const,
                label: t("函式方法 (LCD.Clear, Motor.Start)", "Functions & Methods"),
                val: s.function || "#f9a8d4",
              },
              {
                token: "variable" as const,
                label: t("變數與參數 (speed, message)", "Variables & Parameters"),
                val: s.variable || "#fde047",
              },
              {
                token: "type" as const,
                label: t("資料型別 (Integer, String)", "Data Types (Integer, String)"),
                val: s.type || "#a5f3fc",
              },
              {
                token: "operator" as const,
                label: t("運算子 (+, -, =, <, >)", "Operators (+, -, =, <, >)"),
                val: s.operator || "#f472b6",
              },
              {
                token: "cursor" as const,
                label: t("編輯器游標色彩 (Cursor)", "Editor Cursor"),
                val: s.cursor || "#ec4899",
              },
              {
                token: "lineHighlight" as const,
                label: t("目前行高亮底色 (Line Highlight)", "Line Highlight Background"),
                val: s.lineHighlight || "#331b2d",
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

      {/* TAB 4: Fonts & Typography */}
      {activeTab === "fonts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "var(--raised)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              <span>{t("主要文字顏色 (Main Text Color)", "Main Text Color")}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="color"
                  value={
                    (theme.textColor || "#fdf2f8").startsWith("#") ? theme.textColor! : "#fdf2f8"
                  }
                  onChange={(e) => updateThemeField("textColor", e.target.value)}
                  style={{
                    width: "34px",
                    height: "28px",
                    padding: "1px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                />
                <code style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {theme.textColor || "#fdf2f8"}
                </code>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "var(--raised)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              <span>{t("次要提示顏色 (Muted Color)", "Muted Subtitle Color")}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="color"
                  value={
                    (theme.mutedColor || "#d4a5be").startsWith("#") ? theme.mutedColor! : "#d4a5be"
                  }
                  onChange={(e) => updateThemeField("mutedColor", e.target.value)}
                  style={{
                    width: "34px",
                    height: "28px",
                    padding: "1px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                />
                <code style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {theme.mutedColor || "#d4a5be"}
                </code>
              </div>
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h4 style={{ margin: "0", fontSize: "13px", color: "var(--text)" }}>
              {t("程式碼等寬字體 (Code Monospace Font)", "Code Monospace Font")}
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

      {/* LIVE CODE PREVIEW (Shown across tabs) */}
      <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <h4 style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
          {t(
            "即時代碼語法與整體底色預覽 (Live Code Preview)",
            "Live Code Syntax & Background Preview",
          )}
        </h4>
        <div
          style={{
            padding: "18px 22px",
            borderRadius: "10px",
            background: theme.editorBg || "#1e101b",
            border: `1px solid ${theme.border || "#562e4c"}`,
            fontFamily: theme.codeFontFamily || '"JetBrains Mono", monospace',
            fontSize: "13px",
            lineHeight: 1.65,
            color: theme.textColor || "#fdf2f8",
            overflowX: "auto",
            boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
          }}
        >
          <div>
            <span
              style={{
                color: theme.mutedColor || "#d4a5be",
                opacity: 0.6,
                marginRight: "16px",
                userSelect: "none",
              }}
            >
              1
            </span>
            <span style={{ color: s.comment || "#86efac" }}>
              ' We love 14 - Total Immersion Theme Preview
            </span>
          </div>
          <div>
            <span
              style={{
                color: theme.mutedColor || "#d4a5be",
                opacity: 0.6,
                marginRight: "16px",
                userSelect: "none",
              }}
            >
              2
            </span>
            <span style={{ color: s.keyword || "#f472b6", fontWeight: 700 }}>Sub</span>{" "}
            <span style={{ color: s.function || "#f9a8d4", fontWeight: 700 }}>Main</span>()
          </div>
          <div>
            <span
              style={{
                color: theme.mutedColor || "#d4a5be",
                opacity: 0.6,
                marginRight: "16px",
                userSelect: "none",
              }}
            >
              3
            </span>
            {"  "}
            <span style={{ color: s.keyword || "#f472b6" }}>Dim</span>{" "}
            <span style={{ color: s.variable || "#fde047" }}>speed</span>{" "}
            <span style={{ color: s.keyword || "#f472b6" }}>As</span>{" "}
            <span style={{ color: s.type || "#a5f3fc" }}>Integer</span>{" "}
            <span style={{ color: s.operator || "#f472b6" }}>=</span>{" "}
            <span style={{ color: s.number || "#cbd5e1" }}>75</span>
          </div>
          <div>
            <span
              style={{
                color: theme.mutedColor || "#d4a5be",
                opacity: 0.6,
                marginRight: "16px",
                userSelect: "none",
              }}
            >
              4
            </span>
            {"  "}
            <span style={{ color: s.keyword || "#f472b6" }}>Dim</span>{" "}
            <span style={{ color: s.variable || "#fde047" }}>message</span>{" "}
            <span style={{ color: s.keyword || "#f472b6" }}>As</span>{" "}
            <span style={{ color: s.type || "#a5f3fc" }}>String</span>{" "}
            <span style={{ color: s.operator || "#f472b6" }}>=</span>{" "}
            <span style={{ color: s.string || "#fed7aa" }}>"Kobrixa 14 ARM Edition"</span>
          </div>
          <div
            style={{
              background: s.lineHighlight || "#331b2d",
              padding: "2px 0",
              borderRadius: "4px",
            }}
          >
            <span
              style={{
                color: theme.mutedColor || "#d4a5be",
                opacity: 0.6,
                marginRight: "16px",
                userSelect: "none",
              }}
            >
              5
            </span>
            {"  "}
            <span style={{ color: s.controlKeyword || "#fb7185", fontWeight: 700 }}>If</span>{" "}
            <span style={{ color: s.variable || "#fde047" }}>speed</span>{" "}
            <span style={{ color: s.operator || "#f472b6" }}>&gt;</span>{" "}
            <span style={{ color: s.number || "#cbd5e1" }}>50</span>{" "}
            <span style={{ color: s.controlKeyword || "#fb7185", fontWeight: 700 }}>Then</span>
          </div>
          <div>
            <span
              style={{
                color: theme.mutedColor || "#d4a5be",
                opacity: 0.6,
                marginRight: "16px",
                userSelect: "none",
              }}
            >
              6
            </span>
            {"    "}
            <span style={{ color: s.function || "#f9a8d4" }}>LCD.Clear</span>()
          </div>
          <div>
            <span
              style={{
                color: theme.mutedColor || "#d4a5be",
                opacity: 0.6,
                marginRight: "16px",
                userSelect: "none",
              }}
            >
              7
            </span>
            {"    "}
            <span style={{ color: s.function || "#f9a8d4" }}>Motor.Start</span>(
            <span style={{ color: s.string || "#fed7aa" }}>"A"</span>
            <span style={{ color: s.delimiter || "#e2e8f0" }}>,</span>{" "}
            <span style={{ color: s.variable || "#fde047" }}>speed</span>)
          </div>
          <div>
            <span
              style={{
                color: theme.mutedColor || "#d4a5be",
                opacity: 0.6,
                marginRight: "16px",
                userSelect: "none",
              }}
            >
              8
            </span>
            {"  "}
            <span style={{ color: s.controlKeyword || "#fb7185", fontWeight: 700 }}>End If</span>
          </div>
          <div>
            <span
              style={{
                color: theme.mutedColor || "#d4a5be",
                opacity: 0.6,
                marginRight: "16px",
                userSelect: "none",
              }}
            >
              9
            </span>
            <span style={{ color: s.keyword || "#f472b6", fontWeight: 700 }}>End Sub</span>
          </div>
        </div>
      </section>

      {/* TAB 5: Import / Export / Wallpaper */}
      {activeTab === "import" && (
        <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
            {t(
              "支援匯入自訂主題 JSON（包含代碼語法色彩、全域底色與字體）以及背景圖片：",
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
