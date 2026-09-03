import type { BackendResult, CompilerBackend, Diagnostic } from "@kobrixa/compiler";
import type {
  IRBasicBlock,
  IRFunction,
  IRInstruction,
  IRType,
  IRValue,
  KobrixaIR,
  SourceSpan,
} from "@kobrixa/ir";
import { lc, lcf, lcs, lv, relativeOffset } from "./encoding.js";
import { INPUT_DEVICE, OP, SOUND, UI_DRAW } from "./opcodes.js";
import { createRbf, inspectRbf, type RbfObject } from "./rbf.js";

const OBJECT_EPILOGUE = Symbol("object-epilogue");
type Label = string | typeof OBJECT_EPILOGUE;

interface Allocation {
  offset: number;
  type: IRType;
}

interface Patch {
  at: number;
  after: number;
  target: Label;
}

function diagnostic(code: string, message: string, span?: SourceSpan): Diagnostic {
  return {
    code,
    severity: "error",
    file: span?.file ?? "<generated>",
    range: span
      ? {
          startLine: span.start.line,
          startColumn: span.start.column,
          endLine: span.end.line,
          endColumn: span.end.column,
        }
      : { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
    message,
  };
}

function sizeOf(type: IRType): number {
  if (type.kind === "boolean") return 1;
  if (type.kind === "string") return 64;
  if (type.kind === "array") return 4;
  return type.kind === "void" ? 0 : 4;
}

function motorMask(value: IRValue): number | undefined {
  if (value.kind !== "string") return undefined;
  let mask = 0;
  for (const char of value.value.toLocaleUpperCase("en-US")) {
    const index = "ABCD".indexOf(char);
    if (index < 0) return undefined;
    mask |= 1 << index;
  }
  return mask || undefined;
}

class ObjectAssembler {
  readonly bytes: number[] = [];
  readonly labels = new Map<Label, number>();
  readonly patches: Patch[] = [];
  readonly allocations = new Map<string, Allocation>();
  readonly diagnostics: Diagnostic[] = [];
  localBytes = 0;

  constructor(readonly fn: IRFunction) {
    for (const variable of [...fn.parameters, ...fn.locals]) {
      const alignment = sizeOf(variable.type) >= 4 ? 4 : 1;
      this.localBytes = Math.ceil(this.localBytes / alignment) * alignment;
      this.allocations.set(variable.name.toLocaleLowerCase("en-US"), {
        offset: this.localBytes,
        type: variable.type,
      });
      this.localBytes += sizeOf(variable.type);
    }
  }

  assemble(signal: AbortSignal): Uint8Array {
    for (const block of this.fn.blocks) {
      signal.throwIfAborted();
      this.labels.set(block.id, this.bytes.length);
      for (const instruction of block.instructions) this.instruction(instruction);
      this.terminator(block);
    }
    this.labels.set(OBJECT_EPILOGUE, this.bytes.length);
    this.bytes.push(this.fn.name === "main" ? OP.OBJECT_END : OP.RETURN);
    for (const patch of this.patches) {
      const target = this.labels.get(patch.target);
      if (target === undefined) {
        this.diagnostics.push(
          diagnostic("EV31003", `Unknown bytecode label '${String(patch.target)}'.`),
        );
        continue;
      }
      const encoded = relativeOffset(target - patch.after);
      this.bytes.splice(patch.at, encoded.length, ...encoded);
    }
    return Uint8Array.from(this.bytes);
  }

  private parameter(value: IRValue): number[] | undefined {
    if (value.kind === "number") return lcf(value.value);
    if (value.kind === "integer") return lc(value.value);
    if (value.kind === "boolean") return lc(value.value ? 1 : 0);
    if (value.kind === "string") return lcs(value.value);
    const allocation = this.allocations.get(value.name.toLocaleLowerCase("en-US"));
    if (!allocation) return undefined;
    return lv(allocation.offset);
  }

  private typeOf(value: IRValue): IRType | undefined {
    if (value.kind !== "variable") return { kind: value.kind };
    return this.allocations.get(value.name.toLocaleLowerCase("en-US"))?.type;
  }

  private sensorPort(value: IRValue): number[] | undefined {
    if ((value.kind === "integer" || value.kind === "number") && Number.isInteger(value.value)) {
      return value.value >= 1 && value.value <= 4 ? lc(value.value - 1) : undefined;
    }
    return undefined;
  }

  private instruction(instruction: IRInstruction): void {
    const target =
      "target" in instruction && instruction.target
        ? this.allocations.get(instruction.target.toLocaleLowerCase("en-US"))
        : undefined;
    if ("target" in instruction && instruction.target && !target) {
      this.diagnostics.push(
        diagnostic("EV31004", `No allocation for '${instruction.target}'.`, instruction.span),
      );
      return;
    }
    if (instruction.op === "assign" && target) {
      const source = this.parameter(instruction.value);
      if (!source || target.type.kind === "string" || target.type.kind === "array") {
        this.diagnostics.push(
          diagnostic(
            "EV32001",
            "String and array assignment awaits compatibility corpus coverage.",
            instruction.span,
          ),
        );
        return;
      }
      const opcode =
        target.type.kind === "boolean"
          ? OP.MOVE_8_8
          : target.type.kind === "integer"
            ? OP.MOVE_32_32
            : OP.MOVE_F_F;
      this.bytes.push(opcode, ...source, ...lv(target.offset));
      return;
    }
    if (instruction.op === "unary" && target) {
      const source = this.parameter(instruction.value);
      if (!source) return;
      if (instruction.operator === "not")
        this.bytes.push(OP.CP_EQ_8, ...source, ...lc(0), ...lv(target.offset));
      else if (target.type.kind === "integer")
        this.bytes.push(OP.SUB_32, ...lc(0), ...source, ...lv(target.offset));
      else this.bytes.push(OP.SUB_F, ...lcf(0), ...source, ...lv(target.offset));
      return;
    }
    if (instruction.op === "binary" && target) {
      const left = this.parameter(instruction.left);
      const right = this.parameter(instruction.right);
      if (!left || !right) return;
      const integerOperands =
        this.typeOf(instruction.left)?.kind === "integer" &&
        this.typeOf(instruction.right)?.kind === "integer";
      const floatOpcodes: Partial<
        Record<Extract<IRInstruction, { op: "binary" }>["operator"], number>
      > = {
        "+": OP.ADD_F,
        "-": OP.SUB_F,
        "*": OP.MUL_F,
        "/": OP.DIV_F,
        "<": OP.CP_LT_F,
        ">": OP.CP_GT_F,
        "<=": OP.CP_LTEQ_F,
        ">=": OP.CP_GTEQ_F,
        "=": OP.CP_EQ_F,
        "<>": OP.CP_NEQ_F,
      };
      const integerOpcodes: typeof floatOpcodes = {
        "+": OP.ADD_32,
        "-": OP.SUB_32,
        "*": OP.MUL_32,
        "/": OP.DIV_32,
        "<": OP.CP_LT_32,
        ">": OP.CP_GT_32,
        "<=": OP.CP_LTEQ_32,
        ">=": OP.CP_GTEQ_32,
        "=": OP.CP_EQ_32,
        "<>": OP.CP_NEQ_32,
      };
      const opcodes: typeof floatOpcodes = {
        ...(integerOperands ? integerOpcodes : floatOpcodes),
        and: OP.AND_8,
        or: OP.OR_8,
      };
      const opcode = opcodes[instruction.operator];
      if (opcode === undefined || instruction.operator === "%") {
        this.diagnostics.push(
          diagnostic(
            "EV32002",
            `Operator '${instruction.operator}' is not lowered yet.`,
            instruction.span,
          ),
        );
        return;
      }
      this.bytes.push(opcode, ...left, ...right, ...lv(target.offset));
      return;
    }
    if (instruction.op === "call") {
      this.diagnostics.push(
        diagnostic(
          "EV32003",
          "User function calls await compatibility corpus calling-convention fixtures.",
          instruction.span,
        ),
      );
      return;
    }
    if (instruction.op === "ev3-call") this.ev3Call(instruction, target);
  }

  private ev3Call(
    instruction: Extract<IRInstruction, { op: "ev3-call" }>,
    target: Allocation | undefined,
  ): void {
    const args = instruction.args.map((value) => this.parameter(value));
    if (args.some((value) => !value)) {
      this.diagnostics.push(
        diagnostic("EV31005", "Unable to encode an EV3 call argument.", instruction.span),
      );
      return;
    }
    const arg = (index: number): number[] => args[index]!;
    switch (instruction.operation) {
      case "LCD.Clear":
        this.bytes.push(OP.UI_DRAW, ...lc(UI_DRAW.CLEAN));
        return;
      case "LCD.Update":
        this.bytes.push(OP.UI_DRAW, ...lc(UI_DRAW.UPDATE));
        return;
      case "LCD.Text":
        this.bytes.push(OP.UI_DRAW, ...lc(UI_DRAW.SELECT_FONT), ...arg(3));
        this.bytes.push(
          OP.UI_DRAW,
          ...lc(UI_DRAW.TEXT),
          ...arg(0),
          ...arg(1),
          ...arg(2),
          ...arg(4),
        );
        return;
      case "LCD.Value":
        this.bytes.push(
          OP.UI_DRAW,
          ...lc(UI_DRAW.VALUE),
          ...arg(0),
          ...arg(1),
          ...arg(2),
          ...arg(3),
          ...arg(4),
          ...arg(5),
        );
        return;
      case "LCD.Write":
        this.bytes.push(OP.UI_DRAW, ...lc(UI_DRAW.TEXT), ...lc(1), ...arg(0), ...arg(1), ...arg(2));
        return;
      case "LCD.Line":
        this.bytes.push(
          OP.UI_DRAW,
          ...lc(UI_DRAW.LINE),
          ...arg(0),
          ...arg(1),
          ...arg(2),
          ...arg(3),
          ...arg(4),
        );
        return;
      case "LCD.Circle":
        this.bytes.push(
          OP.UI_DRAW,
          ...lc(UI_DRAW.CIRCLE),
          ...arg(0),
          ...arg(1),
          ...arg(2),
          ...arg(3),
        );
        return;
      case "Speaker.Tone":
        this.bytes.push(OP.SOUND, ...lc(SOUND.TONE), ...arg(0), ...arg(1), ...arg(2));
        return;
      case "Speaker.Play":
        this.bytes.push(OP.SOUND, ...lc(SOUND.PLAY), ...arg(0), ...arg(1));
        return;
      case "Speaker.Stop":
        this.bytes.push(OP.SOUND, ...lc(SOUND.BREAK));
        return;
      case "Program.End":
        this.bytes.push(OP.PROGRAM_STOP, ...lc(1));
        return;
      case "Program.Delay": {
        const scratch = Math.ceil(this.localBytes / 4) * 4;
        this.localBytes = scratch;
        this.localBytes += 4;
        this.bytes.push(OP.TIMER_WAIT, ...arg(0), ...lv(scratch), OP.TIMER_READY, ...lv(scratch));
        return;
      }
      case "Motor.Start": {
        const mask = motorMask(instruction.args[0]!);
        if (!mask) break;
        this.bytes.push(
          OP.OUTPUT_POWER,
          ...lc(0),
          ...lc(mask),
          ...arg(1),
          OP.OUTPUT_START,
          ...lc(0),
          ...lc(mask),
        );
        return;
      }
      case "Motor.Stop": {
        const mask = motorMask(instruction.args[0]!);
        if (!mask) break;
        this.bytes.push(OP.OUTPUT_STOP, ...lc(0), ...lc(mask), ...arg(1));
        return;
      }
      case "Motor.Move": {
        const mask = motorMask(instruction.args[0]!);
        if (!mask) break;
        this.bytes.push(
          OP.OUTPUT_STEP_SPEED,
          ...lc(0),
          ...lc(mask),
          ...arg(1),
          ...lc(0),
          ...arg(2),
          ...lc(0),
          ...arg(3),
        );
        this.bytes.push(OP.OUTPUT_READY, ...lc(0), ...lc(mask));
        return;
      }
      case "Motor.GetCount": {
        const mask = motorMask(instruction.args[0]!);
        if (!mask || !target) break;
        const port = Math.log2(mask);
        if (!Number.isInteger(port)) break;
        this.bytes.push(OP.OUTPUT_GET_COUNT, ...lc(0), ...lc(port), ...lv(target.offset));
        return;
      }
      case "Sensor.ReadPercent": {
        if (!target) break;
        const port = this.sensorPort(instruction.args[0]!);
        if (!port) {
          this.diagnostics.push(
            diagnostic(
              "EV32011",
              "Sensor port must be a constant from 1 through 4 in v1.",
              instruction.span,
            ),
          );
          return;
        }
        this.bytes.push(
          OP.INPUT_READ,
          ...lc(0),
          ...port,
          ...lc(0),
          ...lc(-1),
          ...lv(target.offset),
        );
        return;
      }
      case "Sensor.ReadRawValue": {
        if (!target) break;
        const port = this.sensorPort(instruction.args[0]!);
        const mode = instruction.args[1];
        if (!port || !mode || (mode.kind !== "integer" && mode.kind !== "number")) {
          this.diagnostics.push(
            diagnostic(
              "EV32012",
              "Sensor port must be a constant from 1 through 4 and mode must be an integer in v1.",
              instruction.span,
            ),
          );
          return;
        }
        if (!Number.isInteger(mode.value) || mode.value < 0 || mode.value > 7) {
          this.diagnostics.push(
            diagnostic(
              "EV32013",
              "Sensor mode must be a constant from 0 through 7 in v1.",
              instruction.span,
            ),
          );
          return;
        }
        this.bytes.push(
          OP.INPUT_DEVICE,
          ...lc(INPUT_DEVICE.READY_RAW),
          ...lc(0),
          ...port,
          ...lc(0),
          ...lc(mode.value),
          ...lc(1),
          ...lv(target.offset),
        );
        return;
      }
      case "Sensor.ReadValue": {
        if (!target) break;
        const port = this.sensorPort(instruction.args[0]!);
        const mode = instruction.args[1];
        if (!port || !mode || (mode.kind !== "integer" && mode.kind !== "number")) {
          this.diagnostics.push(
            diagnostic(
              "EV32012",
              "Sensor port must be a constant from 1 through 4 and mode must be an integer in v1.",
              instruction.span,
            ),
          );
          return;
        }
        if (!Number.isInteger(mode.value) || mode.value < 0 || mode.value > 7) {
          this.diagnostics.push(
            diagnostic(
              "EV32013",
              "Sensor mode must be a constant from 0 through 7 in v1.",
              instruction.span,
            ),
          );
          return;
        }
        this.bytes.push(
          OP.INPUT_DEVICE,
          ...lc(INPUT_DEVICE.READY_SI),
          ...lc(0),
          ...port,
          ...lc(0),
          ...lc(mode.value),
          ...lc(1),
          ...lv(target.offset),
        );
        return;
      }
      case "Sensor.Wait": {
        const port = this.sensorPort(instruction.args[0]!);
        if (!port) break;
        this.bytes.push(OP.INPUT_READY, ...lc(0), ...port);
        return;
      }
    }
    this.diagnostics.push(
      diagnostic(
        "EV32010",
        `EV3 operation '${instruction.operation}' is catalogued but not lowered yet.`,
        instruction.span,
      ),
    );
  }

  private terminator(block: IRBasicBlock): void {
    const terminator = block.terminator;
    if (terminator.op === "stop") {
      this.bytes.push(OP.JR);
      this.addPatch(OBJECT_EPILOGUE);
      return;
    }
    if (terminator.op === "return") {
      if (terminator.value)
        this.diagnostics.push(
          diagnostic(
            "EV32004",
            "Function return values await calling-convention fixtures.",
            terminator.span,
          ),
        );
      this.bytes.push(OP.JR);
      this.addPatch(OBJECT_EPILOGUE);
      return;
    }
    if (terminator.op === "jump") {
      this.bytes.push(OP.JR);
      this.addPatch(terminator.target);
      return;
    }
    const condition = this.parameter(terminator.condition);
    if (!condition) return;
    this.bytes.push(OP.JR_FALSE, ...condition);
    this.addPatch(terminator.whenFalse);
    this.bytes.push(OP.JR);
    this.addPatch(terminator.whenTrue);
  }

  private addPatch(target: Label): void {
    const at = this.bytes.length;
    this.bytes.push(...relativeOffset(0));
    this.patches.push({ at, after: this.bytes.length, target });
  }
}

export class EV3Backend implements CompilerBackend {
  readonly id = "ev3-native" as const;

  async compile(ir: KobrixaIR, signal: AbortSignal): Promise<BackendResult> {
    const diagnostics: Diagnostic[] = [];
    const objects: RbfObject[] = [];
    const listing: string[] = [];
    for (const [index, fn] of ir.functions.entries()) {
      const assembler = new ObjectAssembler(fn);
      const code = assembler.assemble(signal);
      diagnostics.push(...assembler.diagnostics);
      objects.push({
        ownerObjectId: index === 0 ? 0 : 1,
        triggerCount: 0,
        localBytes: assembler.localBytes,
        code,
      });
      listing.push(
        `${index + 1}\t${fn.name}\tlocals=${assembler.localBytes}\t${[...code].map((byte) => byte.toString(16).padStart(2, "0")).join(" ")}`,
      );
    }
    if (diagnostics.some((item) => item.severity === "error")) return { diagnostics };
    const rbf = createRbf(objects);
    try {
      inspectRbf(rbf);
      return { rbf, listing: `${listing.join("\n")}\n`, diagnostics };
    } catch (error) {
      return {
        diagnostics: [
          diagnostic(
            "EV39000",
            error instanceof Error ? error.message : "Invalid generated EV3 image.",
          ),
        ],
      };
    }
  }
}
