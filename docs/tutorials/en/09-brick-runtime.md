# The EV3 brick and runtime

## Goal

Read EV3 status, use delays and timers, and finish a program explicitly.

```bp
battery = EV3.BatteryLevel()
LCD.Clear()
LCD.Text(1, 8, 18, 1, "Battery: " + Text.NumberToString(battery))
LCD.Update()
Program.Delay(500)
Program.End()
```

Brick APIs provide name, battery, time, and LED state. Timer slots are for bounded timing work; `Program.End` creates an explicit finish point. Every long-running flow needs a stop or recovery strategy.

## Practice

Complete [brick-status](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/program/brick-status), [timer-slots](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/time/timer-slots), and [program-end](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/program/program-end).
