import type { DeviceDescriptor, DeviceSession, Ev3Connection } from "./contracts.js";
import { DeviceOperationError, normalizeDeviceError, withTimeout } from "./errors.js";
import { normalizeRemotePath } from "./path.js";

const SYSTEM_COMMAND_REPLY = 0x01;
const DIRECT_COMMAND_REPLY = 0x00;
const DIRECT_REPLY = 0x02;
const DIRECT_REPLY_ERROR = 0x04;
const BEGIN_DOWNLOAD = 0x92;
const CONTINUE_DOWNLOAD = 0x93;
const DELETE_FILE = 0x9c;
const SYSTEM_REPLY_OK = 0x00;
const SYSTEM_REPLY_END_OF_FILE = 0x08;

function uint32(value: number): number[] {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return [...bytes];
}

function lcs(value: string): number[] {
  return [0x84, ...new TextEncoder().encode(value), 0];
}

function systemStatusMessage(status: number): string {
  return (
    (
      {
        1: "Unknown file handle.",
        2: "File handle is not ready.",
        3: "File is corrupt.",
        4: "No file handles are available.",
        5: "EV3 denied file permission.",
        6: "EV3 rejected the path.",
        7: "File already exists.",
        8: "Unexpected end of file.",
        9: "File size is invalid.",
        10: "EV3 reported an unknown file error.",
        11: "EV3 rejected the filename.",
        12: "Illegal connection.",
      } as Record<number, string>
    )[status] ?? `EV3 system error ${status}.`
  );
}

export class EV3DeviceSession implements DeviceSession {
  connected = true;
  #operation: Promise<unknown> | undefined;

  constructor(
    readonly descriptor: DeviceDescriptor,
    private readonly connection: Ev3Connection,
  ) {}

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    this.connected = false;
    await this.connection.close();
  }

  upload(remotePath: string, data: Uint8Array, signal: AbortSignal): Promise<void> {
    return this.exclusive(async () => {
      const target = normalizeRemotePath(remotePath);
      if (!data.length)
        throw new DeviceOperationError("transfer", "Cannot upload an empty artifact.");
      const begin = await this.system(
        BEGIN_DOWNLOAD,
        Uint8Array.from([...uint32(data.length), ...new TextEncoder().encode(target), 0]),
        signal,
        10_000,
      );
      const handle = begin[0];
      if (handle === undefined)
        throw new DeviceOperationError("protocol", "EV3 did not return a download handle.");
      for (let offset = 0; offset < data.length; offset += 900) {
        signal.throwIfAborted();
        const chunk = data.slice(offset, Math.min(offset + 900, data.length));
        const finalChunk = offset + chunk.length === data.length;
        await this.system(
          CONTINUE_DOWNLOAD,
          Uint8Array.from([handle, ...chunk]),
          signal,
          10_000,
          finalChunk ? [SYSTEM_REPLY_OK, SYSTEM_REPLY_END_OF_FILE] : [SYSTEM_REPLY_OK],
        );
      }
    });
  }

  run(remotePath: string, signal: AbortSignal): Promise<void> {
    return this.exclusive(async () => {
      const target = normalizeRemotePath(remotePath);
      const bytecode = [0xc0, 0x08, 0x01, ...lcs(target), 0x60, 0x64, 0x03, 0x01, 0x60, 0x64, 0x00];
      await this.direct(Uint8Array.from([DIRECT_COMMAND_REPLY, 0x08, 0x00, ...bytecode]), signal);
    });
  }

  stop(_programName?: string, signal = new AbortController().signal): Promise<void> {
    return this.exclusive(() =>
      this.direct(Uint8Array.from([DIRECT_COMMAND_REPLY, 0x00, 0x00, 0x02, 0x01]), signal),
    );
  }

  delete(remotePath: string, signal: AbortSignal): Promise<void> {
    return this.exclusive(async () => {
      const target = normalizeRemotePath(remotePath);
      await this.system(
        DELETE_FILE,
        Uint8Array.from([...new TextEncoder().encode(target), 0]),
        signal,
        5000,
      );
    });
  }

  private async system(
    command: number,
    data: Uint8Array,
    signal: AbortSignal,
    timeout: number,
    acceptedStatuses: readonly number[] = [SYSTEM_REPLY_OK],
  ): Promise<Uint8Array> {
    const reply = await withTimeout(
      (bounded) =>
        this.connection.exchange(
          Uint8Array.from([SYSTEM_COMMAND_REPLY, command, ...data]),
          bounded,
          timeout,
        ),
      signal,
      timeout,
    );
    if (reply.length < 3 || (reply[0] !== 0x03 && reply[0] !== 0x05) || reply[1] !== command) {
      throw new DeviceOperationError("protocol", "Malformed EV3 system reply.");
    }
    const status = reply[2]!;
    if (!acceptedStatuses.includes(status)) {
      const category = status === 5 ? "permission" : status === 9 ? "transfer" : "device";
      throw new DeviceOperationError(category, systemStatusMessage(status));
    }
    return reply.slice(3);
  }

  private async direct(payload: Uint8Array, signal: AbortSignal): Promise<void> {
    const reply = await withTimeout(
      (bounded) => this.connection.exchange(payload, bounded, 5000),
      signal,
      5000,
    );
    if (reply[0] === DIRECT_REPLY_ERROR)
      throw new DeviceOperationError("device", "EV3 rejected the direct command.");
    if (reply[0] !== DIRECT_REPLY)
      throw new DeviceOperationError("protocol", "Malformed EV3 direct-command reply.");
  }

  private async exclusive<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.connected)
      throw new DeviceOperationError("connection", "The EV3 session is disconnected.", true);
    if (this.#operation)
      throw new DeviceOperationError(
        "device",
        "Another state-changing operation is already running.",
        true,
      );
    const pending = operation();
    this.#operation = pending;
    try {
      return await pending;
    } catch (error) {
      throw normalizeDeviceError(error, "device");
    } finally {
      this.#operation = undefined;
    }
  }
}
