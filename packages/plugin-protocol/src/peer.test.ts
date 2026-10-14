import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryChannelPair, RPC_ERRORS, RpcError, RpcPeer, type ParamsOf } from "./index.js";

afterEach(() => vi.useRealTimers());
const pair = (hostOptions = {}, pluginOptions = {}) => {
  const [a, b] = createMemoryChannelPair();
  return { host: new RpcPeer(a, hostOptions), plugin: new RpcPeer(b, pluginOptions), raw: b };
};
const init: ParamsOf<"initialize"> = {
  apiVersion: "1.0.0",
  pluginId: "acme.x",
  locale: "en",
  grantedPermissions: [],
};
const initResult = { apiVersion: "1.0.0", sdk: { name: "t", version: "1" } };

describe("RpcPeer", () => {
  it("routes requests and validates results", async () => {
    const { host, plugin } = pair();
    plugin.handle("initialize", (params) => ({
      ...initResult,
      sdk: { name: params.pluginId, version: "1" },
    }));
    await expect(host.request("initialize", init)).resolves.toEqual({
      ...initResult,
      sdk: { name: "acme.x", version: "1" },
    });
  });
  it("reports unknown methods, invalid params and handler errors", async () => {
    const { host, plugin } = pair();
    await expect(host.request("shutdown", {})).rejects.toMatchObject({
      code: RPC_ERRORS.methodNotFound,
    });
    plugin.handle("command/execute", () => {
      throw new RpcError(RPC_ERRORS.permissionDenied, "no");
    });
    await expect(host.request("command/execute", { command: "acme.x.y" })).rejects.toMatchObject({
      code: RPC_ERRORS.permissionDenied,
    });
    plugin.handle("shutdown", () => ({ unexpected: true }) as unknown as null);
    await expect(host.request("shutdown", {})).rejects.toMatchObject({
      code: RPC_ERRORS.internalError,
    });
  });
  it("cancels on timeout, then reports an unresponsive peer after the grace period", async () => {
    vi.useFakeTimers();
    const onUnresponsive = vi.fn();
    const { host, plugin } = pair({ cancelGraceMs: 50, onUnresponsive });
    let signal: AbortSignal | undefined;
    plugin.handle("command/execute", (_params, context) => {
      signal = context.signal;
      return new Promise(() => {});
    });
    const result = host.request("command/execute", { command: "acme.x.y" }, { timeoutMs: 100 });
    const assertion = expect(result).rejects.toMatchObject({ code: RPC_ERRORS.timeout });
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
    expect(signal?.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(50);
    expect(onUnresponsive).toHaveBeenCalledWith("command/execute");
  });
  it("drops a late response after cancellation without a protocol error", async () => {
    const onProtocolError = vi.fn();
    const onUnresponsive = vi.fn();
    const { host, plugin } = pair({ onProtocolError, onUnresponsive, cancelGraceMs: 1000 });
    plugin.handle("command/execute", async (_params, { signal }) => {
      await new Promise((resolve) => signal.addEventListener("abort", resolve));
      return null;
    });
    const controller = new AbortController();
    const pending = host.request(
      "command/execute",
      { command: "acme.x.y" },
      { signal: controller.signal },
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: RPC_ERRORS.requestCancelled });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onProtocolError).not.toHaveBeenCalled();
    expect(onUnresponsive).not.toHaveBeenCalled();
  });
  it("treats malformed or oversized input as protocol errors", async () => {
    const onProtocolError = vi.fn();
    const [a, b] = createMemoryChannelPair();
    new RpcPeer(a, { onProtocolError });
    b.send("not json");
    b.send(JSON.stringify({ jsonrpc: "2.0", id: 99, result: null }));
    b.send(`"${"x".repeat(1024 * 1024)}"`);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onProtocolError).toHaveBeenCalledTimes(3);
  });
  it("rejects pending requests on close and refuses new ones", async () => {
    const { host, plugin } = pair();
    plugin.handle("shutdown", () => new Promise(() => {}));
    const pending = host.request("shutdown", {});
    host.close(new RpcError(RPC_ERRORS.connectionClosed, "gone"));
    await expect(pending).rejects.toMatchObject({ code: RPC_ERRORS.connectionClosed });
    await expect(host.request("shutdown", {})).rejects.toMatchObject({
      code: RPC_ERRORS.connectionClosed,
    });
  });
  it("never resolves method names through the prototype chain", async () => {
    const onProtocolError = vi.fn();
    const [a, b] = createMemoryChannelPair();
    new RpcPeer(a, { onProtocolError });
    const replies: unknown[] = [];
    b.onMessage((text) => replies.push(JSON.parse(text)));
    // Names must pass the envelope's method pattern to reach the lookup ("__proto__" does not).
    for (const method of ["constructor", "toString", "hasOwnProperty", "valueOf"]) {
      expect(() => b.send(JSON.stringify({ jsonrpc: "2.0", method, params: {} }))).not.toThrow();
      b.send(JSON.stringify({ jsonrpc: "2.0", id: method, method, params: {} }));
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onProtocolError).not.toHaveBeenCalled();
    expect(replies).toHaveLength(4);
    for (const reply of replies)
      expect(reply).toMatchObject({ error: { code: RPC_ERRORS.methodNotFound } });
  });
  it("delivers notifications", async () => {
    const { host, plugin } = pair();
    const exit = vi.fn();
    plugin.onNotification("exit", exit);
    host.notify("exit", {});
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(exit).toHaveBeenCalledWith({});
  });
});
