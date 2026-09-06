# 第一個程式：顯示與聲音

## 完成目標

在不外接馬達或感測器的情況下，建置、上傳並執行一個安全的 EV3 程式。

## 程式

```bp
LCD.Clear()
LCD.Text(1, 8, 18, 1, "Hello from Kobrixa")
LCD.Line(1, 8, 38, 165, 38)
LCD.Update()
Speaker.Tone(35, 440, 180)
Program.Delay(250)
```

`LCD.Update()` 會將繪圖送到螢幕；`Speaker.Tone` 依序接受音量、頻率與毫秒數。先按建置，再連線、上傳與執行。

## 挑戰

改變文字位置、線條座標與音調頻率。使用 [hello-ev3 範例](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/getting-started/hello-ev3) 比對你的結果。
