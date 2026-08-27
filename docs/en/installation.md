# Installation and recovery

> Status: v1 candidate. USB and Wi-Fi support has not completed the three-platform physical-brick matrix.

## Development build

Install Node.js 24 and pnpm 10.15, run `pnpm install`, then use `pnpm dev`. `pnpm package` creates an unsigned development application for the current operating system.

The editor and compiler do not require a cloud account or internet connection. Wi-Fi is used only to communicate with an EV3.

## USB

Connect only one EV3 while diagnosing access problems. A permission error is different from “not found.” On Linux, add a narrowly scoped udev rule for LEGO vendor `0694`, EV3 product `0005`; do not grant broad access to every HID device. Reconnect the brick after changing a rule.

## Wi-Fi

The EV3 and computer must be on the same trusted network. Use discovery or enter the brick's IPv4/IPv6 address. Check TCP port 5555 and local firewall rules if connection is refused or times out.

## Recovery

- Cancel a stalled operation and reconnect without restarting Kobrixa.
- A failed or cancelled build preserves the last successful artifact.
- A disconnect during upload is reported as an error; reconnect and upload again.
- Unsaved editor drafts are restored from local application data on the next open.
