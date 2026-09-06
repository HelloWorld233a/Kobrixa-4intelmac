# Feedback you can see, hear, and press

## Goal

Combine the display, speaker, buttons, and time into an interface that responds to a person.

```bp
LCD.Clear()
LCD.Text(1, 8, 18, 1, "Press Enter")
LCD.Update()
Button.Wait("Enter")
Speaker.Note(35, "C5", 180)
```

Draw with `LCD.Clear`, `Text`, `Line`, `Circle`, and `Update`. `Button.Wait` waits for a named button. Use `Program.Delay` or the Timer API for timing. Do not redraw forever without a stopping condition.

## Practice

Complete [button-feedback](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/buttons/button-feedback), [double-buffer-animation](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/display/double-buffer-animation), and [timer-slots](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/time/timer-slots).
