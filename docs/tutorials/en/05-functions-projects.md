# Functions, Subs, and project files

## Goal

Put repeated work in a reusable `Sub` or `Function`, then split a project with `Include` and `Import`.

```bp
Sub BeepSuccess()
  Speaker.Tone(25, 660, 120)
  Speaker.Tone(25, 880, 120)
EndSub

BeepSuccess()
```

A `Sub` has no return value. A `Function` can use `Return` for a calculated result. Use `Include` for shared settings or declarations and `Import` for functions in a `.bpm` file. Every path must be relative to the project.

## Practice

Complete [local-functions](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/language/local-functions), [include-settings](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/projects/include-settings), and [import-module](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/projects/import-module).
