# Kobrixa 範例

這 53 個程式均為 Kobrixa 原創範例，從只使用顯示器的安全入門程式，逐步進展到需要連接 EV3 硬體的程式。

<a href="./getting-started/">入門</a> · <a href="./capstones/">整合專題</a> · <a href="./display/">顯示</a> · <a href="./sound/">聲音</a> · <a href="./media/">媒體</a> · <a href="./time/">時間</a> · <a href="./buttons/">按鍵</a> · <a href="./control-flow/">控制流程</a> · <a href="./language/">語言</a> · <a href="./collections/">集合</a> · <a href="./concurrency/">並行</a> · <a href="./files/">檔案</a> · <a href="./mailboxes/">信箱</a> · <a href="./program/">程式</a> · <a href="./projects/">專案</a> · <a href="./motors/">馬達</a> · <a href="./sensors/">感測器</a>

| 分類     | 範例                                                       | 學習內容                              | 硬體需求                |
| -------- | ---------------------------------------------------------- | ------------------------------------- | ----------------------- |
| 入門     | [hello-ev3](getting-started/hello-ev3/)                    | 文字、線條、音調與等待                | 顯示器與喇叭            |
| 顯示     | [display-write](display/display-write/)                    | 使用 `LCD.Write` 顯示簡單黑色文字     | 顯示器                  |
| 顯示     | [display-fonts](display/display-fonts/)                    | Tiny、Small 與 Big 三種字型           | 顯示器                  |
| 顯示     | [display-shapes](display/display-shapes/)                  | 線條、同心圓與座標                    | 顯示器                  |
| 聲音     | [speaker-scale](sound/speaker-scale/)                      | 以算術產生四個遞升音調                | 喇叭                    |
| 聲音     | [speaker-interrupt](sound/speaker-interrupt/)              | 提前停止長音調                        | 喇叭                    |
| 聲音     | [speaker-melody](sound/speaker-melody/)                    | 具名音符與 `Speaker.Wait`             | 喇叭                    |
| 按鍵     | [button-feedback](buttons/button-feedback/)                | 清除、等待並辨識按鍵                  | EV3 本體按鍵            |
| 控制流程 | [control-flow](control-flow/control-flow/)                 | 變數、算術、`For` 與繪圖              | 顯示器與喇叭            |
| 控制流程 | [while-loop](control-flow/while-loop/)                     | 有限次數的 `While` 迴圈               | 顯示器                  |
| 控制流程 | [if-elseif](control-flow/if-elseif/)                       | `If`／`ElseIf`／`Else`                | 顯示器與喇叭            |
| 控制流程 | [boolean-logic](control-flow/boolean-logic/)               | 布林值、`And` 與 `Not`                | 顯示器與喇叭            |
| 控制流程 | [comparison-operators](control-flow/comparison-operators/) | 括號、`>=`、`<>` 與複合條件           | 顯示器                  |
| 控制流程 | [nested-control](control-flow/nested-control/)             | 在 `For` 中使用巢狀 `If`              | 顯示器                  |
| 控制流程 | [labels-and-goto](control-flow/labels-and-goto/)           | Label、向前 `Goto` 與 relocation      | 顯示器與喇叭            |
| 控制流程 | [break-and-continue](control-flow/break-and-continue/)     | 提早結束或略過迴圈迭代                | 顯示器                  |
| 語言     | [case-insensitive](language/case-insensitive/)             | 混合大小寫的關鍵字、變數與 API        | 顯示器                  |
| 語言     | [text-and-math](language/text-and-math/)                   | 文字組合與數學函式                    | 顯示器                  |
| 語言     | [byte-logic](language/byte-logic/)                         | 位元遮罩與十六進位格式化              | 顯示器                  |
| 集合     | [row-vector](collections/row-vector/)                      | 固定 Row 與數字 Vector                | 顯示器                  |
| 並行     | [thread-mutex](concurrency/thread-mutex/)                  | 背景 Sub、mutex 與讓出執行權          | 顯示器與 LED            |
| 檔案     | [file-round-trip](files/file-round-trip/)                  | 寫入並讀取 EV3 專案檔案               | 顯示器；會寫入 EV3 檔案 |
| 信箱     | [mailbox-local](mailboxes/mailbox-local/)                  | 建立具名收件匣並輪詢                  | 可選第二台 EV3          |
| 程式     | [program-end](program/program-end/)                        | 明確結束 EV3 程式                     | 顯示器                  |
| 程式     | [brick-status](program/brick-status/)                      | 主機名稱、電池、時間與 LED            | 顯示器與 EV3 本體       |
| 專案     | [include-settings](projects/include-settings/)             | 單一省略副檔名的 `Include` 與共用數值 | A、D 馬達須能安全轉動   |
| 專案     | [include-multiple](projects/include-multiple/)             | 多個專案相對 `.bpi` 檔案              | A 馬達須能安全轉動      |
| 專案     | [import-functions](projects/import-functions/)             | 匯入 `.bpm` Function 回傳值           | 顯示器                  |
| 馬達     | [motor-move](motors/motor-move/)                           | 阻塞式移動、等待與煞車                | A、D 馬達               |
| 馬達     | [motor-start-stop](motors/motor-start-stop/)               | 持續啟動馬達後安全停止                | A、D 馬達               |
| 馬達     | [motor-reverse](motors/motor-reverse/)                     | 負速度與反向移動                      | A 馬達                  |
| 馬達     | [motor-sequence](motors/motor-sequence/)                   | 依序執行兩次阻塞式移動                | A、D 馬達               |
| 馬達     | [motor-counter](motors/motor-counter/)                     | 讀取馬達編碼器並以 `If` 分支          | A 馬達                  |
| 馬達     | [motor-steer-sync](motors/motor-steer-sync/)               | 協調轉向與同步移動                    | A、D 馬達               |
| 感測器   | [sensor-threshold](sensors/sensor-threshold/)              | 等待、讀取百分比並選擇回饋            | 輸入埠 1 的觸碰感測器   |
| 感測器   | [sensor-sampling](sensors/sensor-sampling/)                | 在有限迴圈內重複取樣感測器            | 輸入埠 1 的觸碰感測器   |
| 感測器   | [color-sensor](sensors/color-sensor/)                      | 在 Color 模式讀取辨識到的顏色代號     | 輸入埠 1 的顏色感測器   |
| 感測器   | [gyro-sensor](sensors/gyro-sensor/)                        | 在 Angle 模式讀取旋轉角度             | 輸入埠 1 的陀螺儀       |
| 感測器   | [sensor-details](sensors/sensor-details/)                  | 感測器身分、模式與原始讀值            | 輸入埠 1 的感測器       |

