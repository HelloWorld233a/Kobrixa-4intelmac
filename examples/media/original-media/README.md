# Original media / 原創媒體

## Goal / 目標

Deploy and play Kobrixa's original EV3 image and sound assets.／部署並播放 Kobrixa 原創的 EV3 圖像與音效素材。

## Steps / 步驟

1. Run `pnpm assets:build` from the repository root.／在 repository root 執行 `pnpm assets:build`。
2. Build this project, connect an EV3, then choose Upload.／建置此專案、連接 EV3 後按 Upload。
3. The mascot appears and a short chime plays.／畫面會顯示吉祥物並播放短音效。

## Hardware acceptance / 實機驗收

Requires an EV3 brick. Record firmware, transport, date, and observed result in `HARDWARE-ACCEPTANCE.md`.／需 EV3 本體；請在 `HARDWARE-ACCEPTANCE.md` 記錄韌體、傳輸方式、日期與觀察結果。

## Source and license / 原始檔與授權

`assets/source/kobrixa-mascot.png` is an original AI-generated source illustration; generated `.rgf` and `.rsf` files are independently produced by `tools/build-assets.mjs`. All files in this project are Apache-2.0 unless noted otherwise.
