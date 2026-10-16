import type { KobrixaPluginManifest } from "./plugin-types.js";

export const BUILTIN_PLUGINS: KobrixaPluginManifest[] = [
  {
    id: "kbr-topbar-clock",
    name: "頂部狀態列即時時鐘與專屬問候 (Live Clock & Greeting)",
    version: "1.2.0",
    author: "Jimmy Li",
    description:
      "在頂部導航區域新增即時走時數字時鐘與專屬標章（TypeScript 編寫，支援自訂問候語、秒數開關與呼吸燈顏色）。",
    enabled: true,
    icon: "⏰",
    settingsSchema: [
      {
        key: "greetingText",
        label: "專屬問候標語 (Greeting Text)",
        type: "string",
        default: "✨ We love 14",
        description: "顯示在頂部時鐘左側的個人化文字",
      },
      {
        key: "showSeconds",
        label: "顯示秒數 (Show Seconds)",
        type: "boolean",
        default: true,
        description: "是否在時鐘內顯示即時秒數跳動",
      },
      {
        key: "dotColor",
        label: "呼吸燈顏色 (Indicator Color)",
        type: "color",
        default: "#10b981",
        description: "時鐘旁狀態圓點的發光色彩",
      },
    ],
    code: `// ============================================================================
// 🛠️ 插件設置區域 (Plugin Settings Schema)
// 在此定義此插件可讓用家在「⚙️ 插件設置」介面修改的選項
// ============================================================================
export const settingsSchema: PluginSettingField[] = [
  {
    key: "greetingText",
    label: "專屬問候標語 (Greeting Text)",
    type: "string",
    default: "✨ We love 14",
    description: "顯示在頂部時鐘左側的個人化文字",
  },
  {
    key: "showSeconds",
    label: "顯示秒數 (Show Seconds)",
    type: "boolean",
    default: true,
    description: "是否在時鐘內顯示即時秒數跳動",
  },
  {
    key: "dotColor",
    label: "呼吸燈顏色 (Indicator Color)",
    type: "color",
    default: "#10b981",
    description: "時鐘旁狀態圓點的發光色彩",
  },
];

// ============================================================================
// 🚀 插件主邏輯區域 (Plugin Main Logic - TypeScript)
// ============================================================================
export function activate(context: KobrixaPluginContext): void {
  const dotColor: string = context.settings.get<string>("dotColor", "#10b981");

  // 1. 注入自訂毛玻璃樣式
  context.ui.injectStyle("kbr-clock-style", \`
    .kbr-clock-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      font-size: 11px;
      font-family: var(--font-sans, system-ui);
      font-weight: 500;
      color: var(--text, #fff);
      background: var(--surface, rgba(255, 255, 255, 0.08));
      border: 1px solid var(--border, rgba(255, 255, 255, 0.15));
      border-radius: 999px;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      user-select: none;
      transition: all 0.2s ease;
      cursor: default;
    }
    .kbr-clock-badge:hover {
      border-color: var(--accent, #ec4899);
      transform: translateY(-1px);
    }
    .kbr-clock-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: \${dotColor};
      box-shadow: 0 0 6px \${dotColor};
      animation: kbr-pulse 2s infinite ease-in-out;
    }
    @keyframes kbr-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  \`);

  // 2. 建立時鐘 DOM 元素
  const badge: HTMLDivElement = document.createElement("div");
  badge.className = "kbr-clock-badge";
  badge.title = "Kobrixa ARM Mac v14 專屬即時時鐘 (由 TypeScript .kbr 插件驅動)";

  const dot: HTMLSpanElement = document.createElement("span");
  dot.className = "kbr-clock-dot";

  const text: HTMLSpanElement = document.createElement("span");
  text.textContent = "載入中...";

  badge.appendChild(dot);
  badge.appendChild(text);

  const updateTime = (): void => {
    const greeting: string = context.settings.get<string>("greetingText", "✨ We love 14");
    const showSec: boolean = context.settings.get<boolean>("showSeconds", true);
    const currentDotColor: string = context.settings.get<string>("dotColor", "#10b981");
    dot.style.background = currentDotColor;
    dot.style.boxShadow = \`0 0 6px \${currentDotColor}\`;

    const now: Date = new Date();
    const timeStr: string = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      ...(showSec ? { second: "2-digit" } : {}),
    });
    text.textContent = greeting ? \`\${greeting} · \${timeStr}\` : timeStr;
  };

  updateTime();
  const timer = setInterval(updateTime, 1000);

  // 監聽插件設置即時變更
  context.settings.onChange(() => {
    updateTime();
  });

  // 3. 掛載到頂部標題列或工作區頂部
  context.ui.mountElement(".preferences", badge);

  // 4. 清理計時器
  context.onDeactivate((): void => {
    clearInterval(timer);
  });
}
`,
  },
  {
    id: "kbr-typing-glow",
    name: "編輯器敲擊微光與打字計數器 (Keystroke Glow & Counter)",
    version: "1.2.0",
    author: "Jimmy Li",
    description:
      "為 Monaco 編輯器增加輸入時的動態光暈邊框，並在角落即時統計輸入字數（支援自訂光暈強度與計數器位置）。",
    enabled: true,
    icon: "⚡",
    settingsSchema: [
      {
        key: "glowSpread",
        label: "編輯器光暈半徑 (Glow Radius px)",
        type: "number",
        default: 16,
        min: 0,
        max: 48,
        step: 2,
        description: "聚焦編輯器時外圍霓虹光暈的擴散像素值",
      },
      {
        key: "showCounter",
        label: "顯示右下角打字計數器 (Show Counter)",
        type: "boolean",
        default: true,
        description: "是否在視窗右下角顯示累計按鍵統計徽章",
      },
      {
        key: "counterPrefix",
        label: "計數器前綴標題 (Counter Label)",
        type: "string",
        default: "⌨️ 打字記數",
        description: "計數器顯示的前綴文字",
      },
    ],
    code: `// ============================================================================
// 🛠️ 插件設置區域 (Plugin Settings Schema)
// 在此定義此插件可讓用家在「⚙️ 插件設置」介面修改的選項
// ============================================================================
export const settingsSchema: PluginSettingField[] = [
  {
    key: "glowSpread",
    label: "編輯器光暈半徑 (Glow Radius px)",
    type: "number",
    default: 16,
    min: 0,
    max: 48,
    step: 2,
    description: "聚焦編輯器時外圍霓虹光暈的擴散像素值",
  },
  {
    key: "showCounter",
    label: "顯示右下角打字計數器 (Show Counter)",
    type: "boolean",
    default: true,
    description: "是否在視窗右下角顯示累計按鍵統計徽章",
  },
  {
    key: "counterPrefix",
    label: "計數器前綴標題 (Counter Label)",
    type: "string",
    default: "⌨️ 打字記數",
    description: "計數器顯示的前綴文字",
  },
];

// ============================================================================
// 🚀 插件主邏輯區域 (Plugin Main Logic - TypeScript)
// ============================================================================
export function activate(context: KobrixaPluginContext): void {
  let count: number = context.storage.get<number>("keyCount", 0) ?? 0;

  const applyGlowStyle = (): void => {
    const spread: number = context.settings.get<number>("glowSpread", 16);
    const showCounter: boolean = context.settings.get<boolean>("showCounter", true);
    context.ui.injectStyle("kbr-glow-style", \`
      .monaco-editor.focused {
        box-shadow: 0 0 \${spread}px -2px var(--accent, #ec4899) !important;
        transition: box-shadow 0.3s ease;
      }
      .kbr-counter-float {
        position: fixed;
        bottom: 24px;
        right: 24px;
        display: \${showCounter ? "block" : "none"};
        background: var(--raised, #281724);
        color: var(--text, #fff);
        border: 1px solid var(--border, #562e4c);
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-family: var(--font-mono, monospace);
        z-index: 9999;
        opacity: 0.85;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
    \`);
  };

  applyGlowStyle();

  const counterEl: HTMLDivElement = document.createElement("div");
  counterEl.className = "kbr-counter-float";
  const renderLabel = (): void => {
    const prefix: string = context.settings.get<string>("counterPrefix", "⌨️ 打字記數");
    counterEl.textContent = \`\${prefix}: \${count}\`;
  };
  renderLabel();
  document.body.appendChild(counterEl);

  const keyHandler = (): void => {
    count++;
    renderLabel();
    if (count % 10 === 0) {
      context.storage.set<number>("keyCount", count);
    }
  };

  window.addEventListener("keydown", keyHandler, true);

  context.settings.onChange(() => {
    applyGlowStyle();
    renderLabel();
  });

  context.onDeactivate((): void => {
    window.removeEventListener("keydown", keyHandler, true);
    counterEl.remove();
    context.storage.set<number>("keyCount", count);
  });
}
`,
  },
  {
    id: "kbr-quick-snippets",
    name: "EV3 Basic Plus 常用代碼片段浮動助手 (Quick Snippets Helper)",
    version: "1.2.0",
    author: "Jimmy Li",
    description:
      "提供一鍵快速複製 EV3 Basic Plus 核心語法與 API 代碼片段的懸浮小工具（支援自訂預設馬達功率與標題）。",
    enabled: false,
    icon: "🧩",
    settingsSchema: [
      {
        key: "panelTitle",
        label: "助手面板標題 (Panel Title)",
        type: "string",
        default: "⚡ EV3 常用片段",
        description: "懸浮小工具頂部顯示的標題名稱",
      },
      {
        key: "defaultSpeed",
        label: "預設馬達速度 (Default Motor Speed)",
        type: "number",
        default: 50,
        min: -100,
        max: 100,
        step: 5,
        description: "複製 Motor.Start 片段時自動帶入的功率數值",
      },
    ],
    code: `// ============================================================================
// 🛠️ 插件設置區域 (Plugin Settings Schema)
// 在此定義此插件可讓用家在「⚙️ 插件設置」介面修改的選項
// ============================================================================
export const settingsSchema: PluginSettingField[] = [
  {
    key: "panelTitle",
    label: "助手面板標題 (Panel Title)",
    type: "string",
    default: "⚡ EV3 常用片段",
    description: "懸浮小工具頂部顯示的標題名稱",
  },
  {
    key: "defaultSpeed",
    label: "預設馬達速度 (Default Motor Speed)",
    type: "number",
    default: 50,
    min: -100,
    max: 100,
    step: 5,
    description: "複製 Motor.Start 片段時自動帶入的功率數值",
  },
];

// ============================================================================
// 🚀 插件主邏輯區域 (Plugin Main Logic - TypeScript)
// ============================================================================
interface SnippetItem {
  label: string;
  code: string;
}

export function activate(context: KobrixaPluginContext): void {
  context.ui.injectStyle("kbr-snippets-style", \`
    .kbr-snippets-panel {
      position: fixed;
      bottom: 60px;
      right: 24px;
      background: var(--raised, #281724);
      border: 1px solid var(--border, #562e4c);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 9998;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kbr-snippet-btn {
      background: var(--surface, #1e101b);
      color: var(--text, #fff);
      border: 1px solid var(--border, #562e4c);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      text-align: left;
      font-family: var(--font-mono, monospace);
    }
    .kbr-snippet-btn:hover {
      background: var(--accent, #ec4899);
      border-color: var(--accent, #ec4899);
    }
  \`);

  const speed: number = context.settings.get<number>("defaultSpeed", 50);
  const titleText: string = context.settings.get<string>("panelTitle", "⚡ EV3 常用片段");

  const snippets: SnippetItem[] = [
    { label: "LCD.Clear()", code: "LCD.Clear()\\n" },
    { label: \`Motor.Start(A, \${speed})\`, code: \`Motor.Start(MotorPort.A, \${speed})\\n\` },
    { label: "Wait(1000)", code: "Program.Delay(1000)\\n" },
    { label: "Sub Main()", code: "Sub Main()\\n    ' 程式進入點\\nEndSub\\n" },
  ];

  const panel: HTMLDivElement = document.createElement("div");
  panel.className = "kbr-snippets-panel";

  const header: HTMLDivElement = document.createElement("div");
  header.style.fontSize = "11px";
  header.style.fontWeight = "bold";
  header.style.marginBottom = "4px";
  header.textContent = titleText;
  panel.appendChild(header);

  snippets.forEach((s: SnippetItem): void => {
    const btn: HTMLButtonElement = document.createElement("button");
    btn.className = "kbr-snippet-btn";
    btn.textContent = s.label;
    btn.onclick = (): void => {
      void navigator.clipboard.writeText(s.code);
      context.ui.showToast(\`已複製: \${s.label}\`, "success");
    };
    panel.appendChild(btn);
  });

  document.body.appendChild(panel);

  context.onDeactivate((): void => {
    panel.remove();
  });
}
`,
  },
];
