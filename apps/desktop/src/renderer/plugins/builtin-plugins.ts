import type { KobrixaPluginManifest } from "./plugin-types.js";

export const BUILTIN_PLUGINS: KobrixaPluginManifest[] = [
  {
    id: "kbr-cyber-thunder-hud",
    name: "藍電平行四邊形科幻艙 (Cyber Thunder HUD)",
    version: "2.0.0",
    author: "Jimmy Li",
    description:
      "超級科幻高壓藍電平行四邊形戰術插件：全平行四邊形斜切裝甲 HUD、即時 Canvas 藍電雷暴電弧、打字與點擊雷電脈衝、12 段平行四邊形電漿電容陣列，以及全介面平行四邊形科幻改造。",
    enabled: true,
    icon: "⚡",
    settingsSchema: [
      {
        key: "electricColor",
        label: "高壓電漿主色 (Plasma Color)",
        type: "select",
        default: "#00f0ff",
        description: "平行四邊形雷電艙與高壓閃電電弧的主色調",
        options: [
          {
            label: "超導冰電藍 (#00f0ff)",
            value: "#00f0ff",
          },
          {
            label: "深海高壓藍 (#0088ff)",
            value: "#0088ff",
          },
          {
            label: "天穹電弧藍 (#38bdf8)",
            value: "#38bdf8",
          },
          {
            label: "量子紫電藍 (#818cf8)",
            value: "#818cf8",
          },
        ],
      },
      {
        key: "skewAngle",
        label: "平行四邊形傾角 (Skew Angle °)",
        type: "number",
        default: -16,
        min: -24,
        max: -8,
        step: 1,
        description: "戰術艙與介面裝甲的平行四邊形斜切角度",
      },
      {
        key: "lightningIntensity",
        label: "雷電電弧密度與強度 (Intensity)",
        type: "number",
        default: 8,
        min: 1,
        max: 10,
        step: 1,
        description: "即時藍電雷暴的分叉數量與環境放電頻率",
      },
      {
        key: "keystrokeThunder",
        label: "打字與點擊觸發高壓藍電擊",
        type: "boolean",
        default: true,
        description: "輸入文字或點擊畫面時即時劈下分叉藍色閃電與平行四邊形衝擊波",
      },
      {
        key: "fullInterfaceSkew",
        label: "全介面平行四邊形科幻裝甲化",
        type: "boolean",
        default: true,
        description: "將工作區按鈕、導航列與插件卡片同步轉化為高壓藍電平行四邊形裝甲",
      },
      {
        key: "hudPosition",
        label: "平行四邊形戰術艙位置 (HUD Position)",
        type: "select",
        default: "bottom-right",
        description: "懸浮平行四邊形雷電戰術艙在畫面中的停靠方位",
        options: [
          {
            label: "右下懸浮戰術艙 (Bottom Right)",
            value: "bottom-right",
          },
          {
            label: "左下懸浮戰術艙 (Bottom Left)",
            value: "bottom-left",
          },
          {
            label: "右上懸浮戰術艙 (Top Right)",
            value: "top-right",
          },
        ],
      },
    ],
    code: '// @id kbr-cyber-thunder-hud\n// @name 藍電平行四邊形科幻艙 (Cyber Thunder HUD)\n// @version 2.0.0\n// @author Jimmy Li\n// @description 超級科幻高壓藍電平行四邊形戰術插件：全平行四邊形斜切裝甲 HUD、即時 Canvas 藍電雷暴電弧、打字與點擊雷電脈衝、12 段平行四邊形電漿電容陣列，以及全介面平行四邊形科幻改造。\n// @icon ⚡\n\nexport const settingsSchema: PluginSettingField[] = [\n  {\n    "key": "electricColor",\n    "label": "高壓電漿主色 (Plasma Color)",\n    "type": "select",\n    "default": "#00f0ff",\n    "description": "平行四邊形雷電艙與高壓閃電電弧的主色調",\n    "options": [\n      {\n        "label": "超導冰電藍 (#00f0ff)",\n        "value": "#00f0ff"\n      },\n      {\n        "label": "深海高壓藍 (#0088ff)",\n        "value": "#0088ff"\n      },\n      {\n        "label": "天穹電弧藍 (#38bdf8)",\n        "value": "#38bdf8"\n      },\n      {\n        "label": "量子紫電藍 (#818cf8)",\n        "value": "#818cf8"\n      }\n    ]\n  },\n  {\n    "key": "skewAngle",\n    "label": "平行四邊形傾角 (Skew Angle °)",\n    "type": "number",\n    "default": -16,\n    "min": -24,\n    "max": -8,\n    "step": 1,\n    "description": "戰術艙與介面裝甲的平行四邊形斜切角度"\n  },\n  {\n    "key": "lightningIntensity",\n    "label": "雷電電弧密度與強度 (Intensity)",\n    "type": "number",\n    "default": 8,\n    "min": 1,\n    "max": 10,\n    "step": 1,\n    "description": "即時藍電雷暴的分叉數量與環境放電頻率"\n  },\n  {\n    "key": "keystrokeThunder",\n    "label": "打字與點擊觸發高壓藍電擊",\n    "type": "boolean",\n    "default": true,\n    "description": "輸入文字或點擊畫面時即時劈下分叉藍色閃電與平行四邊形衝擊波"\n  },\n  {\n    "key": "fullInterfaceSkew",\n    "label": "全介面平行四邊形科幻裝甲化",\n    "type": "boolean",\n    "default": true,\n    "description": "將工作區按鈕、導航列與插件卡片同步轉化為高壓藍電平行四邊形裝甲"\n  },\n  {\n    "key": "hudPosition",\n    "label": "平行四邊形戰術艙位置 (HUD Position)",\n    "type": "select",\n    "default": "bottom-right",\n    "description": "懸浮平行四邊形雷電戰術艙在畫面中的停靠方位",\n    "options": [\n      {\n        "label": "右下懸浮戰術艙 (Bottom Right)",\n        "value": "bottom-right"\n      },\n      {\n        "label": "左下懸浮戰術艙 (Bottom Left)",\n        "value": "bottom-left"\n      },\n      {\n        "label": "右上懸浮戰術艙 (Top Right)",\n        "value": "top-right"\n      }\n    ]\n  }\n];\n\nexport function activate(context: KobrixaPluginContext): void {\n  const ROOT_ID = "kbr-cyber-thunder-hud-root";\n  const CANVAS_ID = "kbr-cyber-thunder-canvas";\n  const TOPBAR_ID = "kbr-cyber-thunder-topbar-badge";\n\n  [ROOT_ID, CANVAS_ID, TOPBAR_ID].forEach((id) => {\n    const existing = document.getElementById(id);\n    if (existing) existing.remove();\n  });\n\n  let primaryColor: string = String(context.settings.get("electricColor", "#00f0ff"));\n  let skewDeg: number = Number(context.settings.get("skewAngle", -16));\n  let intensity: number = Math.max(1, Math.min(10, Number(context.settings.get("lightningIntensity", 8))));\n  let keystrokeThunder: boolean = Boolean(context.settings.get("keystrokeThunder", true));\n  let morphUi: boolean = Boolean(context.settings.get("fullInterfaceSkew", true));\n  let hudPosition: string = String(context.settings.get("hudPosition", "bottom-right"));\n\n  const getPositionCss = (pos: string): string => {\n    if (pos === "bottom-left") return "bottom: 22px; left: 28px; top: auto; right: auto;";\n    if (pos === "top-right") return "top: 66px; right: 28px; bottom: auto; left: auto;";\n    return "bottom: 22px; right: 28px; top: auto; left: auto;";\n  };\n\n  const buildCss = (): string => `\n    :root {\n      --kbr-thunder-cyan: ${primaryColor};\n      --kbr-thunder-blue: #0066ff;\n      --kbr-thunder-skew: ${skewDeg}deg;\n      --kbr-thunder-unskew: ${-skewDeg}deg;\n    }\n\n    #${CANVAS_ID} {\n      position: fixed;\n      inset: 0;\n      width: 100vw;\n      height: 100vh;\n      pointer-events: none;\n      z-index: 9998;\n    }\n\n    #${ROOT_ID} {\n      position: fixed;\n      ${getPositionCss(hudPosition)}\n      z-index: 9999;\n      font-family: "JetBrains Mono", "SF Mono", "Fira Code", monospace;\n      color: #e0faff;\n      user-select: none;\n      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;\n    }\n\n    #${ROOT_ID} .kbr-hud-frame {\n      position: relative;\n      width: 396px;\n      padding: 14px 18px 16px;\n      background:\n        linear-gradient(135deg, rgba(0, 240, 255, 0.18) 0%, rgba(2, 12, 34, 0.94) 38%, rgba(1, 6, 20, 0.97) 100%),\n        repeating-linear-gradient(\n          0deg,\n          rgba(0, 240, 255, 0.05) 0px,\n          rgba(0, 240, 255, 0.05) 1px,\n          transparent 1px,\n          transparent 4px\n        );\n      border: 1.5px solid var(--kbr-thunder-cyan);\n      box-shadow:\n        0 0 26px rgba(0, 240, 255, 0.44),\n        0 0 64px rgba(0, 102, 255, 0.3),\n        inset 0 0 22px rgba(0, 240, 255, 0.18);\n      transform: skewX(var(--kbr-thunder-skew));\n      backdrop-filter: blur(14px);\n      overflow: hidden;\n    }\n\n    #${ROOT_ID}.is-overdrive .kbr-hud-frame {\n      border-color: #ffffff;\n      box-shadow:\n        0 0 38px var(--kbr-thunder-cyan),\n        0 0 92px rgba(0, 140, 255, 0.68),\n        inset 0 0 38px rgba(0, 240, 255, 0.36);\n      animation: kbr-hud-pulse 0.85s infinite alternate ease-in-out;\n    }\n\n    #${ROOT_ID}.is-collapsed .kbr-hud-body {\n      display: none;\n    }\n\n    #${ROOT_ID}.is-collapsed .kbr-hud-frame {\n      width: 296px;\n      padding: 10px 16px;\n    }\n\n    #${ROOT_ID} .kbr-hud-frame::before {\n      content: "";\n      position: absolute;\n      top: -120%;\n      left: -30%;\n      width: 160%;\n      height: 55%;\n      background: linear-gradient(\n        180deg,\n        transparent 0%,\n        rgba(0, 240, 255, 0.18) 85%,\n        rgba(255, 255, 255, 0.55) 100%\n      );\n      animation: kbr-scanline 3.2s linear infinite;\n      pointer-events: none;\n    }\n\n    #${ROOT_ID} .kbr-hud-frame::after {\n      content: "";\n      position: absolute;\n      top: 0;\n      left: 0;\n      width: 6px;\n      height: 100%;\n      background: linear-gradient(180deg, #ffffff, var(--kbr-thunder-cyan), #0051ff);\n      box-shadow: 0 0 14px var(--kbr-thunder-cyan);\n    }\n\n    #${ROOT_ID} .kbr-unskew {\n      display: block;\n      transform: skewX(var(--kbr-thunder-unskew));\n    }\n\n    #${ROOT_ID} .kbr-unskew-inline {\n      display: inline-block;\n      transform: skewX(var(--kbr-thunder-unskew));\n      white-space: nowrap;\n    }\n\n    #${ROOT_ID} .kbr-hud-header {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 10px;\n      margin-bottom: 10px;\n      padding-bottom: 8px;\n      border-bottom: 1px solid rgba(0, 240, 255, 0.34);\n    }\n\n    #${ROOT_ID}.is-collapsed .kbr-hud-header {\n      margin-bottom: 0;\n      padding-bottom: 0;\n      border-bottom: none;\n    }\n\n    #${ROOT_ID} .kbr-hud-title-wrap {\n      display: flex;\n      align-items: center;\n      gap: 9px;\n      min-width: 0;\n    }\n\n    #${ROOT_ID} .kbr-bolt-badge {\n      display: inline-flex;\n      align-items: center;\n      justify-content: center;\n      width: 24px;\n      height: 24px;\n      background: linear-gradient(135deg, #ffffff 0%, var(--kbr-thunder-cyan) 55%, #0051ff 100%);\n      color: #010a1c;\n      font-weight: 900;\n      font-size: 13px;\n      box-shadow: 0 0 14px var(--kbr-thunder-cyan);\n      flex-shrink: 0;\n    }\n\n    #${ROOT_ID} .kbr-hud-title {\n      font-size: 12px;\n      font-weight: 800;\n      letter-spacing: 0.12em;\n      color: #ffffff;\n      text-shadow: 0 0 10px var(--kbr-thunder-cyan);\n      white-space: nowrap;\n    }\n\n    #${ROOT_ID} .kbr-hud-subtitle {\n      font-size: 9px;\n      color: var(--kbr-thunder-cyan);\n      letter-spacing: 0.16em;\n      white-space: nowrap;\n      opacity: 0.92;\n    }\n\n    #${ROOT_ID} .kbr-hud-min-btn {\n      background: rgba(0, 240, 255, 0.14);\n      border: 1px solid var(--kbr-thunder-cyan);\n      color: #ffffff;\n      padding: 3px 9px;\n      font-size: 11px;\n      font-weight: 700;\n      cursor: pointer;\n      white-space: nowrap;\n      flex-shrink: 0;\n      transition: all 0.18s ease;\n    }\n\n    #${ROOT_ID} .kbr-hud-min-btn:hover {\n      background: var(--kbr-thunder-cyan);\n      color: #020b1e;\n      box-shadow: 0 0 12px var(--kbr-thunder-cyan);\n    }\n\n    #${ROOT_ID} .kbr-telemetry-grid {\n      display: grid;\n      grid-template-columns: repeat(2, minmax(0, 1fr));\n      gap: 8px;\n      margin-bottom: 11px;\n    }\n\n    #${ROOT_ID} .kbr-tele-cell {\n      position: relative;\n      padding: 7px 12px;\n      background: linear-gradient(90deg, rgba(0, 240, 255, 0.16), rgba(0, 68, 255, 0.08));\n      border: 1px solid rgba(0, 240, 255, 0.44);\n      border-left: 3px solid var(--kbr-thunder-cyan);\n      box-shadow: inset 0 0 12px rgba(0, 240, 255, 0.14);\n    }\n\n    #${ROOT_ID} .kbr-tele-label {\n      font-size: 9px;\n      font-weight: 700;\n      letter-spacing: 0.13em;\n      color: rgba(175, 245, 255, 0.82);\n      white-space: nowrap;\n    }\n\n    #${ROOT_ID} .kbr-tele-val {\n      font-size: 14px;\n      font-weight: 800;\n      color: #ffffff;\n      text-shadow: 0 0 10px var(--kbr-thunder-cyan);\n      white-space: nowrap;\n      margin-top: 2px;\n    }\n\n    #${ROOT_ID} .kbr-flux-bar {\n      display: grid;\n      grid-template-columns: repeat(12, 1fr);\n      gap: 4px;\n      margin-bottom: 12px;\n      padding: 5px 6px;\n      background: rgba(1, 8, 24, 0.86);\n      border: 1px solid rgba(0, 240, 255, 0.38);\n    }\n\n    #${ROOT_ID} .kbr-flux-seg {\n      height: 10px;\n      background: rgba(0, 240, 255, 0.16);\n      border: 1px solid rgba(0, 240, 255, 0.35);\n      transition: background 0.15s ease, box-shadow 0.15s ease;\n    }\n\n    #${ROOT_ID} .kbr-flux-seg.is-lit {\n      background: linear-gradient(180deg, #ffffff 0%, var(--kbr-thunder-cyan) 60%, #0066ff 100%);\n      box-shadow: 0 0 10px var(--kbr-thunder-cyan);\n    }\n\n    #${ROOT_ID} .kbr-action-row {\n      display: grid;\n      grid-template-columns: repeat(3, minmax(0, 1fr));\n      gap: 8px;\n    }\n\n    #${ROOT_ID} .kbr-cyber-btn {\n      position: relative;\n      padding: 7px 8px;\n      background: linear-gradient(135deg, rgba(0, 240, 255, 0.22) 0%, rgba(0, 81, 255, 0.28) 100%);\n      border: 1px solid var(--kbr-thunder-cyan);\n      color: #ffffff;\n      font-family: inherit;\n      font-size: 11px;\n      font-weight: 800;\n      letter-spacing: 0.06em;\n      cursor: pointer;\n      white-space: nowrap;\n      text-align: center;\n      box-shadow: 0 0 12px rgba(0, 240, 255, 0.24);\n      transition: all 0.16s ease;\n    }\n\n    #${ROOT_ID} .kbr-cyber-btn:hover {\n      background: linear-gradient(135deg, #ffffff 0%, var(--kbr-thunder-cyan) 65%, #0066ff 100%);\n      color: #010918;\n      box-shadow: 0 0 20px var(--kbr-thunder-cyan);\n    }\n\n    #${ROOT_ID} .kbr-cyber-btn.is-active {\n      background: linear-gradient(135deg, var(--kbr-thunder-cyan) 0%, #0051ff 100%);\n      color: #010918;\n      box-shadow: 0 0 18px var(--kbr-thunder-cyan);\n    }\n\n    #${TOPBAR_ID} {\n      display: inline-flex;\n      align-items: center;\n      gap: 6px;\n      padding: 4px 12px;\n      background: linear-gradient(135deg, rgba(0, 240, 255, 0.24), rgba(0, 72, 255, 0.3));\n      border: 1px solid var(--kbr-thunder-cyan);\n      box-shadow: 0 0 14px rgba(0, 240, 255, 0.38), inset 0 0 8px rgba(0, 240, 255, 0.22);\n      transform: skewX(var(--kbr-thunder-skew));\n      color: #ffffff;\n      font-family: "JetBrains Mono", "SF Mono", monospace;\n      font-size: 11px;\n      font-weight: 800;\n      letter-spacing: 0.08em;\n      cursor: pointer;\n      white-space: nowrap;\n      flex-shrink: 0;\n    }\n\n    #${TOPBAR_ID}:hover {\n      box-shadow: 0 0 22px var(--kbr-thunder-cyan);\n      background: linear-gradient(135deg, rgba(0, 240, 255, 0.44), rgba(0, 88, 255, 0.44));\n    }\n\n    #${TOPBAR_ID} > span {\n      display: inline-block;\n      transform: skewX(var(--kbr-thunder-unskew));\n      white-space: nowrap;\n    }\n\n    body.kbr-cyber-thunder-ui .plugins-action-btn,\n    body.kbr-cyber-thunder-ui .plugins-mode-btn,\n    body.kbr-cyber-thunder-ui .preferences button {\n      transform: skewX(var(--kbr-thunder-skew));\n      border-color: rgba(0, 240, 255, 0.62) !important;\n      box-shadow: 0 0 12px rgba(0, 240, 255, 0.24), inset 0 0 10px rgba(0, 240, 255, 0.14) !important;\n      background: linear-gradient(135deg, rgba(0, 240, 255, 0.18), rgba(2, 16, 42, 0.86)) !important;\n      color: #e8fcff !important;\n      white-space: nowrap !important;\n      flex-shrink: 0 !important;\n      border-radius: 2px !important;\n    }\n\n    body.kbr-cyber-thunder-ui .plugins-card,\n    body.kbr-cyber-thunder-ui .plugins-Dropzone,\n    body.kbr-cyber-thunder-ui .plugins-hero {\n      border-color: rgba(0, 240, 255, 0.48) !important;\n      box-shadow: 0 0 24px rgba(0, 240, 255, 0.16), inset 0 0 16px rgba(0, 240, 255, 0.08) !important;\n    }\n\n    @keyframes kbr-scanline {\n      0% { transform: translateY(0%); }\n      100% { transform: translateY(420%); }\n    }\n\n    @keyframes kbr-hud-pulse {\n      0% { filter: brightness(1); }\n      100% { filter: brightness(1.24); }\n    }\n  `;\n\n  context.ui.injectStyle("kbr-cyber-thunder-style", buildCss());\n  document.body.classList.toggle("kbr-cyber-thunder-ui", morphUi);\n\n  // 建立全屏高壓藍電 Canvas\n  const canvas: HTMLCanvasElement = document.createElement("canvas");\n  canvas.id = CANVAS_ID;\n  document.body.appendChild(canvas);\n  const ctx = typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent || "") ? null : canvas.getContext("2d");\n\n  const resizeCanvas = (): void => {\n    canvas.width = window.innerWidth || 1280;\n    canvas.height = window.innerHeight || 800;\n  };\n  resizeCanvas();\n  window.addEventListener("resize", resizeCanvas);\n\n  // 建立懸浮平行四邊形戰術艙 HUD\n  const root: HTMLDivElement = document.createElement("div");\n  root.id = ROOT_ID;\n  root.innerHTML = `\n    <div class="kbr-hud-frame">\n      <div class="kbr-hud-header">\n        <div class="kbr-hud-title-wrap">\n          <div class="kbr-bolt-badge"><span class="kbr-unskew-inline">⚡</span></div>\n          <div class="kbr-unskew">\n            <div class="kbr-hud-title">CYBER THUNDER // 平行四邊形雷電艙</div>\n            <div class="kbr-hud-subtitle">HYPER-VOLTAGE BLUE PLASMA MATRIX · MK-IV</div>\n          </div>\n        </div>\n        <button type="button" class="kbr-hud-min-btn" id="kbr-thunder-collapse-btn" title="收合或展開戰術艙">\n          <span class="kbr-unskew-inline" id="kbr-thunder-collapse-label">− 收合</span>\n        </button>\n      </div>\n\n      <div class="kbr-hud-body">\n        <div class="kbr-telemetry-grid">\n          <div class="kbr-tele-cell">\n            <div class="kbr-unskew">\n              <div class="kbr-tele-label">PLASMA VOLTAGE</div>\n              <div class="kbr-tele-val" id="kbr-tele-voltage">14.8 kV</div>\n            </div>\n          </div>\n          <div class="kbr-tele-cell">\n            <div class="kbr-unskew">\n              <div class="kbr-tele-label">THUNDER STRIKES</div>\n              <div class="kbr-tele-val" id="kbr-tele-strikes">0 ARCS</div>\n            </div>\n          </div>\n          <div class="kbr-tele-cell">\n            <div class="kbr-unskew">\n              <div class="kbr-tele-label">DOC TELEMETRY</div>\n              <div class="kbr-tele-val" id="kbr-tele-doc">READY // ONLINE</div>\n            </div>\n          </div>\n          <div class="kbr-tele-cell">\n            <div class="kbr-unskew">\n              <div class="kbr-tele-label">CORE FREQUENCY</div>\n              <div class="kbr-tele-val" id="kbr-tele-freq">8.40 THz</div>\n            </div>\n          </div>\n        </div>\n\n        <div class="kbr-flux-bar" id="kbr-flux-bar">\n          ${Array.from({ length: 12 })\n            .map((_, idx) => `<div class="kbr-flux-seg ${idx < 9 ? "is-lit" : ""}"></div>`)\n            .join("")}\n        </div>\n\n        <div class="kbr-action-row">\n          <button type="button" class="kbr-cyber-btn" id="kbr-btn-strike">\n            <span class="kbr-unskew-inline">⚡ 釋放雷暴</span>\n          </button>\n          <button type="button" class="kbr-cyber-btn" id="kbr-btn-overdrive">\n            <span class="kbr-unskew-inline">❖ 雷霆超載</span>\n          </button>\n          <button type="button" class="kbr-cyber-btn ${morphUi ? "is-active" : ""}" id="kbr-btn-morph">\n            <span class="kbr-unskew-inline">⟁ 平行裝甲</span>\n          </button>\n        </div>\n      </div>\n    </div>\n  `;\n  document.body.appendChild(root);\n\n  // 頂部平行四邊形雷電核心徽章\n  const topbarBadge: HTMLButtonElement = document.createElement("button");\n  topbarBadge.id = TOPBAR_ID;\n  topbarBadge.type = "button";\n  topbarBadge.title = "點擊釋放全屏高壓藍電雷暴";\n  topbarBadge.innerHTML = `<span>⚡ THUNDER CORE // 14.8kV</span>`;\n  context.ui.mountElement(".preferences", topbarBadge);\n\n  const bolts = [];\n  const rings = [];\n\n  let strikeCount: number = context.storage.get<number>("strikeCount", 0) ?? 0;\n  let isOverdrive = false;\n  let fluxPhase = 0;\n  let currentVoltage = 14.8;\n  let rafId = 0;\n  let disposed = false;\n\n  const updateStrikeCounter = (): void => {\n    const el = document.getElementById("kbr-tele-strikes");\n    if (el) el.textContent = `${strikeCount} ARCS`;\n  };\n  updateStrikeCounter();\n\n  const createLightningSegments = (x1, y1, x2, y2, displace, depth) => {\n    const pts = [{ x: x1, y: y1 }];\n    const subdivide = (ax, ay, bx, by, disp) => {\n      if (disp < 6) {\n        pts.push({ x: bx, y: by });\n        return;\n      }\n      const midX = (ax + bx) * 0.5 + (Math.random() - 0.5) * disp;\n      const midY = (ay + by) * 0.5 + (Math.random() - 0.5) * disp;\n      subdivide(ax, ay, midX, midY, disp * 0.52);\n      subdivide(midX, midY, bx, by, disp * 0.52);\n    };\n    subdivide(x1, y1, x2, y2, displace);\n    return {\n      pts,\n      alpha: 1.0,\n      decay: depth === 0 ? 0.045 : 0.075,\n      width: depth === 0 ? 2.8 : 1.35,\n    };\n  };\n\n  const spawnThunderBolt = (x1, y1, x2, y2, branches) => {\n    const dist = Math.hypot(x2 - x1, y2 - y1);\n    const mainBolt = createLightningSegments(x1, y1, x2, y2, Math.min(180, dist * 0.32), 0);\n    bolts.push(mainBolt);\n\n    const branchTotal = branches ?? Math.max(1, Math.floor(intensity / 3));\n    for (let i = 0; i < branchTotal; i++) {\n      const pickIdx = Math.floor(Math.random() * Math.max(1, mainBolt.pts.length - 2));\n      const origin = mainBolt.pts[pickIdx] || { x: x1, y: y1 };\n      const bx = origin.x + (Math.random() - 0.5) * 240;\n      const by = origin.y + (Math.random() - 0.3) * 220;\n      bolts.push(createLightningSegments(origin.x, origin.y, bx, by, 58, 1));\n    }\n\n    rings.push({\n      x: x2,\n      y: y2,\n      size: 8,\n      maxSize: 64 + intensity * 5,\n      alpha: 0.95,\n    });\n\n    strikeCount += 1;\n    context.storage.set("strikeCount", strikeCount);\n    currentVoltage = +(14.8 + Math.random() * 9.6 + (isOverdrive ? 12.0 : 0)).toFixed(1);\n    updateStrikeCounter();\n  };\n\n  const triggerMegaThunderStorm = (): void => {\n    const w = canvas.width || 1280;\n    const h = canvas.height || 800;\n    const burstCount = isOverdrive ? 7 : 4;\n    for (let i = 0; i < burstCount; i++) {\n      const sx = w * (0.12 + Math.random() * 0.76);\n      const ex = sx + (Math.random() - 0.5) * 360;\n      const ey = h * (0.35 + Math.random() * 0.58);\n      spawnThunderBolt(sx, 0, ex, ey, 3);\n    }\n  };\n\n  const renderFrame = (): void => {\n    if (disposed) return;\n    if (ctx) {\n      ctx.clearRect(0, 0, canvas.width, canvas.height);\n\n      for (let i = bolts.length - 1; i >= 0; i--) {\n        const b = bolts[i];\n        if (b && b.pts.length > 1) {\n          ctx.save();\n          ctx.beginPath();\n          ctx.moveTo(b.pts[0].x, b.pts[0].y);\n          for (let j = 1; j < b.pts.length; j++) {\n            ctx.lineTo(b.pts[j].x, b.pts[j].y);\n          }\n          ctx.strokeStyle = primaryColor;\n          ctx.lineWidth = b.width * 2.4;\n          ctx.globalAlpha = b.alpha * 0.48;\n          ctx.shadowColor = primaryColor;\n          ctx.shadowBlur = 22;\n          ctx.stroke();\n\n          ctx.beginPath();\n          ctx.moveTo(b.pts[0].x, b.pts[0].y);\n          for (let j = 1; j < b.pts.length; j++) {\n            ctx.lineTo(b.pts[j].x, b.pts[j].y);\n          }\n          ctx.strokeStyle = "#ffffff";\n          ctx.lineWidth = Math.max(1, b.width * 0.85);\n          ctx.globalAlpha = b.alpha;\n          ctx.shadowColor = "#ffffff";\n          ctx.shadowBlur = 10;\n          ctx.stroke();\n          ctx.restore();\n        }\n        if (b) {\n          b.alpha -= b.decay;\n          if (b.alpha <= 0) {\n            bolts.splice(i, 1);\n          }\n        }\n      }\n\n      const skewTan = Math.tan((skewDeg * Math.PI) / 180);\n      for (let i = rings.length - 1; i >= 0; i--) {\n        const r = rings[i];\n        if (r) {\n          ctx.save();\n          ctx.translate(r.x, r.y);\n          ctx.transform(1, 0, skewTan, 1, 0, 0);\n          ctx.strokeStyle = primaryColor;\n          ctx.lineWidth = 1.8;\n          ctx.globalAlpha = r.alpha;\n          ctx.shadowColor = primaryColor;\n          ctx.shadowBlur = 16;\n          ctx.strokeRect(-r.size, -r.size * 0.55, r.size * 2, r.size * 1.1);\n          ctx.restore();\n\n          r.size += (r.maxSize - r.size) * 0.16 + 1.5;\n          r.alpha -= 0.048;\n          if (r.alpha <= 0) {\n            rings.splice(i, 1);\n          }\n        }\n      }\n    }\n\n    const ambientChance = (isOverdrive ? 0.085 : 0.018) * (intensity / 6);\n    if (Math.random() < ambientChance) {\n      const w = canvas.width || 1280;\n      const h = canvas.height || 800;\n      const x1 = Math.random() * w;\n      const y1 = Math.random() < 0.5 ? 0 : Math.random() * h * 0.3;\n      const x2 = x1 + (Math.random() - 0.5) * 280;\n      const y2 = y1 + 140 + Math.random() * 320;\n      spawnThunderBolt(x1, y1, x2, y2, 2);\n    }\n\n    if (typeof window.requestAnimationFrame === "function") {\n      rafId = window.requestAnimationFrame(renderFrame);\n    }\n  };\n\n  const updateTelemetry = (): void => {\n    fluxPhase = (fluxPhase + 1) % 12;\n    const segs = root.querySelectorAll(".kbr-flux-seg");\n    const litTarget = isOverdrive ? 12 : Math.max(4, Math.min(11, Math.round(intensity * 1.1)));\n    segs.forEach((seg, idx) => {\n      const active = idx < litTarget || idx === fluxPhase;\n      seg.classList.toggle("is-lit", active);\n    });\n\n    const editor = document.querySelector("textarea, .monaco-editor");\n    const docEl = document.getElementById("kbr-tele-doc");\n    if (docEl) {\n      if (editor && "value" in editor && typeof editor.value === "string") {\n        const val = editor.value;\n        docEl.textContent = `${val.length} CH / ${val.split("\\n").length} LN`;\n      } else {\n        docEl.textContent = isOverdrive ? "OVERDRIVE // MAX" : "READY // ONLINE";\n      }\n    }\n\n    const voltEl = document.getElementById("kbr-tele-voltage");\n    if (voltEl) {\n      currentVoltage = Math.max(isOverdrive ? 24.0 : 14.8, +(currentVoltage * 0.92 + 1.15).toFixed(1));\n      voltEl.textContent = `${currentVoltage.toFixed(1)} kV`;\n      topbarBadge.innerHTML = `<span>⚡ THUNDER CORE // ${currentVoltage.toFixed(1)}kV</span>`;\n    }\n\n    const freqEl = document.getElementById("kbr-tele-freq");\n    if (freqEl) {\n      const hz = ((isOverdrive ? 16.4 : 8.2) + Math.sin(Date.now() / 360) * 0.85).toFixed(2);\n      freqEl.textContent = `${hz} THz`;\n    }\n  };\n\n  const btnStrike = document.getElementById("kbr-btn-strike");\n  if (btnStrike) {\n    btnStrike.addEventListener("click", () => {\n      triggerMegaThunderStorm();\n      context.ui.showToast("⚡ 已釋放高壓藍電平行四邊形雷暴！", "info");\n    });\n  }\n\n  const btnOverdrive = document.getElementById("kbr-btn-overdrive");\n  if (btnOverdrive) {\n    btnOverdrive.addEventListener("click", () => {\n      isOverdrive = !isOverdrive;\n      root.classList.toggle("is-overdrive", isOverdrive);\n      btnOverdrive.classList.toggle("is-active", isOverdrive);\n      triggerMegaThunderStorm();\n      context.ui.showToast(\n        isOverdrive ? "❖ 雷霆超載模式已啟動 (24.0 kV)" : "雷霆超載已恢復標準輸出",\n        "info",\n      );\n    });\n  }\n\n  const btnMorph = document.getElementById("kbr-btn-morph");\n  if (btnMorph) {\n    btnMorph.addEventListener("click", () => {\n      morphUi = !document.body.classList.contains("kbr-cyber-thunder-ui");\n      document.body.classList.toggle("kbr-cyber-thunder-ui", morphUi);\n      btnMorph.classList.toggle("is-active", morphUi);\n      triggerMegaThunderStorm();\n    });\n  }\n\n  const btnCollapse = document.getElementById("kbr-thunder-collapse-btn");\n  const labelCollapse = document.getElementById("kbr-thunder-collapse-label");\n  if (btnCollapse) {\n    btnCollapse.addEventListener("click", () => {\n      const collapsed = root.classList.toggle("is-collapsed");\n      if (labelCollapse) {\n        labelCollapse.textContent = collapsed ? "+ 展開" : "− 收合";\n      }\n    });\n  }\n\n  topbarBadge.addEventListener("click", () => {\n    root.classList.remove("is-collapsed");\n    if (labelCollapse) labelCollapse.textContent = "− 收合";\n    triggerMegaThunderStorm();\n  });\n\n  const onKeyDown = (): void => {\n    if (!keystrokeThunder) return;\n    const w = canvas.width || 1280;\n    const h = canvas.height || 800;\n    const tx = w * (0.28 + Math.random() * 0.44);\n    const ty = h * (0.25 + Math.random() * 0.45);\n    spawnThunderBolt(tx + (Math.random() - 0.5) * 180, 0, tx, ty, 1);\n  };\n\n  const onMouseDown = (ev: MouseEvent): void => {\n    if (!keystrokeThunder) return;\n    if (ev && typeof ev.clientX === "number" && typeof ev.clientY === "number") {\n      const sx = Math.max(20, Math.min(canvas.width - 20, ev.clientX + (Math.random() - 0.5) * 160));\n      spawnThunderBolt(sx, Math.max(0, ev.clientY - 220), ev.clientX, ev.clientY, 2);\n    }\n  };\n\n  window.addEventListener("keydown", onKeyDown, { passive: true });\n  window.addEventListener("mousedown", onMouseDown, { passive: true });\n\n  context.settings.onChange((next) => {\n    primaryColor = String(next.electricColor ?? "#00f0ff");\n    skewDeg = Number(next.skewAngle ?? -16);\n    intensity = Math.max(1, Math.min(10, Number(next.lightningIntensity ?? 8)));\n    keystrokeThunder = Boolean(next.keystrokeThunder ?? true);\n    morphUi = Boolean(next.fullInterfaceSkew ?? true);\n    hudPosition = String(next.hudPosition ?? "bottom-right");\n    context.ui.injectStyle("kbr-cyber-thunder-style", buildCss());\n    document.body.classList.toggle("kbr-cyber-thunder-ui", morphUi);\n    if (btnMorph) btnMorph.classList.toggle("is-active", morphUi);\n  });\n\n  triggerMegaThunderStorm();\n  updateTelemetry();\n  const telemetryTimer = window.setInterval(updateTelemetry, 420);\n  if (typeof window.requestAnimationFrame === "function") {\n    rafId = window.requestAnimationFrame(renderFrame);\n  }\n\n  context.onDeactivate(() => {\n    disposed = true;\n    window.clearInterval(telemetryTimer);\n    if (rafId && typeof window.cancelAnimationFrame === "function") {\n      window.cancelAnimationFrame(rafId);\n    }\n    window.removeEventListener("resize", resizeCanvas);\n    window.removeEventListener("keydown", onKeyDown);\n    window.removeEventListener("mousedown", onMouseDown);\n    document.body.classList.remove("kbr-cyber-thunder-ui");\n    canvas.remove();\n    root.remove();\n    topbarBadge.remove();\n  });\n}\n',
  },
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
