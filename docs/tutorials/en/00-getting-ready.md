# Prepare Kobrixa and your EV3

## Goal

Create and open a Kobrixa project, then confirm that an EV3 can be connected safely. Lift the wheels before the first motor lesson.

## Before you start

- Install a Kobrixa development build, or start from source using the [installation guide](/docs/reference/installation).
- Have one EV3 and a USB cable ready. Use Wi-Fi only on a trusted local network.
- Connect one brick at a time. If something goes wrong, stop the program, reconnect, and try again.

## Create a project

1. Choose **New project** and keep the `bp` and `ev3-native` defaults.
2. Open `src/main.bp`, save it, then select **Build**. A successful build produces an `.rbf` artifact.
3. Find an EV3 over USB or enter its Wi-Fi address. Upload and run only after connecting.

## Safety rule

Never run a motor while it is trapped by a desk, fingers, or cables. Connect sensors to the stated input port before sensor lessons. USB and Wi-Fi deployment are still completing cross-platform hardware validation in the v1 candidate.

## Next

Continue to make the EV3 display text and play its first tone.
