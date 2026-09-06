# Collections and files

## Goal

Understand fixed-size data, number vectors, and EV3 project files.

```bp
Number[] readings
Vector.New(readings, 3)
Vector.Set(readings, 0, 42)
value = Vector.Get(readings, 0)
```

Declare arrays with `Number[]` or `String[]`. Use `Row.*` for fixed row data and `Vector.*` for a number collection. File lessons write to the EV3; use a project name and an explicit flow so you do not overwrite unknown data.

## Practice

Complete [row-vector](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/collections/row-vector), [vector-workbench](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/collections/vector-workbench), [file-round-trip](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/files/file-round-trip), and [binary-record](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/files/binary-record).
