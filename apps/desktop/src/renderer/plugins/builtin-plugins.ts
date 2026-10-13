import type { KobrixaPluginManifest } from "./plugin-types.js";

export const BUILTIN_PLUGINS: KobrixaPluginManifest[] = [
  {
    id: "kbr-topbar-clock",
    name: "頂部狀態列即時時鐘與專屬問候 (Live Clock & Greeting)",
    version: "1.0.0",
    author: "Jimmy Li",
    description:
      "在頂部導航區域新增即時走時數字時鐘與「✨ We love 14」專屬標章，支援玻璃質感外觀。",
    enabled: true,
    icon: "⏰",
    code: `// .kbr 插件：頂部狀態列即時時鐘
// 示範：如何使用 context.ui.injectStyle 與 DOM 建立自訂 UI
export function activate(context) {
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
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
      animation: kbr-pulse 2s infinite ease-in-out;
    }
    @keyframes kbr-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  \`);

  // 2. 建立時鐘 DOM 元素
  const badge = document.createElement("div");
  badge.className = "kbr-clock-badge";
  badge.title = "Kobrixa ARM Mac v14 專屬即時時鐘 (由 .kbr 插件驅動)";

  const dot = document.createElement("span");
  dot.className = "kbr-clock-dot";

  const text = document.createElement("span");
  text.textContent = "載入中...";

  badge.appendChild(dot);
  badge.appendChild(text);

  const updateTime = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    text.textContent = \`✨ We love 14 · \${timeStr}\`;
  };

  updateTime();
  const timer = setInterval(updateTime, 1000);

  // 3. 掛載到頂部標題列或工作區頂部
  context.ui.mountElement(".preferences", badge);

  // 4. 清理計時器
  context.onDeactivate(() => {
    clearInterval(timer);
  });
}
`,
  },
  {
    id: "kbr-typing-glow",
    name: "編輯器敲擊微光與打字計數器 (Keystroke Glow & Counter)",
    version: "1.0.0",
    author: "Jimmy Li",
    description: "為 Monaco 編輯器增加輸入時的動態光暈邊框，並在右下角即時統計本次會話輸入字數。",
    enabled: true,
    icon: "⚡",
    code: `// .kbr 插件：編輯器敲擊微光與打字計數器
// 示範：如何監聽鍵盤事件、使用 context.storage 儲存數據
export function activate(context) {
  let count = context.storage.get("keyCount", 0);

  // 注入動態微光動畫樣式
  context.ui.injectStyle("kbr-glow-style", \`
    .monaco-editor.focused {
      box-shadow: 0 0 16px -2px var(--accent, #ec4899) !important;
      transition: box-shadow 0.3s ease;
    }
    .kbr-counter-float {
      position: fixed;
      bottom: 24px;
      right: 24px;
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

  // 建立計數顯示標籤
  const counterEl = document.createElement("div");
  counterEl.className = "kbr-counter-float";
  counterEl.textContent = \`⌨️ 打字記數: \${count}\`;
  document.body.appendChild(counterEl);

  const keyHandler = () => {
    count++;
    counterEl.textContent = \`⌨️ 打字記數: \${count}\`;
    if (count % 20 === 0) {
      context.storage.set("keyCount", count);
    }
  };

  window.addEventListener("keydown", keyHandler, true);

  context.onDeactivate(() => {
    window.removeEventListener("keydown", keyHandler, true);
    counterEl.remove();
    context.storage.set("keyCount", count);
  });
}
`,
  },
  {
    id: "kbr-quick-snippets",
    name: "EV3 Basic Plus 常用代碼片段浮動助手 (Quick Snippets Helper)",
    version: "1.0.0",
    author: "Jimmy Li",
    description: "提供一鍵快速複製 EV3 Basic Plus 核心語法與 API 代碼片段的懸浮小工具。",
    enabled: false,
    icon: "🧩",
    code: `// .kbr 插件：EV3 Basic Plus 常用代碼片段浮動助手
export function activate(context) {
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

  const snippets = [
    { label: "LCD.Clear()", code: "LCD.Clear()\\n" },
    { label: "Motor.Start(A, 50)", code: "Motor.Start(MotorPort.A, 50)\\n" },
    { label: "Wait(1000)", code: "Program.Delay(1000)\\n" },
    { label: "Sub Main()", code: "Sub Main()\\n    ' 程式進入點\\nEndSub\\n" },
  ];

  const panel = document.createElement("div");
  panel.className = "kbr-snippets-panel";

  const header = document.createElement("div");
  header.style.fontSize = "11px";
  header.style.fontWeight = "bold";
  header.style.marginBottom = "4px";
  header.textContent = "⚡ EV3 常用片段";
  panel.appendChild(header);

  snippets.forEach(s => {
    const btn = document.createElement("button");
    btn.className = "kbr-snippet-btn";
    btn.textContent = s.label;
    btn.onclick = () => {
      navigator.clipboard.writeText(s.code);
      context.ui.showToast(\`已複製: \${s.label}\`, "success");
    };
    panel.appendChild(btn);
  });

  document.body.appendChild(panel);

  context.onDeactivate(() => {
    panel.remove();
  });
}
`,
  },
];
