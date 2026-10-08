# Kobrixa IDE（Intel Mac 版）

**用程式驅動創意。**

Kobrixa IDE 是一個開源跨平台開發環境，用於編寫 LEGO® MINDSTORMS® EV3 機器人程式。主要服務學生與創客，提供從原始碼到實體 EV3 主機執行程式的流暢流程。

> [English README](README.md)

---

## 關於本分支（Fork）

本專案是源自 [Kobrixa](https://github.com/Kingsley1116/Kobrixa) 的社群分支，旨在為 **配備 Intel 處理器的 Mac 電腦（`darwin-x64`）提供原生支援與發行版本**。

上游官方專案目前 macOS 僅發布 Apple Silicon（ARM64）版本；本分支提供：

- **原生 Intel Mac 二進位檔與安裝套件**：提供專為 x86_64 Mac 編譯的 `.dmg` 安裝映像檔與免安裝 `.zip` 壓縮檔。
- **多架構打包與驗證管線**：更新打包腳本、二進位 Mach-O 標頭架構檢驗邏輯，同時支援 `darwin-arm64` 與 `darwin-x64`。
- **持續維護與相容**：持續跟進上游功能改進，並確保舊款 Intel Mac 設備能順暢使用。

最新安裝包請前往 [GitHub Releases](https://github.com/HelloWorld233a/Kobrixa-4intelmac/releases) 頁面下載。

---

## 專案狀態

**v1 候選實作（含 Intel Mac 支援）。** 本倉庫包含可直接建置的 IDE、編譯器管線、EV3 image 後端，以及 USB／Wi-Fi 設備服務。

| 能力                           | 狀態                               |
| ------------------------------ | ---------------------------------- |
| Basic Plus（`.bp`）前端        | v1 候選版                          |
| 原生 EV3 `.rbf` 輸出           | v1 候選版                          |
| macOS Intel（`x86_64`）支援    | **本分支正式支援**                 |
| macOS Apple Silicon（`arm64`） | 支援                               |
| Windows 與 Linux 支援          | 支援                               |
| USB HID 與 Wi-Fi 傳輸          | 已實作；實機矩陣驗收中             |
| 安裝套件與散布檔               | 已實作（DMG、ZIP、NSIS、AppImage） |
| 雲端協作                       | candidate.12+ 已納入               |
| Python / TypeScript / C++ 前端 | v1 之後規劃                        |

## 產品方向

```text
編輯 .bp 原始碼
      ↓
編譯為 KobrixaIR
      ↓
產生原生 EV3 bytecode（.rbf）
      ↓
透過 USB 或 Wi-Fi 上傳
      ↓
在 EV3 主機執行
```

Kobrixa 採用 clean-room 方式實作，對常用的舊版 `.bp` 程式提供行為相容性。相容代表程式不需修改即可直接執行，並產生等價的可觀察行為。

## 從原始碼編譯

### 環境需求

- Node.js >= 24.0.0
- pnpm >= 10.0.0

### 編譯步驟

```bash
# Clone 程式碼倉庫
git clone https://github.com/HelloWorld233a/Kobrixa-4intelmac.git
cd Kobrixa-4intelmac

# 安裝相依套件
pnpm install

# 編譯核心模組
pnpm build:core

# 編譯 Intel Mac (x64) 桌面端與安裝檔
TARGET_ARCH=x64 pnpm build:desktop
TARGET_ARCH=x64 pnpm package:installers

# 或編譯 Apple Silicon (arm64) 版本
TARGET_ARCH=arm64 pnpm build:desktop
TARGET_ARCH=arm64 pnpm package:installers
```

安裝檔會生成在 `apps/desktop/out/installers/` 目錄中。

## 技術架構

- **桌面端外殼**：Electron
- **前端介面**：React、TypeScript、Monaco Editor
- **編譯器與通訊核心**：Node.js、TypeScript
- **執行目標**：原生 EV3 虛擬機器 (VM)

## 上游專案與致謝

本專案基於 [Kingsley1116/Kobrixa](https://github.com/Kingsley1116/Kobrixa) 開發。感謝原作者與所有貢獻者打造了優秀的 IDE 架構與編譯流程。

## 法律與商標聲明

Kobrixa 是獨立專案，與 LEGO Group 沒有隸屬、認可或贊助關係。LEGO、MINDSTORMS 與 EV3 是 LEGO Group 的商標。

本倉庫的 Apache-2.0 授權適用於 Kobrixa 的原創成果以及本分支的新增修改。本授權不授予任何第三方所擁有的商標或素材權利。

## 授權

Kobrixa 原創成果以及本分支之修改均依據 [Apache License 2.0](LICENSE) 條款授權發布。
