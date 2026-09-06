# Values, text, and math

## Goal

Use number and text variables so a program can produce output from a calculation.

## Basic rules

Basic Plus is case-insensitive for keywords and names. Numbers, strings, and booleans can be used in expressions. Combine `+`, `-`, `*`, `/`, and `%`; use `Text.*` and `Math.*` for common conversions and math.

```bp
score = 12
bonus = 3
total = score + bonus
message = "Total: " + Text.NumberToString(total)
LCD.Text(1, 8, 18, 1, message)
LCD.Update()
```

## Practice

Change the total to an average of three scores. Use the [text-and-math example](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/language/text-and-math) to explore text and math APIs.
