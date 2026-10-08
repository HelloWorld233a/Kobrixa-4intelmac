# Kobrixa IDE (Intel Mac Edition)

**Code motion. Build ideas.**

Kobrixa IDE is an open-source, cross-platform development environment for programming LEGO® MINDSTORMS® EV3 robots. It is designed for students and makers who want a focused path from source code to a program running on a physical EV3 brick.

> [繁體中文版](README.zh-TW.md)

---

### About this Fork: Intel Mac Edition

This repository is a dedicated fork of [Kingsley1116/Kobrixa](https://github.com/Kingsley1116/Kobrixa).

While upstream Kobrixa focuses its macOS support primarily on Apple Silicon (`darwin-arm64`), **this fork actively maintains full build, test, and release support for Intel-based Macs (`x86_64` / `darwin-x64`)**.

- **Native Intel Mac Builds**: Pre-built `.dmg` installers and `.zip` standalone packages specifically compiled for x86_64 architecture.
- **Cross-Arch Release Pipeline**: Integrated multi-architecture packaging pipeline that preserves update assets and validates 64-bit Mach-O headers.
- **Full Upstream Parity**: Retains all features, compilers, IR pipelines, and device services from upstream Kobrixa.

---

## Downloads

Download the latest pre-built packages from [Releases](https://github.com/HelloWorld233a/Kobrixa-4intelmac/releases):

| Package                    | Target               | Description                                                     |
| :------------------------- | :------------------- | :-------------------------------------------------------------- |
| `Kobrixa-*-darwin-x64.dmg` | macOS (Intel x86_64) | Standard DMG disk image installer. Drag to Applications.        |
| `Kobrixa-*-darwin-x64.zip` | macOS (Intel x86_64) | Standalone application bundle (`kobrixa.app`). Extract and run. |

> **Gatekeeper note on macOS**: If macOS warns that the app cannot be opened because it is from an unidentified developer, go to **System Settings** > **Privacy & Security** and click **Open Anyway**.

---

## Building from Source

### Prerequisites

- Node.js >= 24.0.0
- pnpm >= 10.0.0

### Build Steps

```bash
# 1. Clone the repository
git clone https://github.com/HelloWorld233a/Kobrixa-4intelmac.git
cd Kobrixa-4intelmac

# 2. Install dependencies
pnpm install

# 3. Build core compiler and packages
pnpm build:core

# 4. Build desktop application for Intel Mac
TARGET_ARCH=x64 pnpm build:desktop

# 5. Package into release archives
TARGET_PLATFORM=darwin TARGET_ARCH=x64 pnpm package:archive
```

---

## Technology Stack

- Electron desktop shell
- React and TypeScript renderer
- Monaco Editor
- Node.js and TypeScript compiler core, EV3 backend, and device services
- Native EV3 VM as the v1 execution target
- Apache License 2.0

---

## Upstream & Acknowledgements

- Upstream project: [Kingsley1116/Kobrixa](https://github.com/Kingsley1116/Kobrixa)
- Original creator: Kingsley1116 and Kobrixa contributors.

---

## Legal & Trademarks

Kobrixa is an independent project and is not affiliated with, endorsed by, or sponsored by the LEGO Group. LEGO, MINDSTORMS, and EV3 are trademarks of the LEGO Group.

---

## License

Original Kobrixa work is licensed under the [Apache License 2.0](LICENSE).
Modifications and Intel Mac distribution workflows in this fork are also licensed under the [Apache License 2.0](LICENSE).
