# Kobrixa 範例

這些程式均為 Kobrixa 原創範例，依「第一次安全建置」到「需要連接 EV3 硬體」排列。

| 範例               | 學習內容                         | 硬體需求              |
| ------------------ | -------------------------------- | --------------------- |
| `hello-ev3`        | 顯示文字與線條、播放音調、等待   | 僅使用喇叭與螢幕      |
| `control-flow`     | 變數、算術、`For`、繪圖          | 僅使用喇叭與螢幕      |
| `include-settings` | 專案相對 `Include` 與共用數值    | A、D 馬達須能安全轉動 |
| `motor-move`       | 同步移動、等待、煞車             | A、D 馬達             |
| `motor-counter`    | 讀取馬達編碼器並以 `If` 分支     | A 馬達                |
| `sensor-threshold` | 等待並讀取感測器，再以 `If` 分支 | 輸入埠 1 的觸碰感測器 |

可在 Kobrixa 開啟範例目錄、`kobrixa.json` 或 `src/main.bp`。連接 EV3 前請先建置；第一次執行馬達範例時，請先架高機器人，確保輪子可安全轉動。

## 驗證狀態

語法與參數順序已逐項對照公開的 [CLEV3R English Help](https://github.com/iCheh/Clev3r-1/tree/main/Clever/bin/Release/Help/en)。範例現在使用 `LCD.Text(color, x, y, font, text)`、顏色在前的繪圖呼叫、`Motor.Move(ports, speed, degrees, brake)`、從 1 起算的感測器連接埠，以及省略副檔名的 `Include` 路徑。自動測試會解析所有範例、lowering 成 version 1 IR、驗證 IR，並產生結構有效的 `.rbf`；後端回歸測試也依 [LEGO EV3 Firmware Developer Kit](https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt469be1e11ad37696/5f880384f71916144453a49f/lego-mindstorms-ev3-firmware-developer-kit.pdf?locale=en-us)檢查整數 operand、感測器連接埠轉換，以及 `Motor.Move` 的阻塞行為。

因此目前可稱為已通過編譯器與 bytecode 驗證的 v1 candidate；USB／Wi-Fi 上傳及實機執行仍需在指定硬體上完成驗收，尚不宣稱已通過硬體認證。

主題分類參考公開的 CLEV3R 範例目錄（控制流程、函式、include、感測器、馬達、時間、圖形、聲音、檔案與 mailbox），但此處未納入任何 CLEV3R 程式碼、文件、素材或產生的輸出。使用者函式呼叫、檔案、mailbox、thread 與第三方感測器範例，會在編譯器／後端及相容性 fixture 完成後才加入。
