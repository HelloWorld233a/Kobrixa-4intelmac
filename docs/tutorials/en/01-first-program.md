# First program: display and sound

## Goal

Build, upload, and run a safe EV3 program without connecting motors or sensors.

## Program

```bp
LCD.Clear()
LCD.Text(1, 8, 18, 1, "Hello from Kobrixa")
LCD.Line(1, 8, 38, 165, 38)
LCD.Update()
Speaker.Tone(35, 440, 180)
Program.Delay(250)
```

`LCD.Update()` sends drawing to the screen. `Speaker.Tone` takes volume, frequency, and milliseconds. Build first, then connect, upload, and run.

## Challenge

Change the text position, line coordinates, and tone frequency. Compare your work with the [hello-ev3 example](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/getting-started/hello-ev3).
