# 值、文字與運算

## 完成目標

使用數字與文字變數，讓程式依計算結果產生不同的輸出。

## 基本規則

Basic Plus 不區分關鍵字與名稱的大小寫。數字、字串與布林值可放入運算式；`+`、`-`、`*`、`/`、`%` 可組合計算，`Text.*` 與 `Math.*` 提供常用轉換和數學函式。

```bp
score = 12
bonus = 3
total = score + bonus
message = "Total: " + Text.NumberToString(total)
LCD.Text(1, 8, 18, 1, message)
LCD.Update()
```

## 練習

將總分改為三個分數的平均值。查閱 [text-and-math 範例](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/language/text-and-math)，了解文字與數學 API。
