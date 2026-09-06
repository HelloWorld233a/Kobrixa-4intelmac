# 整合專題：讓機器人回應世界

## 完成目標

把按鍵、感測器、馬達與回饋整合成一個可安全測試的機器人行為。

## 專題流程

1. 先以按鍵選擇或開始行為。
2. 讀取感測器，將門檻寫成清楚的 `If` 分支。
3. 以短、可停止的馬達動作回應；每次測試前架高輪子。
4. 用顯示器和音調回報目前狀態，再逐步擴充功能。

媒體素材與 I²C 僅在使用已文件化裝置時作為進階延伸；先完成核心行為，再閱讀 [original-media](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/media/original-media) 與 [i2c-registers](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/sensors/i2c-registers)。

## 挑戰

先完成 [button-car](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/capstones/button-car)，再完成 [obstacle-rover](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/capstones/obstacle-rover)。為你的機器人增加一個安全停止條件與清楚的狀態訊息。
