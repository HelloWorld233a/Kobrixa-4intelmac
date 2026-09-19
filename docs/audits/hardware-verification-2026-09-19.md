# EV3 實機驗證 — 2026-09-19

設備：USB EV3，序號 001653818105，韌體 LMS2012 V1.09H（2015-12-03）。初始感測器為輸入埠 2 的 GYRO-ANG（type 32，mode 0）；後續完整配置見下節。使用者確認 A–D 都是馬達、輪子已架空；後續說明 D 有限位器，僅授權從當時位置反轉 90°。

**目前 53 個範例都有實機執行／適配診斷紀錄：37 個原始未修改 RBF 正常結束，16 個採用適配或診斷尾段。這不代表全部硬體認證通過。**

完整逐例狀態在 [53 列驗收矩陣](../../examples/HARDWARE-ACCEPTANCE.md)，機器可讀版本為 [JSON](./hardware-acceptance-matrix-2026-09-19.json)。

## 初始 27 項診斷通過紀錄

- 16 個原範例的數值／控制流程診斷：包含整數條件、For/While、Break/Continue、Byte.Hex、字串與 Math、local/import functions、動畫迴圈、音階、計時器、磚塊資訊與 Row。讀回值包括 Hex=05、power=256、length=9、result=42、steps=360、elapsed=120ms、middle=20、battery=100。[原始結果](./hardware-2026-09-19.json)
- 2 個檔案往返測例：二進位讀回 42，文字讀回 Hello from Kobrixa。[結果](./hardware-files-media-2026-09-19.json)
- 媒體範例修復後能到達 Speaker.Wait 後的結尾；另外的階段診斷讀回 stage=6。[階段結果](./hardware-media-debug-2026-09-19.json)
- 3 個感測器適配測例：raw-and-mode、sensor-details、gyro-sensor 改用埠 2、角度模式，gyro 無限迴圈限制為 3 次。讀回 GYRO-ANG / type 32 / mode 0，三者在目前角度 0° 與韌體直接讀值相符。隨後另以不重設模式的診斷程式讀到非零角度 −1°，ReadRaw 陣列值、ReadRawValue 與韌體直接讀值三者完全一致；新增第 27 項通過檢查。[非零角度結果](./hardware-gyro-nonzero-2026-09-19.json)。較大角度的人為轉動尚未驗證。[結果](./hardware-motors-gyro-2026-09-19.json)
- A、B、C 各自以速度 20 轉 90°，讀回位移分別 91°、89°、90°。[結果](./hardware-motor-ports-2026-09-19.json)
- D 在使用者確認後以速度 −20 反轉 90°，讀回位移 −90°。[結果](./hardware-motor-D-2026-09-19.json)

## 實機找到並修復的新問題

1. **Speaker.Play 的檔名不符合韌體契約。** 原先 backend 將資源轉成絕對路徑並補 `.rsf`，但 V1.09H 的 SOUND.PLAY 會再加上程式資源目錄與 `.rsf`。這導致檔案無法打開，程式停留在 Speaker.Wait。修復為直接傳入 extension-free 資源名稱；不再套用 bitmap/file 的檔名生成邏輯。這次只驗證了相對資源名稱，未驗證絕對音檔路徑。
2. **產生的 RSF 檔頭錯誤。** 原長度欄為 2059，而資料實際為 4000 bytes；取樣率用 little endian 寫出。已改為 big-endian 0x0100 格式、4000-byte 資料、8000Hz、播放模式 0，重建音檔後在實機通過完成等待。

