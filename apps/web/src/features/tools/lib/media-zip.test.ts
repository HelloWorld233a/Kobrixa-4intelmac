import { describe, expect, it } from "vitest";
import { mediaZip } from "./media-zip.js";

describe("media ZIP", () => {
  it("writes UTF-8 stored entries, standard CRC32 and matching central directory offsets", () => {
    const text = new TextEncoder();
    const files = [
      { name: "assets/deploy/聲音-001.rsf", bytes: text.encode("123456789") },
      { name: "play-sequence.bp", bytes: text.encode("Speaker.Wait()\n") },
    ];
    const zip = mediaZip(files);
    const view = new DataView(zip.buffer);
    const end = zip.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);
    let central = view.getUint32(end + 16, true);
    const centralStart = central;
    for (const [index, file] of files.entries()) {
      expect(view.getUint32(central, true)).toBe(0x02014b50);
      const local = view.getUint32(central + 42, true);
      expect(view.getUint32(local, true)).toBe(0x04034b50);
      expect(view.getUint16(local + 6, true)).toBe(0x800);
      expect(view.getUint16(local + 8, true)).toBe(0);
      const length = view.getUint16(local + 26, true);
      expect(new TextDecoder().decode(zip.subarray(local + 30, local + 30 + length))).toBe(
        file.name,
      );
      expect(view.getUint32(local + 18, true)).toBe(file.bytes.length);
      expect(zip.subarray(local + 30 + length, local + 30 + length + file.bytes.length)).toEqual(
        file.bytes,
      );
      expect(view.getUint32(local + 14, true)).toBe(view.getUint32(central + 16, true));
      if (index === 0) expect(view.getUint32(local + 14, true)).toBe(0xcbf43926);
      central += 46 + view.getUint16(central + 28, true);
    }
    expect(central).toBe(end);
    expect(view.getUint32(end + 12, true)).toBe(end - centralStart);
  });
  it("rejects duplicate or unsafe entry paths", () => {
    const bytes = new Uint8Array([1]);
    for (const name of ["../x", "/x", "a/../x", "a\\x", "a//x", "a\0x"])
      expect(() => mediaZip([{ name, bytes }])).toThrow();
    expect(() =>
      mediaZip([
        { name: "x", bytes },
        { name: "x", bytes },
      ]),
    ).toThrow();
  });
});
