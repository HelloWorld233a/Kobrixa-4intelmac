# Capstone: make a robot respond to the world

## Goal

Combine buttons, sensors, motors, and feedback into a robot behavior you can test safely.

## Project flow

1. Use a button to choose or start the behavior.
2. Read a sensor and write its threshold as a clear `If` branch.
3. Respond with short, stoppable motor moves; lift the wheels before every test.
4. Report the current state with the display and tones, then extend one feature at a time.

Media assets and I²C are advanced extensions for documented devices only. Complete the core behavior first, then study [original-media](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/media/original-media) and [i2c-registers](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/sensors/i2c-registers).

## Challenge

Complete [button-car](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/capstones/button-car), then [obstacle-rover](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/capstones/obstacle-rover). Add a safe stop condition and a clear state message to your robot.
