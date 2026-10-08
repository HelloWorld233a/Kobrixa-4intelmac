# Kobrixa IDE (Intel Mac Edition)

**Code motion. Build ideas.**

Kobrixa IDE is an open-source, cross-platform development environment for programming LEGO® MINDSTORMS® EV3 robots. It is designed for students and makers who want a focused path from source code to a program running on a physical EV3 brick.

> [繁體中文版 (Traditional Chinese README)](README.zh-TW.md)

---

## About this fork

This repository is a community-maintained fork of [Kobrixa](https://github.com/Kingsley1116/Kobrixa) dedicated to bringing **full, native support for Intel-based Macs (`darwin-x64`)**.

While the upstream Kobrixa project currently limits macOS releases to Apple Silicon (`arm64`), this fork provides:

- **Native Intel Mac binaries & installers**: Dedicated `.dmg` and portable `.zip` releases built specifically for x86_64 Mac hardware.
- **Multi-architecture release pipeline**: Updated build tools, dynamic Mach-O architecture validation, and packaging scripts that support both `darwin-arm64` and `darwin-x64`.
- **Active maintenance**: Keeping compatibility and features in sync with upstream improvements while ensuring older Intel Mac hardware remains supported.

Downloads and releases are available on the [GitHub Releases](https://github.com/HelloWorld233a/Kobrixa-4intelmac/releases) page.

---

## Project status

**v1 candidate implementation with Intel Mac support.** The repository contains a buildable IDE, compiler pipeline, EV3 image backend, and USB/Wi-Fi device services.

| Capability                            | Status                                 |
| ------------------------------------- | -------------------------------------- |
| Basic Plus (`.bp`) frontend           | v1 candidate                           |
| Native EV3 `.rbf` output              | v1 candidate                           |
| macOS Intel (`x86_64`) support        | **Supported in this fork**             |
| macOS Apple Silicon (`arm64`) support | Supported                              |
| Windows & Linux support               | Supported                              |
| USB HID & Wi-Fi device transports     | Implemented; physical matrix pending   |
| Installers and distributions          | Implemented (DMG, ZIP, NSIS, AppImage) |
| Cloud collaboration                   | Included in candidate.12+              |
| Python / TypeScript / C++ frontends   | Planned post-v1                        |

## Product direction

The workflow provides a direct, focused path:

```text
Edit .bp source
      ↓
Compile to KobrixaIR
      ↓
Generate native EV3 bytecode (.rbf)
      ↓
Upload over USB or Wi-Fi
      ↓
Run on the EV3 brick
```

Kobrixa uses a clean-room implementation to provide behavioral compatibility with commonly used legacy `.bp` programs. Compatibility means that a supported program runs without source changes and produces equivalent observable behavior; byte-for-byte equality with another compiler's `.rbf` output is not required.

## Building from source

### Prerequisites

- Node.js >= 24.0.0
- pnpm >= 10.0.0

### Build steps

```bash
# Clone the repository
git clone https://github.com/HelloWorld233a/Kobrixa-4intelmac.git
cd Kobrixa-4intelmac

# Install dependencies
pnpm install

# Build core packages
pnpm build:core

# Build for Intel Mac (x64)
TARGET_ARCH=x64 pnpm build:desktop
TARGET_ARCH=x64 pnpm package:installers

# Or build for Apple Silicon (arm64)
TARGET_ARCH=arm64 pnpm build:desktop
TARGET_ARCH=arm64 pnpm package:installers
```

Installers will be generated in `apps/desktop/out/installers/`.

## Technology stack

- **Desktop shell**: Electron
- **Renderer**: React, TypeScript, Monaco Editor
- **Compiler core & device services**: Node.js and TypeScript
- **Target runtime**: Native EV3 VM

## Upstream & Acknowledgements

This project builds upon the work of [Kingsley1116/Kobrixa](https://github.com/Kingsley1116/Kobrixa). We express our gratitude to the original authors and contributors of Kobrixa for creating the IDE and compiler architecture.

## Legal and naming

Kobrixa is an independent project and is not affiliated with, endorsed by, or sponsored by the LEGO Group. LEGO, MINDSTORMS, and EV3 are trademarks of the LEGO Group.

The Apache-2.0 license in this repository applies to original Kobrixa work as well as modifications in this fork. It does not grant rights to code, assets, documentation, trademarks, or other material owned by Clev3r, EV3Basic, the LEGO Group, or any other third party.

## License

Original Kobrixa work and additions in this fork are licensed under the [Apache License 2.0](LICENSE).
