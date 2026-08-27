# Product specification

> Status: Planning. This document describes the intended product, not shipped software.  
> Language: English · [繁體中文](../zh-TW/product.md)

## Purpose

Kobrixa IDE gives students and makers a dependable, understandable path from EV3 source code to a running robot. The product favors a short feedback loop, actionable errors, offline use, and predictable physical-device behavior over a broad collection of partially supported features.

## Primary users

- A student learning text-based robotics after block programming.
- A maker maintaining or extending an existing `.bp` robot program.
- A mentor who needs examples and repeatable setup across Windows, macOS, and Linux.

Advanced language tooling, classroom fleet management, and cloud collaboration are not v1 priorities.

## v1 user journey

1. Create a project or open a compatible `.bp` program.
2. Edit with syntax highlighting, completion for supported EV3 APIs, and inline diagnostics.
3. Build locally into a native `.rbf` artifact.
4. Discover and connect to an EV3 over USB HID or Wi-Fi.
5. Upload, run, stop, or remove the program.
6. See a structured result for every operation, including recovery guidance on failure.

The editor and compiler must work offline. Wi-Fi is used for communication with a brick, not as a cloud dependency.

## v1 requirements

### Workspace and editor

- Open a folder, a `kobrixa.json` project, or a standalone `.bp` file.
- Edit multiple project files without losing unsaved work.
- Provide syntax highlighting, bracket matching, go-to-diagnostic, basic completion, and formatting for supported `.bp` syntax.
- Show build and device status without hiding detailed diagnostics.

### Build

- Validate the manifest before compiling.
- Compile supported `.bp`, include, module, and asset inputs into `KobrixaIR` and then native `.rbf`.
- Return deterministic diagnostics with stable codes and source ranges.
- Never emit a successful deployable artifact after a compile error.
- Support cancellation; a cancelled build must not replace the last successful artifact.

### Device operations

- Discover USB EV3 devices and connect to a user-supplied Wi-Fi address.
- Display the active transport and connection state.
- Upload, run, stop, and delete a program.
- Time out stalled operations and distinguish permission, discovery, connection, protocol, transfer, and device errors.

## Non-goals for v1

- Bluetooth transport
- Blockly or another block editor
- Cloud accounts, synchronization, or collaboration
- A source-level debugger or simulator
- Python, TypeScript, or C++ compilation
- Classroom fleet management
- Importing proprietary project formats beyond supported `.bp` source files

## Success criteria

v1 is acceptable when all of the following are true:

- A supported legacy `.bp` program opens without source modification, compiles, and exhibits equivalent observable behavior on a reference EV3.
- A valid sample builds into `.rbf` on Windows, macOS, and Linux.
- USB and Wi-Fi upload/run workflows pass on all three platforms.
- Syntax and semantic failures identify the source file and line/column range.
- Disconnecting a brick during upload produces a recoverable error and no false success state.
- The application can be installed and used without a cloud account or continuous internet access.

Compatibility is behavioral, not byte-for-byte output equivalence. See the [language support policy](language-support.md) and [device support specification](device-support.md).
