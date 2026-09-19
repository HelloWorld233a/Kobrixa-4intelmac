import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { UsbTransport } from "../../packages/device/dist/index.js";
import {
  EV3Backend,
  inspectRbf,
  createRbf,
  lc,
  gv,
  lv,
} from "../../packages/backend-ev3/dist/index.js";
import { BasicPlusFrontend } from "../../frontends/basic-plus/dist/index.js";
import { loadProject } from "../../packages/compiler/dist/index.js";
const root = fileURLToPath(new URL("../../", import.meta.url));
const mode = process.argv[2],
  phase = process.argv[3];
const groups = {
  touch: ["sensors/sensor-threshold", "sensors/sensor-sampling"],
  sync: ["motors/motor-steer-sync"],
  motors: [
    "motors/motor-move",
    "motors/motor-sequence",
    "motors/motor-schedule",
    "motors/motor-start-stop",
    "motors/motor-steer-sync",
    "projects/include-settings",
  ],
  i2c: ["sensors/i2c-registers"],
  rover: ["capstones/obstacle-rover"],
  button: ["capstones/button-car"],
};
if (!groups[mode]) throw Error("Choose touch, motors, i2c, rover, or button");
if (["touch", "rover"].includes(mode) && !["released", "pressed"].includes(phase))
  throw Error("Specify confirmed touch phase");
if (
  ["motors", "rover", "button", "sync"].includes(mode) &&
  process.env.EV3_FIXTURE_MOTORS !== "raised"
)
  throw Error("Confirm A/B raised using EV3_FIXTURE_MOTORS=raised");
const out =
  root + "/docs/audits/hardware-fixture-" + mode + (phase ? "-" + phase : "") + "-2026-09-19.json";
const cases = groups[mode].map((project) => [
  project,
  mode === "touch"
    ? { reading: phase === "pressed" ? 100 : 0 }
    : mode === "i2c"
      ? { deviceid: 72 }
      : {},
]);
const signal = AbortSignal.timeout(240000),
  t = new UsbTransport(),
  dev = (await t.discover(signal))[0],
  s = await t.connect(dev, signal);
