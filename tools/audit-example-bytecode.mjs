// Audit-only EV3 bytecode interpreter. Device operations use deterministic stubs.
// This is not a complete EV3 VM or a hardware certification tool.
// Usage: node tools/audit-example-bytecode.mjs bytecodes.h bytecodes.c output-directory
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { EV3Backend, inspectRbf } from "../packages/backend-ev3/dist/index.js";
import { BasicPlusFrontend } from "../frontends/basic-plus/dist/index.js";
import { loadProject } from "../packages/compiler/dist/index.js";
const root = fileURLToPath(new URL("../", import.meta.url));
const [headerPath, tablePath, outputPath] = process.argv.slice(2);
if (!headerPath || !tablePath || !outputPath)
  throw Error("Expected bytecodes.h, bytecodes.c, and output directory arguments");
const h = await fs.readFile(headerPath, "utf8"),
  c = await fs.readFile(tablePath, "utf8");
const nums = Object.fromEntries(
  [...h.matchAll(/^\s*(\w+)\s*=\s*(0x[\da-f]+|\d+)\s*,/gim)].map((m) => [m[1], Number(m[2])]),
);
const ops = new Map(),
  subs = new Map();
for (const m of c.matchAll(/\bOC\(\s*(\w+)\s*,([^)]*)\)/g)) {
  if (nums[m[1]] !== undefined)
    ops.set(nums[m[1]], {
      name: m[1].slice(2),
      types: m[2]
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x !== "0"),
    });
}
for (const m of c.matchAll(/\bSC\(\s*(\w+)\s*,\s*(\w+)\s*,([^)]*)\)/g)) {
  if (nums[m[2]] !== undefined)
    subs.set(m[1] + ":" + nums[m[2]], {
      name: m[2],
      types: m[3]
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x !== "0"),
    });
}
function decode(b) {
  const info = inspectRbf(b);
  b = Buffer.from(b);
  const objects = [];
  for (let k = 0; k < info.objectCount; k++) {
    let p = info.offsets[k],
      end = info.offsets[k + 1] ?? b.length;
    const params = [];
    if (b.readUInt16LE(22 + k * 12) === 1) {
      const n = b[p++];
      for (let j = 0; j < n; j++) {
        const d = b[p++];
        params.push({ d, size: (d & 7) === 4 ? b[p++] : [1, 2, 4, 4][d & 7] });
      }
    }
    const start = p,
      ins = [];
    function par(t) {
      const at = p,
        x = b[p++];
      let a = { at, t };
      if (!(x & 128)) {
        if (x & 64) return { ...a, scope: x & 32 ? "g" : "l", off: x & 31 };
        return { ...a, n: x & 32 ? (x & 63) - 64 : x & 63 };
      }
      if (!(x & 64) && (x & 7) === 4) {
        const e = b.indexOf(0, p);
        if (e < 0) throw Error("unterminated string");
        a.str = b.toString("utf8", p, e);
        p = e + 1;
        return a;
      }
      const len = { 1: 1, 2: 2, 3: 4 }[x & 7];
      if (!len) throw Error("bad parameter " + x.toString(16) + " at " + at);
      if (x & 64) {
        a.scope = x & 32 ? "g" : "l";
        a.off = b.readUIntLE(p, len);
        a.handle = !!(x & 16);
      } else {
        a.n = b.readIntLE(p, len);
        if (len === 4) a.f = b.readFloatLE(p);
      }
      p += len;
      return a;
    }
    while (p < end) {
      const at = p,
        op = b[p++],
        meta = ops.get(op);
      if (!meta) throw Error("unknown opcode " + op + " at " + at);
      let name = meta.name,
        ts = [...meta.types],
        args = [];
      for (let i = 0; i < ts.length; i++) {
        const t = ts[i];
        if (t === "SUBP") {
          const sub = subs.get(ts[++i] + ":" + args.at(-1).n);
          if (!sub) throw Error("unknown subcode " + name + " " + args.at(-1).n);
          name += "." + sub.name;
          ts.push(...sub.types);
          continue;
        }
        if (t === "PARNO") {
          const n = par("PAR8");
          args.push(n);
          for (let j = 0; j < n.n; j++) args.push(par("PAR32"));
        } else args.push(par(t));
      }
      if (p > end) throw Error("instruction overruns object");
      ins.push({ at, end: p, op, name, args });
    }
    const boundaries = new Set(ins.map((x) => x.at));
    for (const i of ins) {
      if (["JR", "JR_FALSE", "JR_TRUE"].includes(i.name)) {
        const dest = i.end + i.args.at(-1).n;
        if (!boundaries.has(dest)) throw Error("jump off boundary " + i.at + " -> " + dest);
      }
    }
    objects.push({ start, end, params, ins, local: b.readUInt32LE(24 + k * 12) });
  }
  return { info, objects };
}
class VM {
  constructor(d, scenario = {}) {
    this.d = d;
    this.s = scenario;
    this.g = Buffer.alloc(d.info.globalBytes);
    this.arrays = new Map();
    this.files = new Map();
    this.handles = new Map();
    this.next = 1;
    this.trace = [];
    this.time = 1000;
    this.frames = [];
    this.steps = 0;
    this.covered = new Set();
    this.modes = {};
    this.finished = false;
    this.start(0);
  }
  start(i, ret) {
    const o = this.d.objects[i];
    const f = { i, o, pc: o.start, l: Buffer.alloc(o.local), ret };
    this.frames.push(f);
    return f;
  }
  f() {
    return this.frames.at(-1);
  }
  mem(a) {
    let b = a.scope === "g" ? this.g : this.f().l,
      off = a.off;
    if (a.handle) {
      const ar = this.arrays.get(b.readUInt16LE(off));
      if (!ar) throw Error("invalid handle " + off);
      b = ar.b;
      off = 0;
    }
    return { b, off };
  }
  read(a, t = a.t) {
    if (a.str !== undefined) return a.str;
    if (a.scope) {
      const { b, off } = this.mem(a);
      const n = t === "PAR8" ? 1 : t === "PAR16" ? 2 : 4;
      if (off + n > b.length) throw Error("memory read bounds");
      return t === "PARF" ? b.readFloatLE(off) : b.readIntLE(off, n);
    }
    if (t === "PARF") {
      if (a.f !== undefined) return a.f;
      const b = Buffer.alloc(4);
      b.writeInt32LE(a.n);
      return b.readFloatLE();
    }
    return a.n;
  }
  write(a, v, t = a.t) {
    if (!a.scope) throw Error("write to constant");
    const { b, off } = this.mem(a);
    const n = t === "PAR8" ? 1 : t === "PAR16" ? 2 : 4;
    if (off + n > b.length) throw Error("memory write bounds");
    if (t === "PARF") b.writeFloatLE(v, off);
    else b.writeUIntLE((Math.trunc(v) >>> 0) % 2 ** (n * 8), off, n);
  }
  str(a) {
    if (a.str !== undefined) return a.str;
    const { b, off } = this.mem(a);
    const end = b.indexOf(0, off);
    return b.toString("utf8", off, end < 0 ? b.length : end);
  }
  put(a, s) {
    const { b, off } = this.mem(a);
    if (off + Buffer.byteLength(s) + 1 > b.length) throw Error("string memory bounds");
    b.write(s, off);
    b[off + Buffer.byteLength(s)] = 0;
  }
  array(a) {
    const ar = this.arrays.get(this.read(a, "PAR16"));
    if (!ar) throw Error("invalid array handle " + this.read(a, "PAR16"));
    return ar;
  }
  run() {
    try {
      while (this.frames.length && this.steps++ < 12000 && !this.finished) {
        const f = this.f(),
          i = f.o.ins.find((x) => x.at === f.pc);
        if (!i) throw Error("bad PC " + f.pc);
        this.covered.add(i.at);
        f.pc = i.end;
        this.execute(i);
      }
      return {
        status: this.bounded
          ? "bounded"
          : this.finished || !this.frames.length
            ? "ended"
            : "bounded",
        steps: this.steps,
        trace: this.trace,
        globals: this.g.toString("hex"),
        covered: this.covered.size,
        arrays: [...this.arrays].map(([id, ar]) => ({
          id,
          type: ar.t,
          values: Array.from({ length: ar.b.length / ar.size }, (_, j) =>
            ar.t === "PARF" ? ar.b.readFloatLE(j * ar.size) : ar.b.readIntLE(j * ar.size, ar.size),
          ),
        })),
      };
    } catch (e) {
      return {
        status: "error",
        error: e.message,
        pc: this.f()?.pc,
        steps: this.steps,
        trace: this.trace,
        covered: this.covered.size,
      };
    }
  }
  execute(i) {
    let a = i.args,
      n = i.name.replace("STRINGS.", "STRING.");
    const r = (j, t) => this.read(a[j], t),
      w = (j, v, t) => this.write(a[j], v, t),
      s = (j) => this.str(a[j]);
    if (n === "OBJECT_END") {
      this.frames.pop();
      return;
    }
    if (n === "PROGRAM_STOP") {
      this.finished = true;
      return;
    }
    if (n === "SLEEP") return;
    if (n === "JR") {
      this.f().pc += r(0);
      return;
    }
    if (n === "JR_FALSE" || n === "JR_TRUE") {
      if ((r(0) !== 0) === (n === "JR_TRUE")) this.f().pc += r(1);
      return;
    }
    if (n === "CALL") {
      const id = r(0) - 1,
        caller = this.f(),
        callee = this.start(id, { caller, args: a.slice(2) });
      let off = 0;
      callee.o.params.forEach((p, j) => {
        if (p.d & 128) {
          const x = a[j + 2];
          const save = this.frames.pop();
          let data;
          if ((p.d & 7) === 4) data = Buffer.from(this.str(x) + "\0");
          else {
            const t = ["PAR8", "PAR16", "PAR32", "PARF"][p.d & 7];
            data = Buffer.alloc(p.size);
            const val = this.read(x, t);
            if (t === "PARF") data.writeFloatLE(val);
            else data.writeIntLE(val, 0, p.size);
          }
          this.frames.push(save);
          data.copy(callee.l, off, 0, p.size);
        }
        off += p.size;
      });
      return;
    }
    if (n === "RETURN") {
      const callee = this.frames.pop(),
        ret = callee.ret;
      let off = 0;
      if (ret)
        callee.o.params.forEach((p, j) => {
          if (p.d & 64) {
            const dst = this.mem(ret.args[j]);
            callee.l.copy(dst.b, dst.off, off, off + p.size);
          }
          off += p.size;
        });
      return;
    }
    if (n === "OBJECT_START") {
      this.trace.push({ op: n, id: r(0) });
      this.start(r(0) - 1);
      return;
    }
    if (n.startsWith("MOVE")) {
      w(1, r(0));
      return;
    }
    if (/^(ADD|SUB|MUL|DIV)(8|16|32|F)$/.test(n)) {
      const x = r(0),
        y = r(1);
      w(
        2,
        n.startsWith("ADD")
          ? x + y
          : n.startsWith("SUB")
            ? x - y
            : n.startsWith("MUL")
              ? x * y
              : x / y,
      );
      return;
    }
    if (/^(AND|OR|XOR)(8|16|32)$/.test(n)) {
      w(2, n.startsWith("AND") ? r(0) & r(1) : n.startsWith("XOR") ? r(0) ^ r(1) : r(0) | r(1));
      return;
    }
    if (n.startsWith("CP_")) {
      const x = r(0),
        y = r(1),
        op = n.slice(3).replace(/(8|16|32|F)$/, "");
      w(
        2,
        Number({ LT: x < y, GT: x > y, LTEQ: x <= y, GTEQ: x >= y, EQ: x === y, NEQ: x !== y }[op]),
      );
      return;
    }
    if (n.startsWith("MATH.")) {
      const sub = n.split(".")[1],
        x = r(1),
        y = a.length > 3 ? r(2) : 0;
      const val = {
        ABS: () => Math.abs(x),
        POW: () => x ** y,
        MOD: () => x % y,
        FLOOR: () => Math.floor(x),
        ROUND: () => Math.round(x),
        CEIL: () => Math.ceil(x),
      }[sub];
      if (!val) throw Error("unsupported " + n);
      w(a.length - 1, val());
      return;
    }
    if (n.startsWith("STRING.")) {
      const sub = n.split(".")[1];
      if (sub === "DUPLICATE") {
        this.put(a[2], s(1));
        return;
      }
      if (sub === "ADD") {
        this.put(a[3], s(1) + s(2));
        return;
      }
      if (sub === "STRIP") {
        this.put(a[2], s(1).trim());
        return;
      }
      if (sub === "GET_SIZE") {
        w(2, Buffer.byteLength(s(1)));
        return;
      }
      if (sub === "VALUE_FORMATTED" || sub === "NUMBER_FORMATTED") {
        const v = r(1),
          fmt = s(2);
        this.put(
          a[4],
          fmt === "%g"
            ? Number(v.toPrecision(6)).toString()
            : fmt === "%02X"
              ? (v & 255).toString(16).toUpperCase().padStart(2, "0")
              : String(v),
        );
        return;
      }
      if (sub === "COMPARE") {
        w(3, Number(s(1) === s(2)));
        return;
      }
      throw Error("unsupported " + n);
    }
    if (n === "TIMER_READ") {
      w(0, this.time);
      return;
    }
    if (n === "TIMER_WAIT") {
      this.time += r(0);
      w(1, this.time);
      this.trace.push({ op: n, ms: r(0) });
      return;
    }
    if (n === "TIMER_READY") return;
    if (n.startsWith("UI_DRAW.")) {
      const sub = n.split(".")[1];
      this.trace.push({
        op: n,
        args: a
          .slice(1)
          .map((x, j) =>
            ["TEXT", "BMPFILE"].includes(sub) && j === 3 ? this.str(x) : this.read(x),
          ),
      });
      if (this.trace.length > 100) {
        this.bounded = true;
        this.finished = true;
      }
      return;
    }
    if (n === "UI_READ.GET_LBATT") {
      w(1, 75);
      return;
    }
    if (n === "COM_GET.GET_BRICKNAME") {
      this.put(a[2], "AuditEV3");
      return;
    }
    if (n.startsWith("UI_WRITE.")) {
      this.trace.push({ op: n, args: a.slice(1).map((x) => this.read(x)) });
      return;
    }
    if (n.startsWith("UI_BUTTON.")) {
      if (n.endsWith("PRESSED") || n.endsWith("SHORTPRESS"))
        w(2, Number(r(1) === (this.s.button ?? 2)));
      return;
    }
    if (n === "NOTE_TO_FREQ") {
      const note = s(0),
        semitones = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      w(
        1,
        Math.round(440 * 2 ** (((Number(note.at(-1)) + 1) * 12 + semitones[note[0]] - 69) / 12)),
      );
      return;
    }
    if (n.startsWith("SOUND")) {
      this.trace.push({
        op: n,
        args: a
          .slice(n.includes(".") ? 1 : 0)
          .map((x) => (n === "SOUND.PLAY" && x === a[2] ? this.str(x) : (x.str ?? this.read(x)))),
      });
      return;
    }
    if (n.startsWith("OUTPUT_")) {
      if (n === "OUTPUT_GET_COUNT") w(2, this.s.motorCount ?? 10);
      else if (n === "OUTPUT_TEST") w(2, 0);
      this.trace.push({ op: n, args: a.map((x) => this.read(x)) });
      return;
    }
    if (n === "INPUT_READY") return;
    if (n === "INPUT_READ") {
      w(4, this.s.sensor ?? 42);
      return;
    }
    if (n === "INPUT_DEVICE.GET_NAME") {
      this.put(a[4], "EV3-COLOR");
      return;
    }
    if (n === "INPUT_DEVICE.GET_TYPEMODE") {
      w(3, 29);
      w(4, this.modes[r(2)] ?? 0);
      return;
    }
    if (n === "INPUT_DEVICE.READY_RAW" || n === "INPUT_READEXT") {
      const shift = n === "INPUT_READEXT" ? 0 : 1,
        idx = n === "INPUT_READEXT" ? 6 : 6;
      if (r(shift + 3) !== -1) this.modes[r(shift + 1)] = r(shift + 3);
      for (let j = idx; j < a.length; j++) w(j, this.s.sensor ?? 42, "PAR32");
      return;
    }
    if (n === "INPUT_DEVICE.SETUP") {
      const dst = this.mem(a[8]);
      dst.b[dst.off] = this.s.i2c ?? 42;
      return;
    }
    if (n === "MEMORY_READ" || n === "MEMORY_WRITE") {
      const id = r(1),
        off = r(2),
        len = r(3),
        mem = id === 0 ? this.g : this.frames.find((x) => x.i === id - 1)?.l;
      if (!mem) throw Error("missing object memory");
      const dst = this.mem(a[4]);
      if (n === "MEMORY_READ") mem.copy(dst.b, dst.off, off, off + len);
      else dst.b.copy(mem, off, dst.off, dst.off + len);
      return;
    }
    if (n.startsWith("ARRAY.CREATE")) {
      const size = { CREATE8: 1, CREATE16: 2, CREATE32: 4, CREATEF: 4 }[n.split(".")[1]],
        len = r(1);
      if (len < 0 || len > 10000) throw Error("invalid array size " + len);
      const id = this.next++;
      this.arrays.set(id, {
        b: Buffer.alloc(size * len),
        size,
        t: n.endsWith("F") ? "PARF" : size === 1 ? "PAR8" : size === 2 ? "PAR16" : "PAR32",
      });
      w(2, id);
      return;
    }
    if (n === "ARRAY.FILL") {
      const ar = this.array(a[1]);
      const v = r(2, ar.t);
      for (let off = 0; off < ar.b.length; off += ar.size) {
        if (ar.t === "PARF") ar.b.writeFloatLE(v, off);
        else ar.b.writeIntLE(v, off, ar.size);
      }
      return;
    }
    if (n === "ARRAY.SIZE") {
      w(2, this.array(a[1]).b.length / this.array(a[1]).size);
      return;
    }
    if (n === "ARRAY.DELETE") {
      this.arrays.delete(r(1));
      return;
    }
    if (n === "ARRAY_READ" || n === "ARRAY_WRITE") {
      const ar = this.array(a[0]),
        off = r(1) * ar.size;
      if (off < 0 || off + ar.size > ar.b.length)
        throw Error("array bounds " + off + "/" + ar.b.length);
      if (n === "ARRAY_READ")
        w(2, ar.t === "PARF" ? ar.b.readFloatLE(off) : ar.b.readIntLE(off, ar.size), ar.t);
      else {
        const v = r(2, ar.t);
        if (ar.t === "PARF") ar.b.writeFloatLE(v, off);
        else ar.b.writeUIntLE((v >>> 0) % 2 ** (8 * ar.size), off, ar.size);
      }
      return;
    }
    if (n === "ARRAY_APPEND") {
      const ar = this.array(a[0]);
      ar.b = Buffer.concat([ar.b, Buffer.from([r(1)])]);
      return;
    }
    if (n.startsWith("FILE.OPEN_")) {
      const name = s(1),
        id = this.next++;
      if (n === "FILE.OPEN_WRITE") this.files.set(name, Buffer.alloc(0));
      this.handles.set(id, { name, p: 0 });
      w(2, id);
      if (n === "FILE.OPEN_READ") w(3, this.files.get(name)?.length ?? 0);
      return;
    }
    if (n === "FILE.CLOSE") return;
    if (n === "FILE.WRITE_TEXT" || n === "FILE.WRITE_BYTES") {
      const f = this.handles.get(r(1)),
        data =
          n === "FILE.WRITE_TEXT"
            ? Buffer.from(s(3) + "\n")
            : a[3].scope
              ? this.mem(a[3]).b.subarray(this.mem(a[3]).off, this.mem(a[3]).off + r(2))
              : Buffer.from([r(3)]);
      this.files.set(f.name, Buffer.concat([this.files.get(f.name) ?? Buffer.alloc(0), data]));
      return;
    }
    if (n === "FILE.READ_TEXT" || n === "FILE.READ_BYTES") {
      const f = this.handles.get(r(1)),
        data = this.files.get(f.name) ?? Buffer.alloc(0),
        text = n === "FILE.READ_TEXT",
        len = r(text ? 3 : 2),
        dst = this.mem(a[text ? 4 : 3]);
      const count = Math.min(len, data.length - f.p);
      data.copy(dst.b, dst.off, f.p, f.p + count);
      f.p += count;
      if (text && r(2) !== 0) {
        dst.b[dst.off + count] = 0;
        this.put(a[4], this.str(a[4]).replace(/[\r\n]+$/, ""));
      }
      return;
    }
    if (n === "MAILBOX_OPEN") return;
    if (n === "MAILBOX_TEST") {
      w(1, this.s.mailboxNew ? 0 : 1);
      return;
    }
    throw Error("unsupported " + n);
  }
}
// Literal bytes independently check the central VM representation rule:
// MOVEF_F LC0(2) preserves bits 0x00000002; MOVE32_F LC0(2) converts to 2.0.
{
  const code = Buffer.from([0x3f, 0x02, 0x60, 0x3b, 0x02, 0x64, 0x0a]);
  const image = Buffer.alloc(28 + code.length);
  image.write("LEGO");
  image.writeUInt32LE(image.length, 4);
  image.writeUInt16LE(104, 8);
  image.writeUInt16LE(1, 10);
  image.writeUInt32LE(8, 12);
  image.writeUInt32LE(28, 16);
  code.copy(image, 28);
  const result = new VM(decode(image)).run();
  assert.equal(result.status, "ended");
  const memory = Buffer.from(result.globals, "hex");
  assert.equal(memory.readUInt32LE(0), 2);
  assert.equal(memory.readFloatLE(4), 2);
}
async function projects(dir) {
  const es = await fs.readdir(dir, { withFileTypes: true });
  if (es.some((e) => e.name === "kobrixa.json")) return [dir];
  return (
    await Promise.all(
      es
        .filter((e) => e.isDirectory() && !["build", "node_modules"].includes(e.name))
        .map((e) => projects(path.join(dir, e.name))),
    )
  ).flat();
}
const out = path.resolve(outputPath);
await fs.mkdir(out, { recursive: true });
const results = [];
for (const dir of (await projects(path.join(root, "examples"))).sort()) {
  const project = path.relative(path.join(root, "examples"), dir),
    loaded = await loadProject(dir),
    front = await new BasicPlusFrontend().compile(loaded.project, new AbortController().signal),
    back = await new EV3Backend().compile(front.ir, new AbortController().signal);
  if (!back.rbf) throw Error(project + JSON.stringify(back.diagnostics));
  const decoded = decode(back.rbf);
  const sim = new VM(decoded).run();
  const variants = [];
  if (
    project.startsWith("sensors/") ||
    project.startsWith("capstones/") ||
    project === "motors/motor-counter"
  )
    for (const scenario of [
      { sensor: 0, motorCount: 0, button: 1 },
      { sensor: 75, motorCount: -1, button: 2 },
    ])
      variants.push({ scenario, ...new VM(decoded, scenario).run() });
  const filename = project.replaceAll("/", "--");
  await fs.writeFile(path.join(out, filename + ".rbf"), back.rbf);
  await fs.writeFile(
    path.join(out, filename + ".json"),
    JSON.stringify({ ir: front.ir, decoded, sim, variants }, null, 2),
  );
  results.push({
    project,
    bytes: back.rbf.length,
    sha256: createHash("sha256").update(back.rbf).digest("hex"),
    instructions: decoded.objects.reduce((n, o) => n + o.ins.length, 0),
    ...sim,
    variants,
  });
  console.log(
    project,
    sim.status,
    sim.error ?? "",
    sim.trace
      .filter((x) => x.op === "UI_DRAW.TEXT" || x.op === "UI_DRAW.VALUE")
      .slice(0, 8)
      .map((x) => x.args),
  );
}
await fs.writeFile(path.join(out, "results.json"), JSON.stringify(results, null, 2));
