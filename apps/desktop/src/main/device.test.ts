import { describe, expect, it } from "vitest";
import type { DeviceDescriptor } from "@kobrixa/device";
import { mergeDiscoveryResults } from "./device.js";

const usb: DeviceDescriptor = {
  id: "usb:test",
  name: "EV3",
  transport: "usb",
};

describe("device discovery", () => {
  it("returns devices when another transport fails", () => {
    expect(
      mergeDiscoveryResults([
        { status: "fulfilled", value: [usb] },
        { status: "rejected", reason: new Error("Wi-Fi unavailable") },
      ]),
    ).toEqual([usb]);
  });

  it("surfaces a transport error when no device can be returned", () => {
    const failure = new Error("USB support is unavailable");
    expect(() =>
      mergeDiscoveryResults([
        { status: "rejected", reason: failure },
        { status: "fulfilled", value: [] },
      ]),
    ).toThrow(failure);
  });
});