const report = {
  date: new Date().toISOString(),
  device: dev,
  instrumentation:
    "Fixture-adapted source, then append main completion marker and 30-second hold; source and instrumented RBF hashes recorded. A+D maps to A+B; D never driven. Touch input 4. I2C input 3, seven-bit address 8, manufacturer register 8.",
  cases: [],
};
async function direct(code, n = 0) {
  const r = Buffer.from(
    await s.connection.exchange(Uint8Array.from([0, n & 255, n >> 8, ...code]), signal, 5000),
  );
  if (r[0] !== 2) throw Error("direct reply " + r.toString("hex"));
  return r.subarray(1);
}
async function readCounts() {
  const code = [];
  for (let p = 0; p < 4; p++) code.push(0xb3, 0, p, ...gv(p * 4));
  const data = await direct(code, 16);
  return [0, 1, 2, 3].map((p) => data.readInt32LE(p * 4));
}
async function memory(offset, size) {
  return direct([0x7f, 1, 0, ...lc(offset), ...lc(size), ...gv(0)], size);
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let remote;
try {
  const info = await direct([0x81, 26, ...lc(40), ...gv(0), 0x0c, 22, 1, ...gv(40)], 41);
  report.firmware = info.subarray(0, 40).toString().split("\0")[0];
  if (info[40] !== 64) throw Error("User program already running; will not replace it");
  for (const [project, expected] of cases) {
    const row = { project, expected, startedAt: new Date().toISOString() };
    report.cases.push(row);
    try {
      const loaded = await loadProject(root + "/examples/" + project);
      for (const source of loaded.project.sources) {
        if (["motors", "rover", "button", "sync"].includes(mode))
          source.content = source.content.replace(/"AD"/g, '"AB"').replace(/"D"/g, '"B"');
        if (["touch", "rover"].includes(mode))
          source.content = source.content.replace(/Sensor\.(Wait|ReadPercent)\(1/g, "Sensor.$1(4");
        if (mode === "i2c")
          source.content = source.content
            .replace("Sensor.Wait(1)", "Sensor.Wait(3)")
            .replace("Sensor.ReadI2CRegister(1, 2, 0)", "Sensor.ReadI2CRegister(3, 8, 8)");
      }
      if (mode === "sync") {
        loaded.project.sources[0].content =
          'a0=Motor.GetCount("A")\nb0=Motor.GetCount("B")\nMotor.MoveSteer("AB",35,25,360,true)\nProgram.Delay(300)\na1=Motor.GetCount("A")\nb1=Motor.GetCount("B")\nMotor.MoveSync("AB",30,10,180,true)\nProgram.Delay(300)\na2=Motor.GetCount("A")\nb2=Motor.GetCount("B")\nMotor.Stop("AB",true)';
      }
      if (mode === "sync" && phase === "bc")
        loaded.project.sources[0].content = loaded.project.sources[0].content
          .replace(/"AB"/g, '"BC"')
          .replace(/"B"/g, '"C"')
          .replace(/"A"/g, '"B"');
      row.sourceAdaptation =
        mode === "i2c"
          ? "Input 3, 7-bit address 0x08, register 0x08 (manufacturer first byte H)."
          : mode === "sync"
            ? "Separate steer/sync segments with 300ms settle, encoder globals; pair " +
              (phase === "bc" ? "B+C (medium)" : "A+B (mixed)")
            : mode === "touch"
              ? "Touch input 1 -> 4; user-confirmed " + phase
              : "Motor D -> B; touch input 1 -> 4 when used.";
      const front = await new BasicPlusFrontend().compile(loaded.project, signal);
      if (front.diagnostics.length) throw Error(JSON.stringify(front.diagnostics));
      const motorCalls = front.ir.functions.flatMap((f) =>
        f.blocks.flatMap((b) =>
          b.instructions.filter((i) => i.op === "ev3-call" && i.operation.startsWith("Motor.")),
        ),
      );
      if (
        motorCalls.some(
          (i) =>
            i.args[0]?.kind !== "string" ||
            !(mode === "sync" && phase === "bc" ? /^[BC]+$/ : /^[AB]+$/).test(i.args[0].value),
        )
      )
        throw Error("Unsafe motor port in fixture image");
      const moves = motorCalls.length > 0;
      const back = await new EV3Backend().compile(front.ir, signal);
      if (!back.rbf) throw Error(JSON.stringify(back.diagnostics));
      const orig = Buffer.from(back.rbf),
        info = inspectRbf(orig),
        marker = Math.ceil(info.globalBytes / 4) * 4,
        objects = [];
      for (let j = 0; j < info.objectCount; j++) {
        let code = orig.subarray(info.offsets[j], info.offsets[j + 1] ?? orig.length),
          local = orig.readUInt32LE(24 + j * 12);
        if (j === 0) {
          if (code.at(-1) !== 10) throw Error("missing main terminator");
          const scratch = Math.ceil(local / 4) * 4;
          code = Uint8Array.from([
            ...code.subarray(0, -1),
            0x3a,
            ...lc(123456789),
            ...gv(marker),
            0x85,
            ...lc(30000),
            ...lv(scratch),
            0x86,
            ...lv(scratch),
            10,
          ]);
          local = scratch + 4;
        }
        objects.push({
          ownerObjectId: orig.readUInt16LE(20 + j * 12),
          triggerCount: orig.readUInt16LE(22 + j * 12),
          localBytes: local,
          code,
        });
      }
      const image = createRbf(objects, marker + 4);
      row.adaptedSha256 = createHash("sha256").update(orig).digest("hex");
      row.instrumentedSha256 = createHash("sha256").update(image).digest("hex");
      remote = "/home/root/lms2012/prjs/kxf_" + Date.now().toString(36) + ".rbf";
      await s.upload(remote, image, signal);
      if (moves) row.encoderBefore = [...(await readCounts())];
      await s.run(remote, signal);
      const start = Date.now();
      let done = false;
      while (Date.now() - start < (mode === "button" ? 90000 : 20000)) {
        await wait(200);
        const state = await direct([0x0c, 22, 1, ...gv(0), 0x0c, 24, 1, ...gv(1)], 2);
        row.lastState = [...state];
        if (state[0] === 64 && Date.now() - start < 2000) continue;
        if (state[0] === 64)
          throw Error("Program stopped before completion marker; result=" + state[1]);
        const m = await memory(marker, 4);
        if (m.readInt32LE() === 123456789) {
          done = true;
          break;
        }
      }
      if (!done) {
        row.timeoutCounts = await readCounts();
        row.timeoutGlobals = (await memory(0, info.globalBytes)).toString("hex");
        row.timeoutLocals = (
          await direct(
            [0x7f, 1, 1, 0, ...lc(orig.readUInt32LE(24)), ...gv(0)],
            orig.readUInt32LE(24),
          )
        ).toString("hex");
        throw Error("completion marker timed out");
      }
      const globals = Buffer.alloc(info.globalBytes);
      for (let off = 0; off < globals.length; off += 200)
        (await memory(off, Math.min(200, globals.length - off))).copy(globals, off);
      let offset = front.ir.functions.some((f) =>
        f.blocks.some((b) =>
          b.instructions.some(
            (i) =>
              i.op === "ev3-call" &&
              ["Thread.CreateMutex", "Thread.Lock", "Thread.Unlock", "LCD.StopUpdate"].includes(
                i.operation,
              ),
          ),
        ),
      )
        ? 8
        : 0;
      row.values = {};
      for (const v of front.ir.globals) {
        const type = v.type.kind,
          size = type === "boolean" ? 1 : type === "string" ? 252 : 4;
        offset = Math.ceil(offset / (size >= 4 ? 4 : 1)) * (size >= 4 ? 4 : 1);
        row.values[v.name] =
          type === "string"
            ? globals
                .subarray(offset, offset + size)
                .toString()
                .split("\0")[0]
            : type === "number"
              ? globals.readFloatLE(offset)
              : type === "boolean"
                ? globals[offset]
                : globals.readInt32LE(offset);
        offset += size;
      }
      row.checks = Object.entries(expected).map(([name, value]) => ({
        name,
        expected: value,
        actual: row.values[name],
        passed: row.values[name] === value,
      }));
      if (project === "time/timer-slots")
        row.checks.push({
          name: "elapsed >=120ms and <2000ms",
          actual: row.values.elapsed,
          passed: row.values.elapsed >= 120 && row.values.elapsed < 2000,
        });
      if (project === "program/brick-status")
        row.checks.push({
          name: "brick name and battery range",
          passed:
            typeof row.values.name === "string" &&
            row.values.name.length > 0 &&
            row.values.battery >= 0 &&
            row.values.battery <= 100,
        });
      if (moves) {
        row.encoderAfter = await readCounts();
        row.encoderDelta = row.encoderAfter.map((x, j) => x - row.encoderBefore[j]);
        const deltas = {
          "motors/motor-move": [360, 360, 0, 0],
          "motors/motor-sequence": [180, 180, 0, 0],
          "motors/motor-schedule": [480, 480, 0, 0],
          "projects/include-settings": [180, 180, 0, 0],
          "capstones/button-car": [360, 360, 0, 0],
        };
        if (mode === "sync") {
          const observed = [
            row.values.a1 - row.values.a0,
            row.values.b1 - row.values.b0,
            row.values.a2 - row.values.a1,
            row.values.b2 - row.values.b1,
          ];
          const expected = [360, 270, 180, 60];
          row.checks.push({
            name: "Steer then sync displacement within 15 degrees",
            actual: observed,
            expected,
            passed: observed.every((v, i) => Math.abs(v - expected[i]) <= 15),
          });
          const stationary = phase === "bc" ? [0, 3] : [2, 3];
          row.checks.push({
            name: "Unselected motors remain still",
            passed: stationary.every((p) => Math.abs(row.encoderDelta[p]) <= 2),
          });
        } else {
          row.checks.push({
            name: "C/D remain still",
            actual: row.encoderDelta.slice(2),
            passed: row.encoderDelta.slice(2).every((v) => Math.abs(v) <= 2),
          });
          if (deltas[project])
            row.checks.push({
              name: "encoder deltas within 10 degrees",
              expected: deltas[project],
              actual: row.encoderDelta,
              passed: row.encoderDelta.every((v, j) => Math.abs(v - deltas[project][j]) <= 10),
            });
          else if (mode === "rover" && phase === "pressed")
            row.checks.push({
              name: "touch immediately stops movement",
              actual: row.encoderDelta,
              passed:
                row.encoderDelta.slice(0, 2).every((v) => Math.abs(v) < 15) &&
                row.values.sample === 1,
            });
          else
            row.checks.push({
              name: "A and B moved forward",
              actual: row.encoderDelta,
              passed: row.encoderDelta[0] > 50 && row.encoderDelta[1] > 50,
            });
        }
      }
      if (mode === "touch") {
        const raw = await direct([0x9a, 0, 3, 0, 63, ...gv(0)], 1);
        row.referenceSensor = raw.readInt8();
        row.checks.push({
          name: "RBF matches direct touch percent",
          expected: row.referenceSensor,
          actual: row.values.reading,
          passed: row.values.reading === row.referenceSensor,
        });
      }
      row.passed = row.checks.every((c) => c.passed);
      row.durationMs = Date.now() - start;
      console.log(
        project,
        JSON.stringify({
          passed: row.passed,
          values: row.values,
          encoderDelta: row.encoderDelta,
          referenceSensor: row.referenceSensor,
        }),
      );
    } catch (e) {
      row.passed = false;
      row.error = e.message;
      console.log(project, "FAIL", e.message);
    } finally {
      if (remote) {
        await s.stop(undefined, signal);
        await direct([0xa3, 0, 15, 1]);
        try {
          await s.delete(remote, signal);
        } catch (e) {
          row.cleanupError = e.message;
        }
        remote = undefined;
      }
      await fs.writeFile(out, JSON.stringify(report, null, 2) + "\n");
    }
  }
} finally {
  await s.disconnect();
  report.finishedAt = new Date().toISOString();
  await fs.writeFile(out, JSON.stringify(report, null, 2) + "\n");
}

if (report.cases.some((c) => !c.passed)) process.exitCode = 1;
