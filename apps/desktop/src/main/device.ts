import { randomUUID } from "node:crypto";
import type { WebContents } from "electron";
import {
  DeviceOperationError,
  UsbTransport,
  WiFiTransport,
  normalizeDeviceError,
  type DeviceDescriptor,
  type DeviceSession,
} from "@kobrixa/device";
import type { DeviceEvent } from "../shared/api.js";
import type { BuildService } from "./build.js";

export class DeviceService {
  readonly #sessions = new Map<string, DeviceSession>();
  readonly #usb = new UsbTransport();
  readonly #wifi = new WiFiTransport();

  constructor(
    private readonly builds: BuildService,
    private readonly renderer: () => WebContents | undefined,
  ) {}

  async discover(signal = new AbortController().signal): Promise<DeviceDescriptor[]> {
    const settled = await Promise.allSettled([
      this.#usb.discover(signal),
      this.#wifi.discover(signal),
    ]);
    const devices = settled.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
    const rejection = settled.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (!devices.length && settled.every((result) => result.status === "rejected") && rejection)
      throw rejection.reason;
    return devices;
  }

  connect(descriptor: DeviceDescriptor, signal = new AbortController().signal): Promise<string> {
    const transport = descriptor.transport === "usb" ? this.#usb : this.#wifi;
    return this.connectWith(() => transport.connect(descriptor, signal), descriptor.transport);
  }

  connectWifi(address: string, signal = new AbortController().signal): Promise<string> {
    const descriptor: DeviceDescriptor = {
      id: `wifi:${address}`,
      name: `EV3 ${address}`,
      transport: "wifi",
      address,
    };
    return this.connectWith(() => this.#wifi.connect(descriptor, signal), "wifi");
  }

  async disconnect(id: string): Promise<void> {
    const session = this.require(id);
    await session.disconnect();
    this.#sessions.delete(id);
    this.send({ type: "state", state: "disconnected" });
  }

  upload(id: string, buildId: string, remotePath: string): Promise<void> {
    return this.operation(id, async (session, signal) =>
      session.upload(remotePath, await this.builds.artifactBytes(buildId), signal),
    );
  }

  run(id: string, remotePath: string): Promise<void> {
    return this.operation(id, (session, signal) => session.run(remotePath, signal));
  }

  stop(id: string): Promise<void> {
    return this.operation(id, (session, signal) => session.stop(undefined, signal));
  }

  delete(id: string, remotePath: string): Promise<void> {
    return this.operation(id, (session, signal) => session.delete(remotePath, signal));
  }

  private async connectWith(
    connect: () => Promise<DeviceSession>,
    transport: string,
  ): Promise<string> {
    this.send({ type: "state", state: "connecting", transport });
    try {
      const session = await connect();
      const id = randomUUID();
      this.#sessions.set(id, session);
      this.send({ type: "state", state: "connected", sessionId: id, transport });
      return id;
    } catch (error) {
      this.report(error);
      throw error;
    }
  }

  private async operation(
    id: string,
    work: (session: DeviceSession, signal: AbortSignal) => Promise<void>,
  ): Promise<void> {
    const session = this.require(id);
    this.send({
      type: "state",
      state: "busy",
      sessionId: id,
      transport: session.descriptor.transport,
    });
    try {
      await work(session, new AbortController().signal);
      this.send({
        type: "state",
        state: "connected",
        sessionId: id,
        transport: session.descriptor.transport,
      });
    } catch (error) {
      this.report(error);
      throw error;
    }
  }

  private require(id: string): DeviceSession {
    const session = this.#sessions.get(id);
    if (!session)
      throw new DeviceOperationError("connection", "Unknown or disconnected EV3 session.");
    return session;
  }

  private report(error: unknown): void {
    const normalized = normalizeDeviceError(error);
    this.send({
      type: "error",
      category: normalized.category,
      message: normalized.message,
      recoverable: normalized.recoverable,
    });
    this.send({ type: "state", state: "error" });
  }

  private send(event: DeviceEvent): void {
    this.renderer()?.send("device:event", event);
  }
}
