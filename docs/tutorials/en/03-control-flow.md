# Decisions and repetition

## Goal

Use `If`, `For`, and `While` to control program flow, and understand boolean values and comparisons.

```bp
For step = 1 To 4
  If step >= 3 Then
    Speaker.Tone(25, 660, 90)
  Else
    Speaker.Tone(25, 440, 90)
  EndIf
EndFor
```

Use `True` and `False` directly. `=`, `<>`, `<`, `<=`, `>`, and `>=` produce boolean results. Combine conditions with `And`, `Or`, and `Not`. `Break` leaves a loop; `Continue` skips its current iteration.

## Practice

Play tones only on even steps, then complete [control-flow](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/control-flow/control-flow) and [break-and-continue](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/control-flow/break-and-continue).
