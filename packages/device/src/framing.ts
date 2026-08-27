import type { Ev3Connection } from "./contracts.js";
import { DeviceOperationError } from "./errors.js";

export function frameMessage(counter: number, payload: Uint8Array): Uint8Array {
  if (payload.length > 0xffff - 2)
    throw new DeviceOperationError("protocol", "EV3 payload is too large.");
  const frame = new Uint8Array(payload.length + 4);
  const view = new DataView(frame.buffer);
  view.setUint16(0, payload.length + 2, true);
  view.setUint16(2, counter, true);
  frame.set(payload, 4);
  return frame;
}

export function parseFrame(frame: Uint8Array): { counter: number; payload: Uint8Array } {
  if (frame.length < 5)
    throw new DeviceOperationError("protocol", "EV3 reply is shorter than its header.");
  const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
  const length = view.getUint16(0, true);
  if (length !== frame.length - 2)
    throw new DeviceOperationError("protocol", "EV3 reply length does not match its header.");
  return { counter: view.getUint16(2, true), payload: frame.slice(4) };
}

export abstract class FramedConnection implements Ev3Connection {
  #counter = 0;
  #tail: Promise<void> = Promise.resolve();

  async exchange(payload: Uint8Array, signal: AbortSignal, timeoutMs = 5000): Promise<Uint8Array> {
    let release: () => void = () => undefined;
    const previous = this.#tail;
    this.#tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      signal.throwIfAborted();
      this.#counter = (this.#counter + 1) & 0xffff;
      const response = parseFrame(
        await this.exchangeFrame(frameMessage(this.#counter, payload), signal, timeoutMs),
      );
      if (response.counter !== this.#counter)
        throw new DeviceOperationError("protocol", "EV3 reply counter does not match the request.");
      return response.payload;
    } finally {
      release();
    }
  }

  abstract close(): Promise<void>;
  protected abstract exchangeFrame(
    frame: Uint8Array,
    signal: AbortSignal,
    timeoutMs: number,
  ): Promise<Uint8Array>;
}
