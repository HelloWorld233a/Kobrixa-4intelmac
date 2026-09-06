# Read the robot's environment

## Goal

Wait for a sensor on input port 1, read a value, then make a decision.

```bp
Sensor.Wait(1)
reading = Sensor.ReadPercent(1)
If reading < 20 Then
  Speaker.Tone(30, 880, 160)
Else
  Speaker.Tone(20, 440, 100)
EndIf
```

Connect the sensor to the input port named by the program. Start with `Sensor.Wait`, then choose `ReadPercent`, `ReadRaw`, or `ReadRawValue`. Set the right mode before color or gyro lessons.

## Practice

Complete [sensor-threshold](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/sensors/sensor-threshold), [color-sensor](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/sensors/color-sensor), and [gyro-sensor](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/sensors/gyro-sensor).
