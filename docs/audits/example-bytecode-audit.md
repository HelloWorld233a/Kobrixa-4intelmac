# Example 字節碼邏輯稽核（2026-09-19）

實機後續結果與新增媒體修復請見 [實機報告](./hardware-verification-2026-09-19.md)。

## 修復後驗證

Checkpoint：`8ac27ec`，保留以下原始稽核結果與當時全部修改。

已修復 F1–F4：變數讀取保留已知型別、integer → number 賦值明確轉換、LCD 整數參數統一轉換、Sensor.ReadRaw 排除 DATA32_NAN（0x80000000），以及雙緩衝範例每幀重新停用自動更新。

全專案型別檢查及 63 個測試通過。全域 ESLint 尚有既有的 `apps/web/src/docs.tsx:391` 未使用 `DocumentCards` 錯誤，與字節碼修復無關。

重新建置後，**53 / 53 個 example 的預期檢查通過，mismatch 0**。另驗證 raw=-42 保留負值、raw=DATA32_NAN 清零，以及四幀只有四次螢幕更新。修復後 RBF 雜湊與逐項結果見 [修復後 JSON](./example-bytecode-fixed-results.json)。

下文保留修復前的發現作為歷史證據；重現指令在修復後版本應回傳 exit 0、mismatch 0 total 53。硬體與排程交錯的驗證界線仍適用。

## 修復前稽核

結論：**53 個 example 全部能編譯與解碼，但其中 19 個在代表性執行路徑上有可重現的邏輯錯誤。** 其餘 34 個在本次已檢查路徑未發現不一致；這不是實機認證，也不是所有輸入與執行緒交錯的正確性證明。

本次檢查的是目前工作目錄中的程式碼（包含既有未提交變更），重新建置 compiler、frontend、backend 後產生的 RBF。未修改 compiler、backend 或 example 原始碼；新增稽核工具與報告。

## 檢查方式與結果

- `node .corepack/v1/pnpm/10.15.0/bin/pnpm.cjs -r --filter=!@kobrixa/desktop build` 成功。桌面應用封裝不是這次字節碼驗證的必要步驟。
- `node .corepack/v1/pnpm/10.15.0/bin/pnpm.cjs -r test`：60 個既有測試通過，含遍歷全部 53 個 example 的測試。
- 另以韌體 `bytecodes.h` 的指令值及 `bytecodes.c` 的參數表，獨立解碼每個 RBF 的所有 object、subcall 描述、指令及參數，檢查相對跳躍是否落在指令邊界。
- 稽核用小型直譯器直接執行 RBF 位元組，依 DATA8 / DATA16 / DATA32 / DATAF 讀寫記憶體，模擬顯示、音效命令、陣列、函式呼叫與控制流程；不是執行 IR 來代替字節碼。
- 每個 example 有明確的預期輸出或指令參數檢查。感測器、馬達編碼器、按鈕另有代表性分支輸入。預期檢查目前以 exit code 1 回報 19 個不一致，這是發現缺陷的結果，不是稽核工具執行失敗。
- `eslint tools/audit-example-bytecode.mjs` 通過；工具內另用手寫 RBF 驗證「浮點搬移」與「整數轉浮點」的差異。

## 確認的缺陷

### F1 — 整數變數被升級為 number 後，賦值缺少整數到浮點轉換（高）

