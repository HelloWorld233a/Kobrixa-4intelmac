# EV3 hardware acceptance / EV3 實機驗收

Compiler verification is automated; physical execution is a separate release gate. Do not mark a lesson hardware-certified until every required field is recorded below.／編譯器驗證為自動化流程；實機執行是獨立的發行門檻。在填妥下列所有欄位前，不得將課程標為已通過硬體認證。

| Lesson / 課程    | Required hardware / 硬體             | Status / 狀態         | Firmware | Transport | Date | Result / 結果         |
| ---------------- | ------------------------------------ | --------------------- | -------- | --------- | ---- | --------------------- |
| hello-ev3        | EV3 brick                            | Pending               | —        | —         | —    | —                     |
| button-feedback  | EV3 brick buttons                    | Pending               | —        | —         | —    | —                     |
| original-media   | EV3 display and speaker              | Pending               | —        | —         | —    | —                     |
| motor-schedule   | Large motors A and D                 | Pending               | —        | —         | —    | —                     |
| raw-and-mode     | Color sensor on input 1              | Pending               | —        | —         | —    | —                     |
| sensor-dashboard | Color sensor on input 1              | Pending               | —        | —         | —    | —                     |
| obstacle-rover   | Touch sensor 1, large motors A and D | Pending               | —        | —         | —    | —                     |
| i2c-registers    | Documented compatible I2C device     | Deferred: third-party | —        | —         | —    | Out of core EV3 scope |

Use USB and Wi-Fi at least once across the matrix. Capture an issue link beside a failing result; never replace `Pending` with a pass based only on successful compilation.／請在矩陣中至少各驗證一次 USB 與 Wi‑Fi。若失敗，請在結果欄記錄 issue 連結；不可僅因編譯成功就把 `Pending` 改成通過。
