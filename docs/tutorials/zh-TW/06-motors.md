# 安全控制馬達

## 完成目標

讓 A 與 D 馬達完成一次可預期的移動，並在程式結束前停止。

## 安全提醒

第一次執行前架高輪子，確認馬達接在正確輸出埠，並保留可以立即停止程式的方式。

```bp
Motor.Move("AD", 35, 360, "True")
Program.Delay(500)
Motor.Stop("AD", "True")
```

`Motor.Move` 是阻塞式移動；連接埠字串指定要控制的馬達。後續可使用 `Start`、`MoveSteer`、`MoveSync`、`GetCount` 與 `GetSpeed` 建立更複雜的移動。

## 練習

依序完成 [motor-move](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/motors/motor-move)、[motor-counter](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/motors/motor-counter) 與 [motor-steer-sync](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/motors/motor-steer-sync)。
