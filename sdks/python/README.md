# Kobrixa Plugin SDK for Python (Development Preview)

The Python SDK (`kobrixa-plugin-sdk`) lets you write development-mode plugins for Kobrixa using Python 3.10+ and the standard library only.

## Installation

```sh
python3 -m pip install -e sdks/python
```

## Usage

1. Create a `kobrixa-plugin.json` manifest with `"runtime": { "kind": "python", "entry": "main.py" }`.
2. Register async command handlers with `@plugin.command(...)` and call `plugin.run()`.
3. Launch Kobrixa with `--plugin-dev-dir=<folder>` and `--plugin-python=<interpreter>`.

`print()` calls are automatically redirected to `stderr` so `stdout` remains reserved for `Content-Length` framed JSON-RPC 2.0 messages.
