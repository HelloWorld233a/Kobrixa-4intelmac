export type DeviceErrorCategory =
  | "permission"
  | "not-found"
  | "connection"
  | "timeout"
  | "protocol"
  | "transfer"
  | "device"
  | "cancelled"
  | "internal";

export interface DeviceDescriptor {
  id: string;
  name: string;
  transport: "usb" | "wifi" | "mock";
  address?: string;
  serialNumber?: string;
  metadata?: Record<string, string>;
}

export interface DeviceTransport {
  discover(signal: AbortSignal): Promise<DeviceDescriptor[]>;
  connect(target: DeviceDescriptor, signal: AbortSignal): Promise<DeviceSession>;
}

export interface DeviceSession {
  readonly descriptor: DeviceDescriptor;
  readonly connected: boolean;
  disconnect(): Promise<void>;
  upload(remotePath: string, data: Uint8Array, signal: AbortSignal): Promise<void>;
  run(remotePath: string, signal: AbortSignal): Promise<void>;
  stop(programName?: string, signal?: AbortSignal): Promise<void>;
  delete(remotePath: string, signal: AbortSignal): Promise<void>;
}

export interface Ev3Connection {
  exchange(payload: Uint8Array, signal: AbortSignal, timeoutMs?: number): Promise<Uint8Array>;
  close(): Promise<void>;
}
