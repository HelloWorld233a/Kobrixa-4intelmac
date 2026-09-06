# 函式、Sub 與專案檔案

## 完成目標

將重複工作放入可重用的 `Sub` 或 `Function`，並以 `Include`、`Import` 拆分專案。

```bp
Sub BeepSuccess()
  Speaker.Tone(25, 660, 120)
  Speaker.Tone(25, 880, 120)
EndSub

BeepSuccess()
```

`Sub` 不回傳值；`Function` 可以用 `Return` 回傳計算結果。`Include` 適合共用設定或宣告，`Import` 適合匯入 `.bpm` 中的函式。所有路徑都必須是專案內相對路徑。

## 練習

完成 [local-functions](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/language/local-functions)、[include-settings](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/projects/include-settings) 與 [import-module](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/projects/import-module)。
