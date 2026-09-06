# 讀取機器人的環境

## 完成目標

等待輸入埠 1 的感測器，讀取數值後做出判斷。

```bp
Sensor.Wait(1)
reading = Sensor.ReadPercent(1)
If reading < 20 Then
  Speaker.Tone(30, 880, 160)
Else
  Speaker.Tone(20, 440, 100)
EndIf
```

感測器必須接在程式指定的輸入埠。先用 `Sensor.Wait`，再選擇 `ReadPercent`、`ReadRaw` 或 `ReadRawValue`。色彩與陀螺儀課程應先設定正確模式。

## 練習

完成 [sensor-threshold](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/sensors/sensor-threshold)、[color-sensor](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/sensors/color-sensor) 與 [gyro-sensor](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/sensors/gyro-sensor)。
