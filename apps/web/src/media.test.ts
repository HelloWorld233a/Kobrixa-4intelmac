import { describe, expect, it } from "vitest";
import {
  encodeRgf,
  encodeRsf,
  MAX_DURATION,
  MAX_SAMPLES,
  outputName,
  rsfPreviewWav,
  sampleCount,
} from "./media.js";

function pixels(values: number[]) {
  return values.flatMap((value) => [value, value, value, 255]);
}

describe("RGF", () => {
  it("packs leftmost pixels into bit zero and pads each row independently", () => {
    expect([
      ...encodeRgf(
        pixels([0, 255, 255, 255, 255, 255, 255, 0, 0, 255, 0, 255, 255, 255, 255, 255, 255, 255]),
        9,
        2,
      ),
    ]).toEqual([9, 2, 129, 1, 2, 0]);
  });
  it("applies threshold, inversion and white alpha compositing", () => {
    const rgba = [...pixels([127, 128]), 0, 0, 0, 0];
    expect(encodeRgf(rgba, 3, 1)[2]).toBe(1);
    expect(encodeRgf(rgba, 3, 1, 128, true)[2]).toBe(6);
    expect(encodeRgf(pixels([0, 255]), 2, 1, 0)[2]).toBe(0);
  });
  it("rejects invalid dimensions and incomplete pixels", () => {
    for (const width of [0, 177, 1.5, NaN])
      expect(() => encodeRgf(pixels([0]), width, 1)).toThrow();
    expect(() => encodeRgf([], 1, 129)).toThrow();
    expect(() => encodeRgf([], 1, 1)).toThrow();
    expect(encodeRgf(new Uint8Array(176 * 128 * 4), 176, 128).length).toBe(2818);
  });
});
describe("RSF", () => {
  it("writes a big-endian header and clipped unsigned PCM", () => {
    const bytes = encodeRsf(new Float32Array([-2, -1, 0, 1, 2]));
    expect([...bytes]).toEqual([1, 0, 0, 5, 31, 64, 0, 0, 0, 0, 128, 255, 255]);
    expect([...encodeRsf(new Float32Array([-1, 0, 1]), 0).slice(8)]).toEqual([128, 128, 128]);
    expect([...encodeRsf(new Float32Array([-0.75, 0.75]), 2).slice(8)]).toEqual([0, 255]);
  });
  it("enforces sample limits without truncation", () => {
    const bytes = encodeRsf(new Float32Array(MAX_SAMPLES));
    expect(new DataView(bytes.buffer).getUint16(2, false)).toBe(MAX_SAMPLES);
    expect(() => encodeRsf(new Float32Array(MAX_SAMPLES + 1))).toThrow();
    expect(() => encodeRsf(new Float32Array())).toThrow();
    expect(() => encodeRsf(new Float32Array([NaN]))).toThrow();
    expect(() => encodeRsf(new Float32Array([0]), Infinity)).toThrow();
  });
  it("validates crop boundaries and the exact maximum duration", () => {
    expect(sampleCount(0, MAX_DURATION, 20)).toBe(MAX_SAMPLES);
    expect(sampleCount(1, 1.5, 2)).toBe(4000);
    for (const [start, end, duration] of [
      [0, 9, 20],
      [0, MAX_DURATION + 0.00001, 20],
      [-1, 1, 2],
      [1, 1, 2],
      [2, 1, 3],
      [0, 3, 2],
      [NaN, 1, 2],
      [0, 0.00001, 1],
    ])
      expect(() => sampleCount(start!, end!, duration!)).toThrow();
  });
  it("previews exactly the exported PCM and pads odd WAV data", () => {
    const rsf = encodeRsf(new Float32Array([-1, 0, 1]));
    const wav = rsfPreviewWav(rsf),
      view = new DataView(wav.buffer);
    expect(new TextDecoder().decode(wav.slice(0, 4))).toBe("RIFF");
    expect(view.getUint32(4, true)).toBe(wav.length - 8);
    expect(view.getUint32(24, true)).toBe(8000);
    expect(view.getUint32(40, true)).toBe(3);
    expect([...wav.slice(44, 47)]).toEqual([...rsf.slice(8)]);
    expect(wav.length % 2).toBe(0);
  });
});
it("preserves the source basename", () => {
  expect(outputName("my.sound.mp3", "rsf")).toBe("my.sound.rsf");
  expect(outputName("圖片", "rgf")).toBe("圖片.rgf");
});
