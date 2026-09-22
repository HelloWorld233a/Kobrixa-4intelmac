# Manual EV3 acceptance

These scripts operate on a connected EV3 and are excluded from `pnpm test` and CI.
Build the packages first with `pnpm -r --filter='./packages/**' --filter='./frontends/**' build`.
Run commands from the repository root.

| Script             | Purpose                                                                          | Invocation                                                           |
| ------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `run.mjs`          | USB or Wi-Fi artifact upload/run/stop/delete smoke check                         | `pnpm test:hardware -- --transport=usb --artifact=/path/program.rbf` |
| `certify.mjs`      | Execute original example RBF images and record firmware completion               | `node tests/hardware/certify.mjs [project/path ...]`                 |
| `fixture.mjs`      | Checks for a specific touch, sync, motor, I2C, rover or button setup             | `node tests/hardware/fixture.mjs <mode> [phase]`                     |
| `new-examples.mjs` | Run selected examples and compare EV3 readback with `fixtures/new-examples.json` | `node tests/hardware/new-examples.mjs [project/path ...]`            |

Project paths are relative to `examples/`. The hardware plan is separate from the
offline VM expectations because it describes actual sensor inputs and RAM readback.

Read [the hardware acceptance notes](../../examples/HARDWARE-ACCEPTANCE.md) before
running a script; they describe port assignments, required fixture states and motor
restrictions. Firmware completion does not establish visual or audio correctness.

The three example-checking scripts currently default to dated report paths under
`docs/audits/`; create that directory before running them. `EV3_CERT_REPORT` and
`EV3_NEW_REPORT` override the report files for `certify.mjs` and `new-examples.mjs`.
The smoke check writes JSON to stdout unless `--output=/path/result.json` is set.
