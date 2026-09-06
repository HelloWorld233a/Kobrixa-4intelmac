# 信箱與並行工作

## 完成目標

讓背景工作與主流程安全地共享狀態，並使用本機 mailbox 傳遞訊息。

```bp
Sub Blink()
  EV3.SetLED("Green")
  Program.Delay(100)
  EV3.SetLED("Off")
EndSub

Thread.Run = Blink
```

`Thread.Run` 啟動背景 Sub；共享資料時使用 mutex，避免兩個流程同時改寫。核心課程只處理本機 mailbox 輪詢，不宣稱跨主機 mailbox 或 Daisy-chain 支援。

## 練習

完成 [thread-mutex](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/concurrency/thread-mutex) 與 [mailbox-local](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/mailboxes/mailbox-local)。
