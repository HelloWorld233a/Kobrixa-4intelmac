# Kobrixa IDE（Intel Mac 版）

**編寫動作。建構創意。**

Kobrixa IDE 是一個為 LEGO® MINDSTORMS® EV3 機器人設計的開源、跨平台整合開發環境（IDE）。本專案專為學生與創客設計，提供從源碼直接編譯並在實體 EV3 主機上運行的完整體驗。

> [English Version](README.md)

---

### 關於本 Fork：Intel Mac 專屬版

本專案是 [Kingsley1116/Kobrixa](https://github.com/Kingsley1116/Kobrixa) 的獨立維護分支。

原版 Kobrixa 主要針對 Apple Silicon (`darwin-arm64`) 提供 macOS 支援；**本分支專門維護並提供對 Intel 處理器 Mac 電腦（`x86_64` / `darwin-x64`）的完整建置、測試與自動發布支援**。

- **原生 Intel Mac 安裝檔**：提供針對 x86_64 架構特別編譯的 `.dmg` 安裝映像檔與 `.zip` 免安裝綠色版。
- **跨架構發布管道**：整合跨架構打包與動態 Mach-O 標頭檢驗機制，完整保留更新清單與校驗碼。
- **百分之百相容原版功能**：完整繼承原專案的所有編譯器、中間表示（IR）、EV3 位元組碼生成器及裝置通訊協定。

---

## 下載安裝

請至 [GitHub Releases](https://github.com/HelloWorld233a/Kobrixa-4intelmac/releases) 下載最新預建安裝包：

| 檔案名稱                   | 適用平台             | 說明                                                          |
| :------------------------- | :------------------- | :------------------------------------------------------------ |
| `Kobrixa-*-darwin-x64.dmg` | macOS (Intel x86_64) | 標準 DMG 安裝映像檔，掛載後拖入「應用程式」資料夾即可完成安裝 |
| `Kobrixa-*-darwin-x64.zip` | macOS (Intel x86_64) | 獨立應用程式壓縮包（`kobrixa.app`），解壓後直接雙擊執行       |

> **macOS 安全提示**：若 macOS 出現「無法打開，因為它不是來自獲識別的開發者」提示，請前往 **系統設定** > **隱私權與安全性**，在安全性區塊點擊 **「強制打開」** 即可。

---

## 本地原始碼編譯

### 環境需求

- Node.js >= 24.0.0
- pnpm >= 10.0.0

### 編譯步驟

```bash
# 1. Clone 倉庫
git clone https://github.com/HelloWorld233a/Kobrixa-4intelmac.git
cd Kobrixa-4intelmac

# 2. 安裝相依套件
pnpm install

# 3. 編譯核心模組
pnpm build:core

# 4. 編譯 Intel Mac 桌面端應用
TARGET_ARCH=x64 pnpm build:desktop

# 5. 打包標準發布壓縮包
TARGET_PLATFORM=darwin TARGET_ARCH=x64 pnpm package:archive
```

---

## 技術棧

- Electron 桌面容器
- React 與 TypeScript 前端渲染架構
- Monaco 編輯器
- Node.js 與 TypeScript 編譯器核心、EV3 後端及裝置通訊服務
- 原生 EV3 虛擬機作為執行目標
- Apache-2.0 開源授權

---

## 來源與致謝

- 原專案：[Kingsley1116/Kobrixa](https://github.com/Kingsley1116/Kobrixa)
- 原作者：Kingsley1116 及 Kobrixa 貢獻者。

---

## 法律與商標聲明

Kobrixa 為獨立開源專案，與樂高集團（LEGO Group）無任何附屬、背書或贊助關係。LEGO、MINDSTORMS 與 EV3 為樂高集團之商標。

---

## 開源協議 (License)

原版 Kobrixa 原始碼基於 [Apache License 2.0](LICENSE) 授權。
本分支的所有修改與 Intel Mac 發布工作流程亦遵循 [Apache License 2.0](LICENSE) 協議。
