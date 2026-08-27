import path from "node:path";
import { DeviceOperationError } from "./errors.js";

export function normalizeRemotePath(remotePath: string): string {
  if (!remotePath || remotePath.includes("\0"))
    throw new DeviceOperationError("protocol", "Remote path is empty or contains a null byte.");
  const unix = remotePath.replaceAll("\\", "/");
  if (unix.split("/").some((segment) => segment === ".."))
    throw new DeviceOperationError("protocol", "Parent traversal is not allowed in remote paths.");
  const normalized = path.posix.normalize(unix);
  const bytes = new TextEncoder().encode(normalized);
  if (bytes.length > 119)
    throw new DeviceOperationError("protocol", "Remote path exceeds the EV3 path limit.");
  if (!/^\/?[A-Za-z0-9_./ -]+$/.test(normalized))
    throw new DeviceOperationError("protocol", "Remote path contains unsupported characters.");
  return normalized;
}
