# 看得見、聽得到、按得到的回饋

## 完成目標

將顯示器、喇叭、按鍵與時間組成能回應使用者的介面。

```bp
LCD.Clear()
LCD.Text(1, 8, 18, 1, "Press Enter")
LCD.Update()
Button.Wait("Enter")
Speaker.Note(35, "C5", 180)
```

使用 `LCD.Clear`、`Text`、`Line`、`Circle` 與 `Update` 繪圖。`Button.Wait` 會等待指定按鍵；計時流程可用 `Program.Delay` 或 Timer API。避免在沒有停止條件的迴圈中持續重繪。

## 練習

完成 [button-feedback](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/buttons/button-feedback)、[double-buffer-animation](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/display/double-buffer-animation) 與 [timer-slots](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/time/timer-slots)。
