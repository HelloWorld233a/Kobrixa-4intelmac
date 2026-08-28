# Kobrixa examples

These 24 examples are independently authored for Kobrixa and progress from display-only first builds to programs that need connected EV3 hardware.

| Category        | Example                | What it teaches                                  | Hardware notes                       |
| --------------- | ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Getting started | `hello-ev3`            | Text, a line, a tone, and a delay                | Display and speaker                  |
| Display         | `display-write`        | Simple black text with `LCD.Write`               | Display                              |
| Display         | `display-fonts`        | Tiny, small, and big fonts                       | Display                              |
| Display         | `display-shapes`       | Lines, concentric circles, and coordinates       | Display                              |
| Sound           | `speaker-scale`        | A four-note scale with arithmetic                | Speaker                              |
| Sound           | `speaker-interrupt`    | Stop a long tone early                           | Speaker                              |
| Control flow    | `control-flow`         | Variables, arithmetic, `For`, and drawing        | Display and speaker                  |
| Control flow    | `while-loop`           | A finite `While` loop                            | Display                              |
| Control flow    | `if-elseif`            | `If` / `ElseIf` / `Else`                         | Display and speaker                  |
| Control flow    | `boolean-logic`        | Boolean values, `And`, and `Not`                 | Display and speaker                  |
| Control flow    | `comparison-operators` | Parentheses, `>=`, `<>`, and combined conditions | Display                              |
| Control flow    | `nested-control`       | An `If` nested inside a `For` loop               | Display                              |
| Control flow    | `labels-and-goto`      | Labels, forward `Goto`, and relocation           | Display and speaker                  |
| Language        | `case-insensitive`     | Mixed-case keywords, identifiers, and APIs       | Display                              |
| Program         | `program-end`          | Explicitly end an EV3 program                    | Display                              |
| Project         | `include-settings`     | One extension-free `Include` and shared values   | Motors A and D must be clear to move |
| Project         | `include-multiple`     | Multiple project-relative `.bpi` files           | Motor A must be clear to move        |
| Motor           | `motor-move`           | Blocking movement, delay, and brake              | Motors A and D                       |
| Motor           | `motor-start-stop`     | Start motors continuously, then stop safely      | Motors A and D                       |
| Motor           | `motor-reverse`        | Negative speed and reverse movement              | Motor A                              |
| Motor           | `motor-sequence`       | Two blocking moves in sequence                   | Motors A and D                       |
| Motor           | `motor-counter`        | Read a motor encoder and branch with `If`        | Motor A                              |
| Sensor          | `sensor-threshold`     | Wait, read a percentage, and select feedback     | Touch sensor on input port 1         |
| Sensor          | `sensor-sampling`      | Repeated sensor sampling in a finite loop        | Touch sensor on input port 1         |

Open a directory, its `kobrixa.json`, or its `src/main.bp` in Kobrixa. Build before connecting to an EV3. For motor examples, lift the robot so its wheels can turn safely during the first run.

## Verification status

The syntax and argument order are cross-checked against the public [CLEV3R English Help](https://github.com/iCheh/Clev3r-1/tree/main/Clever/bin/Release/Help/en). In particular, these examples use `LCD.Text(color, x, y, font, text)`, color-first drawing calls, `Motor.Move(ports, speed, degrees, brake)`, one-based sensor ports, and extension-free `Include` paths. Every example is automatically parsed, lowered to version 1 IR, validated, and compiled to a structurally valid `.rbf`. Backend regression tests also check the documented integer operands, sensor-port conversion, and blocking behavior of `Motor.Move` against the [LEGO EV3 Firmware Developer Kit](https://assets.education.lego.com/v3/assets/blt293eea581807678a/blt469be1e11ad37696/5f880384f71916144453a49f/lego-mindstorms-ev3-firmware-developer-kit.pdf?locale=en-us).

These checks make the examples compiler- and bytecode-verified v1 candidates. Physical USB/Wi-Fi upload and execution still require an EV3 acceptance run on the stated hardware, so they are not described as hardware-certified yet.

The topic taxonomy was informed by the public CLEV3R example directory (control flow, functions, includes, sensors, motors, time, graphics, sound, files, and mailboxes). No CLEV3R source, documentation, assets, or generated output is included here. Examples for user-function calls, files, mailboxes, threads, and third-party sensors will be added only after their compiler/backend support and compatibility fixtures are complete; Kobrixa does not ship examples that merely parse but cannot produce runnable bytecode.
