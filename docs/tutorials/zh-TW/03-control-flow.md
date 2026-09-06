# 讓程式做判斷與重複

## 完成目標

使用 `If`、`For` 與 `While` 控制程式流程，並理解布林值與比較運算子。

```bp
For step = 1 To 4
  If step >= 3 Then
    Speaker.Tone(25, 660, 90)
  Else
    Speaker.Tone(25, 440, 90)
  EndIf
EndFor
```

`True` 與 `False` 可直接使用；`=`、`<>`、`<`、`<=`、`>`、`>=` 會產生布林結果。用 `And`、`Or`、`Not` 組合條件。`Break` 立即離開迴圈，`Continue` 略過目前迭代。

## 練習

把迴圈改成只播放偶數步驟，接著完成 [control-flow](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/control-flow/control-flow) 與 [break-and-continue](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/control-flow/break-and-continue)。
