import type { DeviceDescriptor, DeviceTransport, Ev3Connection } from "./contracts.js";
import { FramedConnection, frameMessage, parseFrame } from "./framing.js";
import { EV3DeviceSession } from "./session.js";

export type MockResponder = (payload: Uint8Array) => Uint8Array | Promise<Uint8Array>;

export class MockConnection extends FramedConnection implements Ev3Connection {
  closed = false;

  constructor(private readonly responder: MockResponder) {
    super();
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  protected async exchangeFrame(frame: Uint8Array): Promise<Uint8Array> {
    const request = parseFrame(frame);
    const reply = await this.responder(request.payload);
    return frameMessage(request.counter, reply);
  }
}

export class MockTransport implements DeviceTransport {
  readonly descriptor: DeviceDescriptor = { id: "mock:ev3", name: "Mock EV3", transport: "mock" };

  constructor(private readonly responder: MockResponder) {}

  async discover(signal: AbortSignal): Promise<DeviceDescriptor[]> {
    signal.throwIfAborted();
    return [this.descriptor];
  }

  async connect(target: DeviceDescriptor, signal: AbortSignal): Promise<EV3DeviceSession> {
    signal.throwIfAborted();
    return new EV3DeviceSession(target, new MockConnection(this.responder));
  }
}
