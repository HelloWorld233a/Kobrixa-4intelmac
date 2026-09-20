# Core EV3 API coverage / 核心 EV3 API 覆蓋

This is the teaching map for the native EV3 profile. The linked examples are executable; APIs in the same row are taught together so students can progress from one small program to a complete behavior.／這是原生 EV3 profile 的教材地圖。連結的範例皆可執行；同列 API 會一起教學，讓學生從小程式逐步組合成完整行為。

| Area / 領域                      | APIs taught / 教授 API                                                                                                                                                                | Executable lessons / 可執行課程                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Display / 顯示                   | `Clear`, `Pixel`, `Text`, `Write`, `Line`, `Circle`, `Rect`, `FillRect`, `InverseRect`, `FillCircle`, `StopUpdate`, `Update`, `BmpFile`                                               | [display](display/), [original-media](media/original-media/)                             |
| Sound / 聲音                     | `Tone`, `Note`, `Play`, `Stop`, `IsBusy`, `Wait`                                                                                                                                      | [sound](sound/), [original-media](media/original-media/)                                 |
| Buttons / 按鍵                   | `Wait`, `Flush`, `GetClicks`, `Current`, `IsPressed`                                                                                                                                  | [button-feedback](buttons/button-feedback/), [button-car](capstones/button-car/)         |
| Motors / 馬達                    | `Start`, `StartPower`, `StartSteer`, `StartSync`, `Move`, `MovePower`, `MoveSteer`, `MoveSync`, `Schedule*`, `Stop`, `Wait`, `IsBusy`, `Invert`, `GetCount`, `GetSpeed`, `ResetCount` | [motors](motors/), [capstones](capstones/)                                               |
| Sensors / 感測器                 | `Wait`, `SetMode`, `ReadPercent`, `ReadRaw`, `ReadRawValue`, `GetName`, `GetType`, `GetMode`, `IsBusy`, `ReadI2C*`, `WriteI2C*`, `CommunicateI2C`, `SendUARTData`                     | [sensors](sensors/)                                                                      |
| Language / 語言                  | variables, arrays, `For`, `While`, `If`, `Goto`, `Break`, `Continue`, `Function`, `Sub`, `Include`, `Import`, `Text.*`, `Math.*`, `Byte.*`                                            | [language](language/), [control flow](control-flow/), [projects](projects/)              |
| Data and files / 資料與檔案      | `Row.*`, `Vector.*`, `EV3File` text, byte, number-array and lookup operations                                                                                                         | [collections](collections/), [files](files/)                                             |
| Brick and runtime / 本體與執行期 | `EV3.Time`, battery values, LED, timers 1–9, `Program.Delay`, `Program.End`, `Thread.*`, local mailbox polling                                                                        | [program](program/), [time](time/), [concurrency](concurrency/), [mailboxes](mailboxes/) |

## Deliberate boundaries / 明確界線

HiTechnic devices, Daisy-chain, and cross-brick mailbox exchange need a separate device matrix and are not certified by this core course. I²C is retained only as an advanced, documented-device lesson.／HiTechnic 裝置、Daisy-chain 與跨本體 mailbox 通訊需要獨立裝置矩陣，因此不在本核心課程的認證範圍內。I²C 僅保留為使用已文件化裝置的進階課程。

## Additional semantic coverage / 新增語意覆蓋

See [new lessons](NEW-EXAMPLES.md) for GCD, Fibonacci, prime counting, insertion sort, negative and empty loop ranges, nested exits, typed output parameters, fractional division, imported clamping, text search/slicing, Row statistics, a nonzero 2×2 matrix product, sequential byte I/O, elapsed-time arithmetic, fractional drawing operands, computed tones, button combinations, sensor thresholds/averaging, and bounded power commands.／[新課程](NEW-EXAMPLES.md)包含最大公因數、費氏數列、質數計數、插入排序、負步長與空範圍、巢狀跳出、輸出參數、小數除法、匯入限制函式、文字搜尋擷取、Row 統計、非零 2×2 矩陣乘法、位元組循序讀寫、時間差、小數繪圖參數、計算音高、按鍵組合、感測門檻與平均，以及有限次功率命令。

## Expanded curriculum / 擴充課程

See [Clev3r curriculum parity](CLEV3R-PARITY.md): 41 further projects cover every reference main program and helper/media role. Together with the first 20 lessons, 61 new projects cover all 122 reference API names. Original 53-example results remain outside the audit.／另 41 個新專案完整對照參考主程式、輔助檔與素材角色；加上首批 20 個，共 61 個新專案涵蓋 122 個參考 API。原有 53 個範例結果不在稽核範圍。
