# Language support policy

> Status: `.bp` is planned for v1; all other frontends are post-v1 plans.  
> Language: English · [繁體中文](../zh-TW/language-support.md)

## Shared rule

All source languages compile through a frontend into validated `KobrixaIR`, then through the same EV3 backend into native `.rbf`. A frontend may not silently reinterpret an unsupported feature. It must emit a stable, actionable compile-time diagnostic.

“As complete as practical” means broad source syntax acceptance where semantics can be represented on the EV3 VM. It does not mean that Kobrixa embeds the full CPython, JavaScript, Node.js, browser, C++, or operating-system runtime in `.rbf`.

## Basic Plus (`.bp`) — v1

The clean-room frontend targets behavioral compatibility with supported legacy programs, including:

- Variables, arrays, expressions, strings, numbers, and Boolean conventions
- `If`/`ElseIf`/`Else`, loops, labels, and supported control flow
- Subs, functions, parameters, and `Return`
- Includes, modules, properties, and supported resource declarations
- Supported EV3 motor, sensor, display, speaker, button, file, mailbox, and program APIs

Compatibility means the original source runs without modification and has equivalent observable behavior on the reference brick. Whitespace, generated listings, instruction layout, and `.rbf` bytes may differ.

Compatibility is established from public behavior specifications and independently written cases. Clev3r source, assets, documentation, and protected implementation expression are not inputs to Kobrixa.

## Python — planned after v1

The frontend will aim to parse standard Python syntax and statically lower features that have defined EV3 semantics. Dynamic imports, runtime code generation, reflection-heavy behavior, native extensions, and most desktop standard-library modules are outside the native EV3 target. Unsupported features produce diagnostics that name the feature and suggest an EV3-compatible alternative when one exists.

## TypeScript — planned after Python

The frontend will use TypeScript syntax and static type information where available. It will not provide a browser DOM, Node.js APIs, dynamic module loading, `eval`, or an unrestricted JavaScript runtime. Supported constructs lower directly to typed IR rather than shipping a JavaScript engine.

## C++ — planned after TypeScript

The frontend will target a documented freestanding EV3 profile. Host operating-system APIs, dynamic libraries, inline assembly, exceptions, RTTI, and unrestricted allocation are not guaranteed. Supported source lowers to IR; it is not compiled into arbitrary native ARM code hidden inside `.rbf`.

## Diagnostics policy

Diagnostic codes remain stable within a major version and use namespaces such as `BP`, `PY`, `TS`, `CPP`, `IR`, and `EV3`. At minimum, diagnostics cover syntax errors, unresolved names, type errors, unsupported features, invalid EV3 API calls, resource limits, and backend failures.

An unsupported feature is an error, never a warning followed by altered execution. Diagnostics include a precise source range and, where possible, a remediation note.

## Compatibility test policy

- Valid fixtures verify observable output, motor commands, sensor interaction, files, display operations, and exit behavior.
- Invalid fixtures verify stable codes and source ranges.
- Each regression gets the smallest independently authored fixture that reproduces it.
- Reference-brick tests define behavior where emulation is insufficient.
- Deterministic compiler tests may compare Kobrixa outputs across builds; they do not require equality with third-party compiler bytes.
