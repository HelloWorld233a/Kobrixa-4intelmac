# Expanded examples bytecode audit — 2026-09-20

Scope: only the **61 newly added projects**. The original 53 examples and their historical results were not re-audited or changed.／範圍僅 **61 個新增專案**；未重新稽核或修改既有 53 個範例及其歷史結果。

| Batch                                                                                    | Projects | Executions | Explicit assertions | Mismatches |
| ---------------------------------------------------------------------------------------- | -------: | ---------: | ------------------: | ---------: |
| [Clev3r topic expansion](clev3r-parity-bytecode-2026-09-20.json)                         |       41 |         54 |                 179 |          0 |
| [First new batch, rechecked with current compiler](new-examples-recheck-2026-09-20.json) |       20 |         33 |                 107 |          0 |
| Total                                                                                    |       61 |         87 |                 286 |          0 |

The [curriculum matrix](../../examples/CLEV3R-PARITY.md) maps all 41 reference main programs and eight helper/media roles. [API coverage](../../examples/CLEV3R-API-COVERAGE.md) checks all 122 reference API names against compiled IR from the 61 new projects. Presence of an API is distinguished from the execution assertions recorded above.／課程表完整對照 41 主程式與 8 個輔助檔／素材角色，API 檢查則比對新專案編譯 IR 與 122 個參考 API；API 出現與上表的行為驗證是不同檢查。

## Method / 方法

The auditor compiles the new sources, independently decodes emitted RBF using pinned firmware opcode/parameter tables, validates branch destinations and native CALL descriptors, and executes bytecode with memory/array bounds checks. Expected values live in separate JSON manifests. Missing projects, missing scenarios, unsupported instructions, bounded execution and mismatches fail the audit. Reports retain source and RBF SHA-256 hashes.／稽核先編譯新增原始碼，再依固定韌體指令表獨立解碼 RBF，驗證分支／呼叫及記憶體／陣列存取後執行位元組。預期值獨立存於 JSON；缺漏、未支援指令、超限或結果不符都會失敗，結果保留原始碼及 RBF 雜湊。

Models cover numeric storage/conversion, strings, arrays, files, virtual time, buttons, raw sensors, I²C requests/replies, motors, audio, and mailbox payloads. Threads execute with 1/2/7/11 instruction scheduling quanta; shared counters must remain seven, complete two workers, switch contexts and contend for the shared subcall. Hardware input is deterministic.／模型涵蓋數值型別、字串、陣列、檔案、虛擬時間、按鍵、感測器、I²C、馬達、聲音及信箱資料。執行緒以 1／2／7／11 指令切換；共享計數器必須仍為 7、兩個工作完成、發生切換及子呼叫競爭。硬體輸入採固定資料。

Literal native images separately check float bit interpretation versus numeric conversion, narrowing saturation/NaN propagation, degree-based native sine, and rejection of a busy SUBCALL calling itself. Compiler regressions execute 32 recursive frames, explicit overflow at the next frame, and mutually recursive functions. These regression fixtures are additional to the 87 curriculum executions.／另以手寫原生位元組驗證浮點位元與轉換、縮窄飽和／NaN、原生角度制正弦，以及拒絕忙碌子呼叫重入；編譯器案例驗證 32 層、下一層超限與相互遞迴，另計於課程 87 次執行之外。

Desktop tests also use the actual BuildSession to commit all 41 counterparts' RBF/IR/listings/assets and check Folder deployment metadata. The first 20 new lessons have a separate compiler/documentation test.／桌面測試亦經由真正 BuildSession 輸出 41 個對照專案的 RBF／IR／listing／素材並檢查 Folder 部署資料；首批 20 個另有編譯與文件測試。

## Bugs found and corrected / 發現並修正