每個分類現在都是 `examples/` 下的實體資料夾；上表每個連結都會開啟對應的專案資料夾。可在 Kobrixa 開啟專案目錄、`kobrixa.json` 或 `src/main.bp`。連接 EV3 前請先建置；第一次執行馬達範例時，請先架高機器人，確保輪子可安全轉動。

## 延伸課程

- [button-car](capstones/button-car/)、[sensor-dashboard](capstones/sensor-dashboard/)、[obstacle-rover](capstones/obstacle-rover/)
- [drawing-primitives](display/drawing-primitives/)、[double-buffer-animation](display/double-buffer-animation/)、[timer-slots](time/timer-slots/)、[original-media](media/original-media/)
- [local-functions](language/local-functions/)、[vector-workbench](collections/vector-workbench/)、[binary-record](files/binary-record/)、[import-module](projects/import-module/)
- [motor-schedule](motors/motor-schedule/)、[raw-and-mode](sensors/raw-and-mode/)、[i2c-registers](sensors/i2c-registers/)

完整教材地圖請見[核心 API 覆蓋](API-COVERAGE.md)，建議的上課順序請見[學習路徑](LEARNING-PATH.md)。

## 驗證狀態

語法與參數順序已逐項對照公開的 [CLEV3R English Help](https://github.com/iCheh/Clev3r-1/tree/main/Clever/bin/Release/Help/en)。範例現在使用 `LCD.Text(color, x, y, font, text)`、顏色在前的繪圖呼叫、`Motor.Move(ports, speed, degrees, brake)`、裸寫與舊式帶引號的兩種布林值、從 1 起算的感測器連接埠，以及省略副檔名的 `Include` 路徑。自動測試會解析所有範例、lowering 成 version 1 IR、驗證 IR，並產生結構有效的 `.rbf`；後端回歸測試也依 [LEGO EV3 Firmware Developer Kit](https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt469be1e11ad37696/5f880384f71916144453a49f/lego-mindstorms-ev3-firmware-developer-kit.pdf?locale=en-us)檢查整數 operand、感測器連接埠轉換，以及 `Motor.Move` 的阻塞行為。

因此目前可稱為已通過編譯器與 bytecode 驗證的 v1 candidate；USB／Wi-Fi 上傳及實機執行仍需在指定硬體上完成驗收，尚不宣稱已通過硬體認證。

主題分類參考公開的 CLEV3R 範例目錄（控制流程、函式、include、感測器、馬達、時間、圖形、聲音、檔案、mailbox 與 thread），但此處未納入任何 CLEV3R 程式碼、文件、素材或產生的輸出。每個隨附範例都會經過解析、lowering、IR 驗證及原生 bytecode 編譯；裝置間 mailbox 傳遞與實機驗收仍是另外的執行期檢查。
