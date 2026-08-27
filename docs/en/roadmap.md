# Roadmap

> Status: Planning; dates are intentionally omitted until implementation capacity is known.  
> Language: English · [繁體中文](../zh-TW/roadmap.md)

## Phase 0 — foundation

- Confirm trademark, repository, package-registry, social-handle, and domain availability for Kobrixa.
- Scaffold Electron, React, TypeScript, Monaco, and the Node.js/pnpm workspace.
- Pin toolchains and establish Windows, macOS, and Linux CI.
- Define versioned manifest, diagnostic, IR, artifact, and device contracts.
- Add documentation link and bilingual-parity checks.

Exit: all three platforms build an empty signed-or-development application and contract tests pass.

## v1 — Basic Plus to native EV3

- Implement the clean-room `.bp` frontend and behavioral compatibility suite.
- Implement typed `KobrixaIR`, validation, EV3 lowering, and deterministic `.rbf` packaging.
- Deliver Monaco editing, projects, builds, diagnostics, and artifact management.
- Deliver USB HID and Wi-Fi upload/run/stop/delete on Windows, macOS, and Linux.
- Publish examples, installation guidance, recovery instructions, and release artifacts.

Exit: every criterion in the [product specification](product.md) and [device specification](device-support.md) passes on reference hardware.

## v1.x — hardening

- Expand `.bp` compatibility cases and EV3 API coverage.
- Improve completion, formatting, performance, accessibility, localization, and recovery UX.
- Add a headless Node.js `kobrixa` CLI over the same compiler and device packages.

Exit: compiler and device APIs are stable enough for independent CLI and desktop release cycles.

## v2 — Python frontend

- Add Python parsing, semantic mapping, EV3 profile documentation, completion, and diagnostics.
- Compile supported Python semantics through `KobrixaIR` to `.rbf` without embedding CPython.

## v3 — TypeScript frontend

- Add TypeScript parsing and type-aware lowering.
- Document supported runtime semantics and explicitly reject browser, Node.js, and dynamic-code features in user programs.

## v4 — C++ frontend

- Treat C++ source support as a user-facing language frontend, separate from Kobrixa's Node.js and TypeScript implementation stack.
- Define a freestanding C++ EV3 profile and supported standard-library surface.
- Lower supported constructs through `KobrixaIR`; report unsupported runtime features at compile time.

## Long-term exploration

- Bluetooth transport
- EV3 simulator and virtual devices
- Blockly-style editor that targets the same IR
- Classroom deployment and device-fleet tools
- Additional LEGO-compatible hubs through separate backends

Long-term items are research directions, not commitments. Each requires a written proposal, security review, cross-platform acceptance criteria, and an update to both documentation languages before implementation.
