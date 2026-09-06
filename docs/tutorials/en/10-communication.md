# Mailboxes and concurrent work

## Goal

Let background work and the main flow share state safely, then pass a message with a local mailbox.

```bp
Sub Blink()
  EV3.SetLED("Green")
  Program.Delay(100)
  EV3.SetLED("Off")
EndSub

Thread.Run = Blink
```

`Thread.Run` starts a background Sub. Use a mutex around shared data so two flows do not write it at once. The core course covers local mailbox polling only; it does not claim cross-brick mailbox or Daisy-chain support.

## Practice

Complete [thread-mutex](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/concurrency/thread-mutex) and [mailbox-local](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/mailboxes/mailbox-local).
