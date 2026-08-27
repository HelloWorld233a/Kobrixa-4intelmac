# 路線圖

> 狀態：規劃中；在實作資源確定前不指定日期。  
> 語言：繁體中文 · [English](../en/roadmap.md)

## Phase 0 — 基礎

- 確認 Kobrixa 的商標、程式碼倉庫、套件註冊表、社群帳號與網域可用性。
- 建立 Tauri 2、React、TypeScript、Monaco 與 Rust workspace 骨架。
- 鎖定 toolchain，建立 Windows、macOS、Linux CI。
- 定義版本化 manifest、診斷、IR、成品與設備契約。
- 加入文件連結與雙語一致性檢查。

退出條件：三個平台都能建置空白的開發版或已簽署應用程式，且契約測試通過。

## v1 — Basic Plus 到原生 EV3

- 實作 clean-room `.bp` 前端與行為相容測試套件。
- 實作具型別 `KobrixaIR`、驗證、EV3 lowering 與確定性 `.rbf` 封裝。
- 交付 Monaco 編輯、專案、建置、診斷與成品管理。
- 在 Windows、macOS、Linux 交付 USB HID 與 Wi-Fi 上傳／執行／停止／刪除。
- 發布範例、安裝說明、復原指引與 release 成品。

退出條件：[產品規格](product.md)與[設備規格](device-support.md)的所有條件都在參考硬體上通過。

## v1.x — 強化

- 擴充 `.bp` 相容案例與 EV3 API 覆蓋。
- 改進補全、格式化、效能、無障礙、本地化與復原體驗。
- 在相同 compiler 與 device crate 上加入 headless `kobrixa` CLI。

退出條件：編譯器和設備 API 足夠穩定，可讓 CLI 與桌面程式獨立發布。

## v2 — Python 前端

- 加入 Python parsing、語意映射、EV3 profile 文件、補全與診斷。
- 不嵌入 CPython，將支援的 Python 語意透過 `KobrixaIR` 編譯為 `.rbf`。

## v3 — TypeScript 前端

- 加入 TypeScript parsing 與型別感知 lowering。
- 文件化支援的 runtime 語意，並明確拒絕瀏覽器、Node.js 與動態程式碼功能。

## v4 — C++ 前端

- 定義 freestanding C++ EV3 profile 與支援的標準函式庫範圍。
- 將支援的結構 lowering 為 `KobrixaIR`；不支援的 runtime 功能在編譯期回報。

## 長期探索

- Bluetooth transport
- EV3 模擬器與虛擬設備
- 以同一套 IR 為目標的 Blockly 類積木編輯器
- 教室部署與設備群工具
- 透過獨立後端支援其他 LEGO 相容 Hub

長期項目是研究方向，不是承諾。每個項目實作前都需要書面提案、安全審查、跨平台驗收條件，並同步更新兩種語言文件。
