# 新增 examples 字節碼稽核（2026-09-20）

**20 / 20 個新專案通過：33 組執行情境、107 項明確預期檢查、0 項不符。** 此次未重跑或修改既有 53 個 examples 的結果；未進行實機上傳與執行。

English: All 20 new projects pass 33 deterministic bytecode runs and 107 assertions. Historical examples are excluded. No physical EV3 execution was performed.

範例、硬體需求、雙語說明與重現指令見[新課程索引](../../examples/NEW-EXAMPLES.md)。逐項 expected / actual、來源雜湊與 RBF SHA-256 見[機器可讀結果](new-examples-bytecode-2026-09-20.json)。

## 驗證方式

1. 重新建置 compiler、IR、Basic Plus frontend 與 EV3 backend，只選取 [new-examples.json](../../examples/new-examples.json) 的 20 個專案。
2. 檢查 project / frontend / backend diagnostics 為空、IR 合法，並產生每個新專案的 `.rbf`。
3. 依固定版本的 EV3 韌體 opcode 與 operand 表獨立解碼全部 object，確認指令邊界、相對跳躍目標及 CALL 的 object 與參數數量。
4. 從 RBF 位元組執行控制流程與 DATA8 / DATA16 / DATA32 / DATAF 記憶體操作，檢查輸出與明確的教材預期；不以 IR 執行代替字節碼驗證。超出步數限制或模擬器不支援的指令均視為失敗。
5. 驗證光線輸入 0、29、30、69、70、100；固定及變動五次取樣；無按鍵、左鍵、右鍵、左右同時按下。額外檢查檔案內容 `00 2a 7f`、Row 釋放、單次畫面更新、馬達先設定功率再啟動／等待／煞車、音效播放／等待／停止順序。

工具：[位元組解碼與有限執行](../../tools/audit-example-bytecode.mjs)、[新範例稽核入口](../../tools/audit-new-examples.mjs)、[獨立預期比較](../../tools/check-new-example-results.mjs)。入口會自動重新建置所需套件，避免驗證過期的編譯器產物。

## 新範例揭露並修復的問題

| 問題                                                         | 修復前可觀察結果                                            | 修復及回歸證據                                                                                                                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 整數運算元的除法使用整數指令，結果卻存入浮點變數             | `7 / 2` 顯示 `4.2039e-45`                                   | 依結果型別選擇浮點指令並轉換運算元；`compound-arithmetic` 顯示 `3.5`，另有 backend 指令回歸測試。                                                                                                 |
| 函式只從第一個 Return 推論型別，且非字串回傳值一律以浮點寫入 | 校正 `42.5` 顯示 `1110050000`，上界 `100` 顯示 `1120400000` | 合併所有數值回傳分支，回傳寫入符合整數／布林／浮點參數表示；`import-calibration` 驗證 0、42.5、100，`function-outputs` 驗證整數 7、布林與混合輸出參數。新增不相容回傳型別的 `BP2010` 診斷與測試。 |
| 字串比較的相等分支反向                                       | 冒號位置為 1；找不到的 `!` 也為 1                           | 韌體字串相等結果是 1，改用 `JR_TRUE`；`text-search` 驗證位置 4、找不到為 0、前綴與後綴匹配。                                                                                                      |
| 截取字串多複製下一個字元且未終止                             | 三字元前綴輸出 `EV3:`                                       | 僅複製所需字元並明確寫入 NUL；驗證 `EV3`、尾端截斷 `dy`、越界與零起點回傳空字串。                                                                                                                 |

These fixes address defects exposed by the new lessons: integer division stored as float bits, inconsistent function return representations, inverted string-search branching, and missing substring termination. Compiler regression tests include valid and invalid cases.

## 逐例結果