位置：[lower.ts](../../frontends/basic-plus/src/lower.ts#L462)、[ensureVariable](../../frontends/basic-plus/src/lower.ts#L694)、[backend assign](../../packages/backend-ev3/src/backend.ts#L750)。

讀取既有變數時，`lowerExpression(name)` 在沒有 expected type 的情況下傳入 `number`，`ensureVariable` 會把原本的 integer 升級成 number。backend 的 assign 隨後選 `MOVE_F_F`，但來源仍是整數立即值或存放整數結果的 temporary，因此只搬移位元而沒有數值轉換。

具體證據：`control-flow/if-elseif` 的 RBF 絕對 offset 28 為 `3f 02 60`，即 `MOVEF_F LC0(2), GV0`。它寫入的是 `0x00000002`，當作浮點數讀取約為 `2.8026e-45`，不是 `2.0`。後續的 `CP_EQF` 對 1.0 與 2.0 都為 false，所以顯示 **Other level** 而非 **Level two**。

相同機制導致：

- `comparison-operators` 顯示 A test failed。
- `control-flow` 迴圈多跑一輪，圓心 X 為 0、34、68、102、136，而非 34、68、102、136。
- `speaker-scale` 的 TONE 頻率參數為 0、110、220、330，而非 220、330、440、550。實體揚聲器對越界頻率的處理不在此模擬範圍。
- `byte-logic` 的 Hex 為 00 而非 05。
- 多個數字顯示為極小浮點數：Timer 120 被當成約 `1.68156e-43`；Byte 42 被當成約 `5.88545e-44`。螢幕字形呈現可能再受字型限制影響。
- `sensor-sampling` 在百分比 75 時仍走低值音效分支；`sensor-threshold` 在百分比 42 / 75 時仍顯示 Below threshold。

修正方向：避免「讀取」動作改變已知變數型別；必要的型別提升應統一處理所有定義與用途，並在 backend 的 integer → number 賦值中明確轉換。不能只調整文字格式化來掩蓋錯誤。

### F2 — LCD.Line 等 API 直接把浮點記憶體交給整數參數（高）

位置：[LCD.Line](../../packages/backend-ev3/src/backend.ts#L2446)。

`LCD.Circle` 已使用 integerParameter，但 `LCD.Line` 直接使用 `arg()`；當 y 為 number 時，UI_DRAW.LINE 所需的 DATA16 會讀到浮點位元的低 16 位，而非數值座標。

`nested-control` 的預期為 y=28、84 的兩條線與 y=56 的圓；目前可重現的線 Y 為 **28、0、0**，圓 Y 為 56。多出一輪與第一輪異常值涉及 F1；後續線落到 y=0 則涉及這個 API 參數轉換缺口。即使先修正 F1，浮點座標直接傳給 DATA16 的問題仍需要修正。

修正方向：依韌體 operand 型別統一執行 byte / word / integer / float 轉換，不要假設前端預期型別等於實際記憶體表示。

### F3 — Sensor.ReadRaw 的有效資料篩選方向相反（高）

位置：[Sensor.ReadRaw](../../packages/backend-ev3/src/backend.ts#L2935)。

目前產生 `CP_LT32 rawValue, -1000000000`，緊接 `JR_FALSE noData`。正常值 42 / 75 都不小於 -1000000000，因此跳到清零分支；非常大的負值卻進入數值轉換分支。

`raw-and-mode` 在正常 raw=42 時顯示 Raw channel 0: 0；`sensor-details` 同樣把 Raw 0 顯示成 0。前者 RBF offset 179 是比較，offset 191 是 JR_FALSE，跳到 offset 213 的 `MOVEF_F 0.0`，可以在解碼資料中直接核對。

修正方向：明確辨識韌體無效值並修正分支方向，加入正數、負數與無效值的回歸案例。

### F4 — 雙緩衝範例第一幀以後重新開啟自動更新（中）

位置：[LCD.Update / LCD.StopUpdate](../../packages/backend-ev3/src/backend.ts#L2324)、[double-buffer-animation](../../examples/display/double-buffer-animation/src/main.bp)。

範例僅在迴圈外呼叫一次 StopUpdate，而 backend 的 LCD.Update 會把共享旗標重設為 0；下一輪 Clear、FillCircle、Text 又各自更新。這與範例「每幀一起出現」的註解不一致。另有 F1 造成 5 幀與第一幀極小數值，不能把所有異常歸咎於同一原因。

修正方向：若 Update 的契約本來就恢復自動更新，範例每一幀都應重新呼叫 StopUpdate；若契約要持續停用，則修正 backend 並加入跨兩幀的測試。

## 尚需釐清的語意與模擬界線

- `vector-workbench` 呼叫 `Vector.Multiply(4, 2, 0, sorted, values)`：以目前 backend 的矩陣乘法實作，內積維度為 0，結果是長度 8 的全零陣列。字節碼忠實執行這組參數，但名稱 `doubled` 容易讓人以為是乘二。需確認教材意圖；此項不計入上述 19 個已確認的編譯結果不一致。
- `thread-mutex` 檢查了 worker object、共享記憶體、呼叫與一種順序執行路徑。Lock 是分開的 read / compare / write，沒有驗證所有排程交錯或互斥原子性，不能宣稱已證明執行緒安全。
- 按鈕、感測器、I2C、馬達、電池、計時等使用固定輸入；未連接 EV3、未操作馬達、未上傳或實體執行。媒體只核對路徑命令，沒有在硬體上解碼影像與播放音檔。
- 小型直譯器不模擬完整 scheduler、VM 錯誤/忙碌狀態、檔案系統錯誤或所有韌體細節。color / gyro 的無限迴圈在有限觀察後停止，狀態標為 bounded。34 個「未發現」只適用於所列路徑與檢查，不能解讀為硬體保證。
- 當前專案預設 deploy 目錄為 `/home/root/lms2012/prjs`；媒體路徑以此為準，其他自訂部署路徑不在本次核對內。

## 逐例結果

下表的「未發現」表示本次預期檢查通過。「錯誤」表示至少一項明確預期不符。完整 expected / actual、RBF SHA-256 與大小見 [JSON 結果](./example-bytecode-results.json)。

| Example                           | 結果   | 檢查／異常摘要                                                                                                                                 |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| buttons/button-feedback           | 未發現 | display text                                                                                                                                   |
| capstones/button-car              | 未發現 | display text                                                                                                                                   |
| capstones/obstacle-rover          | 未發現 | timeout delay count、pressed sensor delay count、stop mask                                                                                     |
| capstones/sensor-dashboard        | 錯誤   | display text: ['Sensor: 5.88545e-44']（預期 ['Sensor: 42']）                                                                                   |
| collections/row-vector            | 未發現 | display text                                                                                                                                   |
| collections/vector-workbench      | 未發現 | display text                                                                                                                                   |
| concurrency/thread-mutex          | 未發現 | worker LED、main text                                                                                                                          |
| control-flow/boolean-logic        | 未發現 | display text                                                                                                                                   |
| control-flow/break-and-continue   | 未發現 | display text                                                                                                                                   |
| control-flow/comparison-operators | 錯誤   | display text: ['A test failed']（預期 ['Both tests passed']）                                                                                  |
| control-flow/control-flow         | 錯誤   | circle X positions: [0, 34, 68, 102, 136]（預期 [34, 68, 102, 136]）；tone frequencies: [220, 330, 440, 550, 660]（預期 [330, 440, 550, 660]） |
| control-flow/if-elseif            | 錯誤   | display text: ['Other level']（預期 ['Level two']）                                                                                            |
| control-flow/labels-and-goto      | 未發現 | display text                                                                                                                                   |
| control-flow/nested-control       | 錯誤   | line Y positions: [28, 0, 0]（預期 [28, 84]）                                                                                                  |
| control-flow/while-loop           | 未發現 | circle X positions                                                                                                                             |
| display/display-fonts             | 未發現 | display text                                                                                                                                   |
| display/display-shapes            | 未發現 | circles、lines                                                                                                                                 |
| display/display-write             | 未發現 | display text                                                                                                                                   |
| display/double-buffer-animation   | 錯誤   | display text: ['Frame 1.4013e-45', 'Frame 1', 'Frame 2', 'Frame 3', 'Frame 4']（預期 ['Frame 1', 'Frame 2', 'Frame 3', 'Frame 4']）            |
| display/drawing-primitives        | 未發現 | drawing subcodes                                                                                                                               |
| files/binary-record               | 錯誤   | display text: ['Byte: 5.88545e-44']（預期 ['Byte: 42']）                                                                                       |
| files/file-round-trip             | 未發現 | display text                                                                                                                                   |
| getting-started/hello-ev3         | 未發現 | display text                                                                                                                                   |
| language/byte-logic               | 錯誤   | display text: ['13 AND 7 = 7.00649e-45', 'Hex: 00']（預期 ['13 AND 7 = 5', 'Hex: 05']）                                                        |
| language/case-insensitive         | 未發現 | circle X positions                                                                                                                             |
| language/local-functions          | 未發現 | display text                                                                                                                                   |
| language/text-and-math            | 錯誤   | display text: ['2^8 = 256', 'Characters: 1.26117e-44']（預期 ['2^8 = 256', 'Characters: 9']）                                                  |
| mailboxes/mailbox-local           | 未發現 | display text                                                                                                                                   |
| media/original-media              | 未發現 | bitmap path、sound path                                                                                                                        |
| motors/motor-counter              | 未發現 | positive branch、zero branch                                                                                                                   |
| motors/motor-move                 | 未發現 | motor step parameters、motor waits                                                                                                             |
| motors/motor-reverse              | 未發現 | motor step parameters、motor waits                                                                                                             |
| motors/motor-schedule             | 未發現 | motor step parameters、motor waits                                                                                                             |
| motors/motor-sequence             | 未發現 | motor step parameters、motor waits                                                                                                             |
| motors/motor-start-stop           | 未發現 | speed、brake                                                                                                                                   |
| motors/motor-steer-sync           | 未發現 | sync operands、wait count                                                                                                                      |
| program/brick-status              | 錯誤   | display text: ['AuditEV3', 'Battery: 1.05097e-43', 'Time: 1.4013e-42']（預期 ['AuditEV3', 'Battery: 75', 'Time: 1000']）                       |
| program/program-end               | 未發現 | display text                                                                                                                                   |
| projects/import-functions         | 未發現 | display text                                                                                                                                   |
| projects/import-module            | 未發現 | display text                                                                                                                                   |
| projects/include-multiple         | 未發現 | display text                                                                                                                                   |
| projects/include-settings         | 未發現 | display text                                                                                                                                   |
| sensors/color-sensor              | 錯誤   | first numeric sensor display: 5.885453550164232e-44（預期 42）                                                                                 |
| sensors/gyro-sensor               | 錯誤   | first numeric sensor display: 5.885453550164232e-44（預期 42）                                                                                 |
| sensors/i2c-registers             | 錯誤   | display text: ['I2C ID: 5.88545e-44']（預期 ['I2C ID: 42']）                                                                                   |
| sensors/raw-and-mode              | 錯誤   | display text: ['Raw channel 0: 0']（預期 ['Raw channel 0: 42']）                                                                               |
| sensors/sensor-details            | 錯誤   | display text: ['EV3-COLOR', 'Type/mode: 4.06377e-44/0', 'Raw 0: 0']（預期 ['EV3-COLOR', 'Type/mode: 29/0', 'Raw 0: 42']）                      |
| sensors/sensor-sampling           | 錯誤   | high-sensor tones: [330, 330, 330, 330]（預期 [880, 880, 880, 880]）                                                                           |
| sensors/sensor-threshold          | 錯誤   | display text: ['Below threshold']（預期 ['Threshold is clear']）                                                                               |
| sound/speaker-interrupt           | 未發現 | sound command sequence、tones                                                                                                                  |
| sound/speaker-melody              | 未發現 | tone frequencies、wait count                                                                                                                   |
| sound/speaker-scale               | 錯誤   | tone frequencies: [0, 110, 220, 330]（預期 [220, 330, 440, 550]）                                                                              |
| time/timer-slots                  | 錯誤   | display text: ['Timer 1: 1.68156e-43']（預期 ['Timer 1: 120']）                                                                                |

## 重現

工具：[字節碼解碼與執行](../../tools/audit-example-bytecode.mjs)、[逐例預期檢查](../../tools/audit-example-expectations.py)。指令在 repository root 執行。

```sh
node .corepack/v1/pnpm/10.15.0/bin/pnpm.cjs -r --filter=!@kobrixa/desktop build
curl -sSL -o /tmp/kobrixa-bytecodes.h https://raw.githubusercontent.com/mindboards/ev3sources/master/lms2012/lms2012/source/bytecodes.h
curl -sSL -o /tmp/kobrixa-bytecodes.c https://raw.githubusercontent.com/mindboards/ev3sources/master/lms2012/lms2012/source/bytecodes.c
node tools/audit-example-bytecode.mjs /tmp/kobrixa-bytecodes.h /tmp/kobrixa-bytecodes.c /tmp/kobrixa-example-audit
python3 tools/audit-example-expectations.py /tmp/kobrixa-example-audit
```

最後一個指令目前預期 exit 1，輸出 mismatch 19 total 53。輸出目錄保留每個 RBF、IR、獨立解碼與模擬 trace；每次執行會覆寫該目錄的同名產物。

韌體依據：[指令值](https://github.com/mindboards/ev3sources/blob/master/lms2012/lms2012/source/bytecodes.h)、[參數表](https://github.com/mindboards/ev3sources/blob/master/lms2012/lms2012/source/bytecodes.c)、[PrimParPointer / 字串格式化實作](https://github.com/mindboards/ev3sources/blob/master/lms2012/lms2012/source/lms2012.c)、[Mailbox TEST BUSY 語意](https://github.com/mindboards/ev3sources/blob/master/lms2012/c_com/source/c_com.c)、[檔案讀寫語意](https://github.com/mindboards/ev3sources/blob/master/lms2012/c_memory/source/c_memory.c)。這些是 LEGO EV3 原始韌體的公開來源；未將韌體來源檔加入 repository。

本次下載的定義檔 SHA-256：

- bytecodes.h: `1926923d544a3f0609db4fd500c49e19667885c37a7d821ccf733667a3a30083`
- bytecodes.c: `e06510ad0cbbc74d522442a8412a9d2ee45fca206be7441692461dfaddea91ce`

共解碼 1265 個指令位置。基準情境與額外情境合計 75 次有限執行。
