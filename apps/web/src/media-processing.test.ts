import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUDIO,
  DEFAULT_IMAGE,
  imageGeometry,
  otsuThreshold,
  processAudio,
  processImage,
  waveformPeaks,
} from "./media-processing.js";
import { MAX_SAMPLES } from "./media.js";
const rgba = (values: number[]) => values.flatMap((value) => [value, value, value, 255]);

describe("image processing", () => {
  it("separates bimodal images and falls back on flat images", () => {
    expect(otsuThreshold([0, 0, 255, 255])).toBe(1);
    expect(otsuThreshold([80, 80, 200, 200])).toBe(81);
    expect(otsuThreshold([90, 90])).toBe(128);
    expect(otsuThreshold([])).toBe(128);
    const result = processImage(rgba([0, 0, 255, 255]), { ...DEFAULT_IMAGE, width: 4, height: 1 });
    expect([...result.bytes]).toEqual([4, 1, 3]);
  });
  it("composites transparency on white before contrast and threshold", () => {
    const result = processImage([0, 0, 0, 0, 0, 0, 0, 255], {
      ...DEFAULT_IMAGE,
      width: 2,
      height: 1,
    });
    expect(result.bytes[2]).toBe(2);
    const inverted = processImage([0, 0, 0, 0, 0, 0, 0, 255], {
      ...DEFAULT_IMAGE,
      width: 2,
      height: 1,
      invert: true,
    });
    expect(inverted.bytes[2]).toBe(1);
  });
  it("preserves shading with deterministic dithering and no row wrap", () => {
    const settings = { ...DEFAULT_IMAGE, width: 4, height: 4, mode: "dither" as const };
    const result = processImage(rgba(Array(16).fill(128)), settings);
    expect([...result.bytes]).toEqual([4, 4, 10, 5, 10, 5]);
    expect([
      ...processImage(rgba(Array(16).fill(128)), { ...settings, invert: true }).bytes,
    ]).toEqual([4, 4, 5, 10, 5, 10]);
    expect([...processImage(rgba(Array(16).fill(255)), settings).bytes.slice(2)]).toEqual([
      0, 0, 0, 0,
    ]);
  });
  it("adjusts brightness and contrast before binary conversion", () => {
    const settings = { ...DEFAULT_IMAGE, width: 2, height: 1, mode: "manual" as const };
    expect(processImage(rgba([100, 150]), settings).bytes[2]).toBe(1);
    expect(processImage(rgba([100, 150]), { ...settings, brightness: 20 }).bytes[2]).toBe(0);
    expect(processImage(rgba([100, 150]), { ...settings, contrast: -100 }).bytes[2]).toBe(0);
    expect(() => processImage(rgba([100, 150]), { ...settings, brightness: NaN })).toThrow();
  });
  it("fits with centered padding and crops at the requested position", () => {
    const base = { ...DEFAULT_IMAGE, width: 100, height: 100 };
    expect(() => imageGeometry(200, 100, { ...base, x: NaN })).toThrow();
    expect(imageGeometry(200, 100, base)).toEqual({ width: 100, height: 50, left: 0, top: 25 });
    expect(imageGeometry(200, 100, { ...base, fit: "cover", x: 0 })).toEqual({
      width: 200,
      height: 100,
      left: 0,
      top: 0,
    });
    expect(imageGeometry(200, 100, { ...base, fit: "cover", x: 100 })).toEqual({
      width: 200,
      height: 100,
      left: -100,
      top: 0,
    });
    expect(imageGeometry(100, 200, { ...base, fit: "cover", y: 100 })).toEqual({
      width: 100,
      height: 200,
      left: 0,
      top: -100,
    });
  });
});
describe("audio finishing", () => {
  it("normalizes peak to -1 dBFS, then applies volume", () => {
    const result = processAudio(new Float32Array([-0.25, 0, 0.25]), {
      ...DEFAULT_AUDIO,
      normalize: true,
    });
    expect(result.samples[2]).toBeCloseTo(10 ** (-1 / 20), 6);
    expect(result.samples[0]).toBeCloseTo(-(10 ** (-1 / 20)), 6);
    expect(
      processAudio(new Float32Array([0.25]), { ...DEFAULT_AUDIO, normalize: true, volume: 50 })
        .samples[0],
    ).toBeCloseTo(10 ** (-1 / 20) / 2, 6);
  });
  it("keeps silence silent and reports clipping", () => {
    expect([
      ...processAudio(new Float32Array(4), { ...DEFAULT_AUDIO, normalize: true }).samples,
    ]).toEqual([0, 0, 0, 0]);
    const result = processAudio(new Float32Array([-0.75, 0, 0.75]), {
      ...DEFAULT_AUDIO,
      volume: 200,
    });
    expect([...result.samples]).toEqual([-1, 0, 1]);
    expect(result.clipped).toBe(2);
    expect(() => processAudio(new Float32Array([NaN]), DEFAULT_AUDIO)).toThrow();
  });
  it("fades endpoints to zero and handles overlapping fades", () => {
    const original = new Float32Array(9).fill(1);
    const result = processAudio(original, {
      ...DEFAULT_AUDIO,
      fadeIn: 4 / 8000,
      fadeOut: 4 / 8000,
    });
    expect([...result.samples]).toEqual([0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]);
    expect([...original]).toEqual(Array(9).fill(1));
    const overlap = processAudio(new Float32Array(3).fill(1), {
      ...DEFAULT_AUDIO,
      fadeIn: 1,
      fadeOut: 1,
    });
    expect([...overlap.samples]).toEqual([0, 0.5, 0]);
    expect(processAudio(new Float32Array(MAX_SAMPLES), DEFAULT_AUDIO).samples.length).toBe(
      MAX_SAMPLES,
    );
  });
  it("retains brief transients from any channel in the overview", () => {
    expect([
      ...waveformPeaks([new Float32Array([0, 1, 0, 0]), new Float32Array([0, 0, -0.5, 0])], 2),
    ]).toEqual([1, 0.5]);
    expect(waveformPeaks([], 2).length).toBe(0);
    expect(waveformPeaks([new Float32Array([1])], 600).length).toBe(1);
  });
});
