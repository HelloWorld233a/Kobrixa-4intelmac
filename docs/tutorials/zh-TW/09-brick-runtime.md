# EV3 本體與執行期

## 完成目標

讀取 EV3 狀態、使用延遲與計時，並以明確方式結束程式。

```bp
battery = EV3.BatteryLevel()
LCD.Clear()
LCD.Text(1, 8, 18, 1, "Battery: " + Text.NumberToString(battery))
LCD.Update()
Program.Delay(500)
Program.End()
```

本體 API 可提供名稱、電池、時間與 LED 狀態。Timer slot 適合有限的計時工作；`Program.End` 適合明確的結束點。每個長時間流程都應有停止或復原策略。

## 練習

完成 [brick-status](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/program/brick-status)、[timer-slots](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/time/timer-slots) 與 [program-end](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/program/program-end)。
