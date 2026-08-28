# Kobrixa examples

These examples are independently authored for Kobrixa and are ordered from the safest first build to programs that need connected EV3 hardware.

| Example            | What it teaches                              | Hardware notes                       |
| ------------------ | -------------------------------------------- | ------------------------------------ |
| `hello-ev3`        | Display text and lines, play a tone, wait    | Speaker and display only             |
| `control-flow`     | Variables, arithmetic, `For`, drawing        | Speaker and display only             |
| `include-settings` | Project-relative `Include` and shared values | Motors A and D must be clear to move |
| `motor-move`       | Synchronized movement, delay, brake          | Motors A and D                       |
| `motor-counter`    | Read a motor encoder and branch with `If`    | Motor A                              |
| `sensor-threshold` | Wait for and read a sensor, then use `If`    | Touch sensor on input port 1         |

Open a directory, its `kobrixa.json`, or its `src/main.bp` in Kobrixa. Build before connecting to an EV3. For motor examples, lift the robot so its wheels can turn safely during the first run.

## Verification status

The syntax and argument order are cross-checked against the public [CLEV3R English Help](https://github.com/iCheh/Clev3r-1/tree/main/Clever/bin/Release/Help/en). In particular, these examples use `LCD.Text(color, x, y, font, text)`, color-first drawing calls, `Motor.Move(ports, speed, degrees, brake)`, one-based sensor ports, and extension-free `Include` paths. Every example is automatically parsed, lowered to version 1 IR, validated, and compiled to a structurally valid `.rbf`. Backend regression tests also check the documented integer operands, sensor-port conversion, and blocking behavior of `Motor.Move` against the [LEGO EV3 Firmware Developer Kit](https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt469be1e11ad37696/5f880384f71916144453a49f/lego-mindstorms-ev3-firmware-developer-kit.pdf?locale=en-us).

These checks make the examples compiler- and bytecode-verified v1 candidates. Physical USB/Wi-Fi upload and execution still require an EV3 acceptance run on the stated hardware, so they are not described as hardware-certified yet.

The topic taxonomy was informed by the public CLEV3R example directory (control flow, functions, includes, sensors, motors, time, graphics, sound, files, and mailboxes). No CLEV3R source, documentation, assets, or generated output is included here. Examples for user-function calls, files, mailboxes, threads, and third-party sensors will be added only after their compiler/backend support and compatibility fixtures are complete.
