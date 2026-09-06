# Control motors safely

## Goal

Move motors A and D in a predictable way, then stop them before the program ends.

## Safety reminder

Lift the wheels before a first run, check the output ports, and keep a way to stop the program immediately.

```bp
Motor.Move("AD", 35, 360, "True")
Program.Delay(500)
Motor.Stop("AD", "True")
```

`Motor.Move` is a blocking move. The port string chooses the motors to control. Later, use `Start`, `MoveSteer`, `MoveSync`, `GetCount`, and `GetSpeed` for more advanced motion.

## Practice

Complete [motor-move](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/motors/motor-move), [motor-counter](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/motors/motor-counter), and [motor-steer-sync](https://github.com/Kingsley1116/Kobrixa/tree/main/examples/motors/motor-steer-sync).