| 新專案                                                                               | RBF bytes | 解碼指令數 | 執行情境 | 結果 |
| ------------------------------------------------------------------------------------ | --------: | ---------: | -------: | ---- |
| [algorithms/euclidean-gcd](../../examples/algorithms/euclidean-gcd/)                 |       300 |         42 |        1 | 通過 |
| [algorithms/fibonacci-sequence](../../examples/algorithms/fibonacci-sequence/)       |       191 |         30 |        1 | 通過 |
| [algorithms/prime-count](../../examples/algorithms/prime-count/)                     |       339 |         56 |        1 | 通過 |
| [algorithms/insertion-sort](../../examples/algorithms/insertion-sort/)               |       411 |         69 |        1 | 通過 |
| [control-flow/for-step-boundaries](../../examples/control-flow/for-step-boundaries/) |       429 |         71 |        1 | 通過 |
| [control-flow/nested-loop-exits](../../examples/control-flow/nested-loop-exits/)     |       322 |         54 |        1 | 通過 |
| [language/compound-arithmetic](../../examples/language/compound-arithmetic/)         |       285 |         38 |        1 | 通過 |
| [language/function-outputs](../../examples/language/function-outputs/)               |       424 |         55 |        1 | 通過 |
| [language/text-search](../../examples/language/text-search/)                         |      2150 |        265 |        1 | 通過 |
| [collections/row-statistics](../../examples/collections/row-statistics/)             |       436 |         67 |        1 | 通過 |
| [collections/matrix-product](../../examples/collections/matrix-product/)             |       616 |         83 |        1 | 通過 |
| [files/byte-sequence](../../examples/files/byte-sequence/)                           |       525 |         52 |        1 | 通過 |
| [time/finite-countdown](../../examples/time/finite-countdown/)                       |       249 |         38 |        1 | 通過 |
| [display/fractional-coordinates](../../examples/display/fractional-coordinates/)     |       268 |         45 |        1 | 通過 |
| [sound/computed-arpeggio](../../examples/sound/computed-arpeggio/)                   |        98 |         16 |        1 | 通過 |
| [sensors/three-zone-light](../../examples/sensors/three-zone-light/)                 |       194 |         33 |        7 | 通過 |
| [sensors/five-sample-average](../../examples/sensors/five-sample-average/)           |       222 |         36 |        4 | 通過 |
| [motors/power-ramp](../../examples/motors/power-ramp/)                               |        97 |         16 |        1 | 通過 |
| [buttons/button-choice](../../examples/buttons/button-choice/)                       |       150 |         24 |        5 | 通過 |
| [projects/import-calibration](../../examples/projects/import-calibration/)           |       317 |         44 |        1 | 通過 |

合計解碼 **1134** 個指令位置。每例包含正常結束檢查，不以已有部分輸出掩蓋錯誤或超限。

## 韌體依據與界線

驗收檢查：frontend 17 項、backend 16 項、新範例編譯與文件 1 項、預期比較器 3 項測試均通過；受影響套件與桌面型別檢查、修改檔案的 ESLint／Prettier、文件本機連結及 `git diff --check` 均通過。桌面 examples 測試僅選取新範例案例，其餘 3 項未執行。

指令定義固定於 [mindboards/ev3sources commit 78ebaf5](https://github.com/mindboards/ev3sources/tree/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072)。參考 [bytecodes.h](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/lms2012/source/bytecodes.h)、[bytecodes.c](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/lms2012/source/bytecodes.c)、[字串比較實作](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/lms2012/source/lms2012.c#L3918)、[浮點至整數轉換](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/lms2012/source/c_move.c#L455)。未將韌體來源加入此 repository。

- `bytecodes.h` SHA-256：`1926923d544a3f0609db4fd500c49e19667885c37a7d821ccf733667a3a30083`
- `bytecodes.c` SHA-256：`e06510ad0cbbc74d522442a8412a9d2ee45fca206be7441692461dfaddea91ce`

模擬器只涵蓋本批使用的正常數值範圍與已實作指令，不是完整 EV3 VM。按鍵與感測器輸入、時間、馬達、音效及檔案系統使用可重現模型。`Elapsed: 750` 是模型中的延遲總和，實機包含其他執行成本。馬達指令正確不代表低功率必定能帶動馬達；沒有測量機械運動、光線校正、音訊波形或實體畫面。執行緒交錯、檔案錯誤、溢位／NaN 等模型未涵蓋的輸入不屬於本次保證。

The result establishes correctness for the listed bytecode paths and inputs, not full firmware equivalence or hardware certification. Timing overhead, mechanical behavior, audio output, physical rendering, concurrency and error conditions require separate validation.