- Byte text parsing had a reversed NUL branch and an absolute buffer-offset limit. Parsing now consumes the full text.／Byte 文字解析的 NUL 分支與緩衝區上限錯誤已修正。
- EV3 signed-byte numeric conversions saturate and reserve -128 as NaN. Byte operations, I²C and file reads/writes now preserve unsigned 0–255 by copying raw low bytes into zero-filled integers. Tests include 128, 175 and 255.／修正有號轉換造成 128–255 遺失或變成 NaN；以原始低位元組保留完整範圍。
- Computed motor distances were passed as float bits to integer operands. Distances, speed and timing now convert to the required integer representation.／計算出的馬達距離原本錯用浮點位元，已轉成原生整數參數。
- Basic Plus trigonometry is in radians; EV3 native trig uses degrees. Forward and inverse conversions now occur at the bytecode boundary.／補正弧度與 EV3 度數轉換。
- Native EV3 functions have one active frame and cannot recurse directly. Recursive call groups now expand to distinct objects for 32 frames, with an explicit error and stop on overflow.／遞迴使用獨立原生物件保存 32 層，超限顯示錯誤並停止。
- Mutex acquisition previously read/tested/wrote shared state across interruptible instructions. A shared SUBCALL now serializes acquisition.／互斥鎖取得改由共用子呼叫序列化，避免讀取與寫入間被切換導致兩邊同時取得鎖。
- Folder was discarded. Entry Folder now reaches IR, file/media resolution, build results and the UI upload/run/delete path. SD uses the firmware's `prjs/SD_Card` mount.／Folder 不再被忽略，會傳到 IR、檔案／媒體路徑、建置資料及介面部署路徑；SD 使用韌體掛載點。
- Random integer results now widen from the actual native 16-bit output.／隨機數以原生 16-bit 結果正確擴寬。

The first batch's earlier division/return typing and text-search fixes remain verified by its recheck. Its [original report](new-examples-bytecode-2026-09-20.md) is retained as a historical snapshot.／首批的除法／回傳型別、文字搜尋修正亦通過重驗，原報告保留為歷史記錄。

## Validation / 檢查

- Both bytecode batches: 61 projects, 87 executions, 286 expectations, zero mismatches.／兩批共 61 專案、87 次執行、286 項預期、零不符。
- Reference coverage: 41/41 programs, 8/8 helper/media mappings, 122/122 API names.／參考覆蓋全部通過。
- Frontend/backend/recursion tests, desktop build/deployment tests, and audit comparator tests passed. TypeScript builds/checks and ESLint passed for changed code. Old-example execution tests were not run.／前後端、遞迴、桌面建置部署及比較器測試通過；型別檢查與變更程式碼 lint 通過，未執行舊範例測試。

## Firmware evidence / 韌體依據

The [opcode header](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/lms2012/source/bytecodes.h) defines operands and the SD mount. Numeric conversion behavior was checked against [c_move.c](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/lms2012/source/c_move.c), trig units against [c_math.c](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/lms2012/source/c_math.c), and busy SUBCALL behavior against [lms2012.c](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/lms2012/source/lms2012.c).

I²C transactions were checked against [c_input.c](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/c_input/source/c_input.c) and [d_iic.c](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/d_iic/Linuxmod_AM1808/d_iic.c). File delimiters follow [c_memory.c](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/c_memory/source/c_memory.c); BEGIN_DOWNLOAD creates parent directories in [c_com.c](https://github.com/mindboards/ev3sources/blob/78ebaf5b6f8fe31cc17aa5dce0f8e4916a4fc072/lms2012/c_com/source/c_com.c). The two-byte compass register interpretation also matches the [driver author's documentation](https://botbench.com/driversuite/hitechnic-compass_8h_source.html). These sources informed the audit; implementation code was not copied.

## Limits and reproduction / 限制與重跑

Follow the commands in [CLEV3R-PARITY.md](../../examples/CLEV3R-PARITY.md). The checked JSON files are reproducible verification records; raw RBF/disassembly/traces are generated in the chosen output directory and are not source-controlled.／重跑方式見課程文件；JSON 是可重現的驗證記錄，原始 RBF／解碼／軌跡輸出到指定目錄，不加入版本控制。

This is bytecode logic verification, not physical EV3 acceptance. The models do not certify actual motor motion, sensor calibration, timing performance, SD insertion, Bluetooth delivery, or every possible thread interleaving. The recursive implementation has a documented 32-frame limit.／本次為字節碼邏輯驗證，未完成 EV3 實機驗收；不保證實際馬達運動、感測器校正、效能、SD 插入、藍牙交付或所有執行緒交錯。遞迴有明確 32 層限制。
