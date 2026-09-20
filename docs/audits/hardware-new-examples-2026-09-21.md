# New examples: EV3 hardware follow-up / 新範例實機驗證

2026-09-21 (Asia/Taipei). EV3 USB serial `0016534f9b84`, firmware `LMS2012 V1.09E (Dec 3 2015)`. Only the 61 newly added examples were considered; the original 53 examples and historical reports were not rerun or revised.

使用者接線：A–D 馬達，A 有限位器並指定略過；輸入 1 為 Pixy2 Cam，輸入 2 為 EV3 陀螺儀。本次沒有執行任何馬達轉動測試，也沒有對 Pixy2 發送範例內的任意 I2C 暫存器寫入。

## Results / 結果

| Evidence                                                                                                           | Result                                                  | Limits                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Original examples + EV3 RAM/file readback](hardware-new-examples-2026-09-21.json)                                 | 34/34 projects; 107/107 checks                          | Includes completion markers. Drawing/audio examples verify execution and operands/assets, not what a person sees/hears.                                            |
| [Port 2 gyro fixture](hardware-new-gyro-fixture-2026-09-21.json)                                                   | 1/1 adapted project; 4/4 checks                         | `mode-inspector` input 1 → input 2 in memory only; not acceptance of the original color-sensor fixture.                                                            |
| [Original-image completion smoke tests](hardware-new-interaction-smoke-2026-09-21.json)                            | 3/3 completed                                           | `button-choice`, `button-cursor`, `paired-receiver`; no physical button-branch or paired delivery acceptance. Receiver finished in about 5 seconds without a peer. |
| [Full 61-project hardware coverage](hardware-new-coverage-2026-09-21.json)                                         | 23 not run                                              | 11 use excluded motor A; others need different sensors, a peer brick, or confirmed SD card.                                                                        |
| Bytecode model recheck: [41](clev3r-parity-bytecode-2026-09-21.json) + [20](new-examples-bytecode-2026-09-21.json) | 61 projects, 87 executions, 286 checks, zero mismatches | Deterministic hardware models, distinct from real-device evidence.                                                                                                 |

The gyro returned `GYRO-RATE`, type `32`, mode `1`, percentage `51`; the harness restored its original mode `0` and verified the restoration. Percentage is a live reading, not a calibrated angle measurement. Uploaded assets matched their source hashes. Existing same-name files were backed up and restored byte-for-byte; files created by the tests were removed. Final original-image/readback runs left program slot 1 stopped, result 0.

## Hardware-discovered fixes / 實機發現並修正

1. **High-bit Byte literals:** the native VM rejected the emitted narrowing literal form for operations such as `Byte.SHR(128, 1)`. Materialize values 128–255 in DATA32 scratch storage and consume the raw low byte. The final hardware run passed the complete assertion-bearing `byte-workbench`, including literal 128, unsigned shifts, bit masks, hex and binary formatting.
2. **`Byte.BIT`:** firmware `RL8` performs a left shift, despite its “rotate” wording. Generate `1 << index`, mask the source and compare with zero. Corrected the independent VM and added a hand-written native RL8 regression image plus compiler-level high-bit/bit-index regression checks.
3. **Folder sound paths:** firmware `SOUND.PLAY` prefixes its resource directory to names that do not begin with a dot, including an absolute `/home/...` name. Keep the relative `assets/ping` operand; deploy the RBF and assets under the Folder directory. The original internal-folder example now finishes normally. SD-folder bytes/model are checked, but physical SD playback remains untested.

Initial failed evidence is retained in [first batch](hardware-new-examples-initial-2026-09-21.json) and [files/media first pass](hardware-new-files-media-2026-09-21.json). Final results above supersede those attempts. The backend/frontend/recursion unit suite passed 38 tests; reference coverage remains 41/41 main programs, 8/8 helpers/assets and 122/122 APIs.

## Reproduce / 重跑

With an otherwise idle connected USB EV3, from the repository root:

```sh
node node_modules/typescript/bin/tsc -b packages/backend-ev3/tsconfig.json frontends/basic-plus/tsconfig.json packages/device/tsconfig.json
node tests/hardware/new-examples.mjs
node tests/hardware/new-examples.mjs --gyro-port2
```

The default plan is explicitly limited to 34 new non-motor projects. Optional project arguments select a subset from that plan. `EV3_NEW_REPORT` selects a separate output file. The gyro option runs separately, requires type 32 on input 2, records the source remapping and restores the sensor mode.

For each planned project, run its original compiled RBF to firmware completion, then run a copy with an appended array readback/completion marker and bounded hold before main `OBJECT_END`. Read actual globals, retained function-local display operands and file bytes over USB. A completion marker alone is not proof of every branch or peripheral effect. Source/RBF hashes and individual expected/actual values are retained in JSON.

Motor A remains excluded. Exercising B/C/D instead would require an explicitly documented remapped fixture and safe travel; this report does not count those unexecuted motor examples as verified. The new sensor examples generally require color, touch, RGB or HiTechnic hardware; a Pixy2 and gyro are not interchangeable replacements.
