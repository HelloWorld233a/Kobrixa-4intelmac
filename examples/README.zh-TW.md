# Kobrixa 範例

這 24 個程式均為 Kobrixa 原創範例，從只使用顯示器的安全入門程式，逐步進展到需要連接 EV3 硬體的程式。

<a href="./getting-started/">入門</a> · <a href="./display/">顯示</a> · <a href="./sound/">聲音</a> · <a href="./control-flow/">控制流程</a> · <a href="./language/">語言</a> · <a href="./program/">程式</a> · <a href="./projects/">專案</a> · <a href="./motors/">馬達</a> · <a href="./sensors/">感測器</a>

| 分類     | 範例                                                       | 學習內容                              | 硬體需求              |
| -------- | ---------------------------------------------------------- | ------------------------------------- | --------------------- |
| 入門     | [hello-ev3](getting-started/hello-ev3/)                    | 文字、線條、音調與等待                | 顯示器與喇叭          |
| 顯示     | [display-write](display/display-write/)                    | 使用 `LCD.Write` 顯示簡單黑色文字     | 顯示器                |
| 顯示     | [display-fonts](display/display-fonts/)                    | Tiny、Small 與 Big 三種字型           | 顯示器                |
| 顯示     | [display-shapes](display/display-shapes/)                  | 線條、同心圓與座標                    | 顯示器                |
| 聲音     | [speaker-scale](sound/speaker-scale/)                      | 以算術產生四個遞升音調                | 喇叭                  |
| 聲音     | [speaker-interrupt](sound/speaker-interrupt/)              | 提前停止長音調                        | 喇叭                  |
| 控制流程 | [control-flow](control-flow/control-flow/)                 | 變數、算術、`For` 與繪圖              | 顯示器與喇叭          |
| 控制流程 | [while-loop](control-flow/while-loop/)                     | 有限次數的 `While` 迴圈               | 顯示器                |
| 控制流程 | [if-elseif](control-flow/if-elseif/)                       | `If`／`ElseIf`／`Else`                | 顯示器與喇叭          |
| 控制流程 | [boolean-logic](control-flow/boolean-logic/)               | 布林值、`And` 與 `Not`                | 顯示器與喇叭          |
| 控制流程 | [comparison-operators](control-flow/comparison-operators/) | 括號、`>=`、`<>` 與複合條件           | 顯示器                |
| 控制流程 | [nested-control](control-flow/nested-control/)             | 在 `For` 中使用巢狀 `If`              | 顯示器                |
| 控制流程 | [labels-and-goto](control-flow/labels-and-goto/)           | Label、向前 `Goto` 與 relocation      | 顯示器與喇叭          |
| 語言     | [case-insensitive](language/case-insensitive/)             | 混合大小寫的關鍵字、變數與 API        | 顯示器                |
| 程式     | [program-end](program/program-end/)                        | 明確結束 EV3 程式                     | 顯示器                |
| 專案     | [include-settings](projects/include-settings/)             | 單一省略副檔名的 `Include` 與共用數值 | A、D 馬達須能安全轉動 |
| 專案     | [include-multiple](projects/include-multiple/)             | 多個專案相對 `.bpi` 檔案              | A 馬達須能安全轉動    |
| 馬達     | [motor-move](motors/motor-move/)                           | 阻塞式移動、等待與煞車                | A、D 馬達             |
| 馬達     | [motor-start-stop](motors/motor-start-stop/)               | 持續啟動馬達後安全停止                | A、D 馬達             |
| 馬達     | [motor-reverse](motors/motor-reverse/)                     | 負速度與反向移動                      | A 馬達                |
| 馬達     | [motor-sequence](motors/motor-sequence/)                   | 依序執行兩次阻塞式移動                | A、D 馬達             |
| 馬達     | [motor-counter](motors/motor-counter/)                     | 讀取馬達編碼器並以 `If` 分支          | A 馬達                |
| 感測器   | [sensor-threshold](sensors/sensor-threshold/)              | 等待、讀取百分比並選擇回饋            | 輸入埠 1 的觸碰感測器 |
| 感測器   | [sensor-sampling](sensors/sensor-sampling/)                | 在有限迴圈內重複取樣感測器            | 輸入埠 1 的觸碰感測器 |

每個分類現在都是 `examples/` 下的實體資料夾；上表每個連結都會開啟對應的專案資料夾。可在 Kobrixa 開啟專案目錄、`kobrixa.json` 或 `src/main.bp`。連接 EV3 前請先建置；第一次執行馬達範例時，請先架高機器人，確保輪子可安全轉動。

## 驗證狀態

語法與參數順序已逐項對照公開的 [CLEV3R English Help](https://github.com/iCheh/Clev3r-1/tree/main/Clever/bin/Release/Help/en)。範例現在使用 `LCD.Text(color, x, y, font, text)`、顏色在前的繪圖呼叫、`Motor.Move(ports, speed, degrees, brake)`、裸寫與舊式帶引號的兩種布林值、從 1 起算的感測器連接埠，以及省略副檔名的 `Include` 路徑。自動測試會解析所有範例、lowering 成 version 1 IR、驗證 IR，並產生結構有效的 `.rbf`；後端回歸測試也依 [LEGO EV3 Firmware Developer Kit](https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt469be1e11ad37696/5f880384f71916144453a49f/lego-mindstorms-ev3-firmware-developer-kit.pdf?locale=en-us)檢查整數 operand、感測器連接埠轉換，以及 `Motor.Move` 的阻塞行為。

因此目前可稱為已通過編譯器與 bytecode 驗證的 v1 candidate；USB／Wi-Fi 上傳及實機執行仍需在指定硬體上完成驗收，尚不宣稱已通過硬體認證。

主題分類參考公開的 CLEV3R 範例目錄（控制流程、函式、include、感測器、馬達、時間、圖形、聲音、檔案與 mailbox），但此處未納入任何 CLEV3R 程式碼、文件、素材或產生的輸出。使用者函式呼叫、檔案、mailbox、thread 與第三方感測器範例，會在編譯器／後端及相容性 fixture 完成後才加入；Kobrixa 不會提供只能解析、卻無法產生可執行 bytecode 的假範例。
