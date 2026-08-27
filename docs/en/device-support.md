# Device and platform support

> Status: USB HID and Wi-Fi on three desktop platforms are planned for v1.  
> Language: English · [繁體中文](../zh-TW/device-support.md)

## v1 support matrix

| Platform | USB HID        | Wi-Fi          | Bluetooth |
| -------- | -------------- | -------------- | --------- |
| Windows  | Planned for v1 | Planned for v1 | Long-term |
| macOS    | Planned for v1 | Planned for v1 | Long-term |
| Linux    | Planned for v1 | Planned for v1 | Long-term |

Support is not considered shipped until automated transport tests and physical reference-brick tests pass on that platform.

## USB

- Discover supported EV3 USB HID devices without scanning unrelated interfaces.
- Report missing permissions or driver access separately from “device not found.”
- Use bounded reads and writes, validate packet lengths, and reject malformed replies.
- Close handles on cancellation, disconnect, application exit, and error.
- Provide platform-specific setup guidance only when required; Linux permission guidance must use narrowly scoped device rules.

## Wi-Fi

- Accept an IPv4 or IPv6 address or a discovered compatible endpoint.
- Use the EV3-compatible TCP protocol and validate its handshake before creating a session.
- Apply connect, read, write, and overall operation timeouts.
- Treat an unexpected disconnect as recoverable and never report an incomplete upload as successful.
- Do not expose the device service as a listening network server.

## Operation behavior

Discovery is read-only. Upload, run, stop, and delete require an explicit user action. The UI shows `disconnected`, `connecting`, `connected`, `busy`, or `error` and identifies the active transport.

Upload writes to a temporary remote name when supported, verifies completion, and then finalizes the target. Cancellation closes the operation and leaves the session reusable when the underlying transport remains valid.

Remote paths are normalized as EV3 paths. Parent traversal, embedded nulls, invalid lengths, and unsupported names are rejected before transport I/O.

## Required acceptance scenarios

- Discover, connect, upload, run, stop, delete, and disconnect over USB on all three platforms.
- Connect by address and perform the same lifecycle over Wi-Fi on all three platforms.
- Permission denied, no device, wrong address, refused connection, timeout, malformed reply, full storage, and disconnect during upload.
- User cancellation during discovery, connect, and upload.
- Reconnect after a recoverable error without restarting the IDE.
- Verify that failure never transitions the UI or API result to success.

Bluetooth remains out of v1 because discovery, pairing, serial profiles, permissions, and packaging differ substantially across operating systems.