韌體依據：[c_sound.c](https://github.com/mindboards/ev3sources/blob/master/lms2012/c_sound/source/c_sound.c)。修復前媒體超時紀錄保留於 [before-fix JSON](./hardware-files-media-before-fix-2026-09-19.json)。

## 未通過／不適用與測試限制

- 原 motor-move、motor-sequence、motor-schedule、motor-steer-sync 要求 D 正轉，受到使用者後來說明的限位器阻擋，完成等待超時。這些原始組合沒有標成通過；不將其推論成編譯器失敗。motor-start-stop 的 D 未正常位移；motor-reverse 的 A 為 −181°，但 D 在前一測例停止後仍有位移，因此嚴格四埠檢查未通過。後續採取獨立馬達測試及 D 限定反轉，均通過。
- 預設診斷程式在原始 main OBJECT_END 位置加入完成標記與 30 秒 timer hold，並更新 object offsets 與記憶體大小；藉此在程式仍執行時讀回 global RAM。原範例指令未重寫，但加入診斷尾段，不能稱作完全未變更的原始 RBF。原始與診斷 RBF SHA-256 均有記錄。
- 檔案／媒體測例只改成隔離診斷檔名；感測器測例另改埠號及有限迴圈。獨立馬達測例為特別產生的 90° 程式。
- 第一輪診斷檔名太長被韌體回報成「No file handles are available」；改短檔名後成功。不是已證實的 handle 洩漏。第一個測例啟動時一度讀到 STOPPED，加入短暫啟動寬限後重試成功。
- 沒有實體相機／麥克風回饋，因此未宣稱圖片外觀、音質／音高已由我直接觀察確認。數值讀回不等同於螢幕字形驗證。
- 初始階段尚未測試的按鈕、彩色／觸碰／I2C 項目已在下節補測；Wi-Fi、所有執行緒交錯與原 D 正轉組合仍未通過。
- 診斷 RBF 與隔離資料／媒體檔在各測例後停止並刪除；馬達最後已停止並煞車。

修復後的 53 個離線範例預期檢查仍為 mismatch 0；硬體與離線檢查結論分開記錄。

初始階段最終狀態讀回：motorBusy=0，programStatus=64（STOPPED）。65 個自動化測試通過（含新增媒體回歸測試）；53 個離線 examples 預期檢查通過。

## 完整覆蓋補測

- **原始 RBF 37 個**：33 個無馬達／感測器／按鈕等待的範例，加原始 button-feedback、motor-counter、motor-reverse、include-multiple。全部原 RBF SHA-256 與最後離線 build 相符，韌體正常結束（status 64 / result 0）。[33 項](./hardware-original-rbf-2026-09-19.json)、[按鈕](./hardware-button-original-2026-09-19.json)、[A 馬達三項](./hardware-motor-A-original-2026-09-19.json)。
- **按鈕**：button-feedback 真實 Enter 回讀 E，使用者確認「Button: E」與短音。button-car 的 A+B 適配版由真實 Enter 觸發，位移 361°/363°，使用者確認轉動。[按鈕車](./hardware-fixture-button-2026-09-19.json)。
- **Color**：input 1。空場讀 0；第一輪白紙讀 2，保留[第一次結果](./hardware-color-white-before-adjustment-2026-09-19.json)。使用者調整距離後，color-sensor、raw-and-mode、sensor-details 均讀 6；直接韌體值亦為 6，名稱 COL-COLOR/type 29/mode 2。[白色結果](./hardware-color-white-2026-09-19.json)。含無限迴圈的範例改成五次取樣，raw/details 從 input 4 改至 1。
- **Touch**：input 4，將 threshold/sampling 的 input 1 改成 4。人工[放開時為 0](./hardware-fixture-touch-released-2026-09-19.json)、[按住時為 100](./hardware-fixture-touch-pressed-2026-09-19.json)，均與直接韌體讀值相符。
- **Gyro**：input 2，原 gyro 範例改埠並限制五次取樣；角度 −9° 與直接讀值一致。先前另測 ReadRaw 陣列非零負數 −1°。[實際配置五項](./hardware-sensor-fixture-2026-09-19.json)。未做人為大角度刻度校驗。
- **I2C**：使用者描述為 compass，但硬體回報 type 52/HT-DIR-DC，韌體型號表對應 HiTechnic NewIRDir；真正 compass 是另一條 type 56/HT-CMP-DEG2。依現有裝置改成 input 3、七位元位址 0x08、製造商暫存器 0x08，原單位元組讀取回傳 H=72。[範例結果](./hardware-fixture-i2c-2026-09-19.json)。完整識別讀回 HiTechnc / NewIRDir；正數多位元組讀取長度會使 d_iic 反轉回覆，報告保留原始 bytes 並依韌體規則還原字串。[識別結果](./hardware-i2c-identity-2026-09-19.json)。沒有把未接上的 compass 宣稱通過。
- **馬達**：韌體[型號讀回](./hardware-motor-types-2026-09-19.json)為 A 大型、B/C/D 中型。A 原反轉 −180° 實測 −182°；原 include-multiple +120° 實測 +121°。D 未再驅動。六個 AD→AB（或 D→B）的[適配測例](./hardware-fixture-motors-2026-09-19.json)曾完成；位移及限制見矩陣。
- **避障**：AD→AB、touch 1→4。[按住](./hardware-fixture-rover-pressed-2026-09-19.json)在 sample=1 即停止且位移 0；[放開](./hardware-fixture-rover-released-2026-09-19.json)完成 50 次，sample=51，最後煞車。

型號／I2C 契約來源：[typedata50.rcf](https://github.com/mindboards/ev3sources/blob/master/lms2012/lms2012/Linux_AM1808/sys/settings/typedata50.rcf)、[d_iic.c](https://github.com/mindboards/ev3sources/blob/master/lms2012/d_iic/Linuxmod_AM1808/d_iic.c)。

## 尚未完成的認證與機構限制

1. **B/C 機構卡住**：同步轉向分段重測超時；A/B 與 B/C 都出現問題，不能僅憑型號混用歸因。B/C 最後一次診斷第一段只前進約 34°/11°，後續全域 a1/b1 尚未賦值，卡在第一個 Motor.MoveSteer 的完成等待。使用者隨後明確確認「motor B,C 卡住」。已停止並煞車，沒有再驅動 B/C。[混合馬達超時](./hardware-fixture-sync-2026-09-19.json)、[B/C 超時及記憶體](./hardware-fixture-sync-bc-2026-09-19.json)。先前[直接韌體 STEP_SYNC](./hardware-direct-sync-2026-09-19.json)與完成紀錄也保留；不能用它們取代尚未完成的精確比例驗收。
2. **D 限位器**：不可拆除，既有單次 −90° 成功紀錄保留；未再進行正向或長行程。所有原 AD 組合不能以 AB 成功替代。
3. **Wi-Fi**：使用者沒有 Wi-Fi／IP；原驗收要求至少 USB 與 Wi-Fi 各一次，Wi-Fi 仍未滿足。
4. **人工視聽**：button-feedback 與下節九個視聽範例已由使用者確認正常；未做逐像素、音高頻率量測或所有其他範例的畫面驗收。
5. **覆蓋邊界**：未列為完整通過所有硬體分支（例如 motor-counter 正負兩分支）、大角度陀螺儀校驗或所有執行緒交錯。

## 驗證工具與復原

新增 `tests/hardware/certify.mjs` 可跑原始 RBF、記錄韌體結果、資源雜湊與原檔名實際資料；會先備份可能覆寫的檔案／媒體，結束後復原。觀察模式另插入三秒尾段並記錄獨立雜湊。`tests/hardware/fixture.mjs` 執行固定配置適配測試、完成標記、全域記憶體與編碼器讀回；會拒絕未列入測試的馬達埠。

最後一輪：65/65 自動化測試通過；全工作區型別檢查通過；53/53 離線位元碼預期檢查通過；修改檔案的 ESLint 通過。全專案 ESLint 尚有既存的 `apps/web/src/docs.tsx:391` 未使用 DocumentCards 錯誤，與本次修正無關。修正前的 checkpoint commit 為 `8ac27ec`。

最終停止狀態：[JSON](./hardware-final-state-2026-09-19.json)：motorBusy=0、programStatus=64、programResult=0，全部馬達已煞車。

## 人工視聽驗收完成

使用者準備就緒後，依序播放 display-fonts、display-shapes、display-write、drawing-primitives、double-buffer-animation、original-media、speaker-scale、speaker-melody、speaker-interrupt。九個範例均保留原始指令，另在 main 結尾加入三秒觀察等待；各自原 RBF 與觀察版的 SHA-256 均有記錄。合計執行 37.675 秒，九項均正常結束，媒體資源復原無錯誤。

使用者明確回覆五個顯示範例「全部正常」，媒體／音效「圖像與音效都正常」。確認了三種字體大小、靶形、文字、幾何圖形、圓球向右與 Frame 1–4、吉祥物與提示音、升高四音音階、三音旋律，以及低音截短後的短高音。這是人工觀察結果，不是相機／麥克風或頻率測量。

[九項視聽紀錄](./hardware-visual-audio-2026-09-19.json)。本輪沒有驅動任何馬達。D 限位器、B/C 卡住、Wi-Fi 未驗證與其他既有覆蓋邊界仍保留，因此整體認證不標為全部通過。

## 吉祥物顯示更正與修復

使用者後續更正「吉祥物好像顯示不完整」，並確認是部分身體被裁掉，因此撤回 original-media 的圖像通過狀態，保留其執行完成及音效觀察紀錄。

查出 `tools/build-assets.mjs` 使用 MSB-first 寫出 RGF，但 EV3 `dLcdDrawBitmap` 以 LSB-first 讀像素。這會將每組八像素左右翻轉，使頭框、手臂及腳部邊緣斷裂。以韌體像素規則離線解碼可重現；例如頭框座標 (44,20) 原先是白色，應為黑色。已改用 `1 << (x % 8)` 並重建 RGF；圖檔仍是 176×128、2818 bytes，輪廓與肢體都在畫面範圍內。這證實了編碼錯誤，但最終畫面是否完整仍需實機複驗。

新增 RGF 解碼回歸測試，檢查完整頭框、手腳與周圍空白；桌面 25 個測試全部通過。修正前後圖檔雜湊與像素證據在[編碼結果](./hardware-mascot-encoding-2026-09-19.json)，韌體依據為 [d_lcd.c](https://github.com/mindboards/ev3sources/blob/master/lms2012/c_ui/source/d_lcd.c)。修正前後解碼預覽：[修正前](./mascot-firmware-before.png)、[修正後](./mascot-firmware-fixed.png)。預覽是依韌體規則解碼的圖像，不是實機截圖。

修正版另以 12 秒觀察尾段部署複驗：[實機結果](./hardware-mascot-fixed-2026-09-19.json)，其後使用者先回覆仍有缺少；提供實際 RGF 的完整解碼預覽後，確認「實機與上圖相同」，因此圖像對照複驗通過。

後續補充：部署的 RGF 是產生器直接繪製的簡化機器人，並非 source PNG 詳細原稿的轉換。因此判準是完整 RGF 輪廓，而不是原稿的額外裝飾。使用者已確認實機與修正後的完整 RGF 預覽相同。

最後另跑未修改原 RBF，修正版 RGF 與 RSF 在上傳後均逐位元組回讀一致，原程式 540ms 正常結束，資源復原無錯誤。[原 RBF 與部署檔回讀](./hardware-media-fixed-original-2026-09-19.json)。修正後桌面 25 個測試與型別檢查通過；修改檔案 ESLint 與 git diff --check 通過。
