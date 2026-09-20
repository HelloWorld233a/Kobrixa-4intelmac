import { describe, expect, it } from "vitest";
import {
  encodeRsfSegments,
  moveAudioSelection,
  sequenceProgram,
  sequenceSampleCount,
} from "./audio-segments.js";
import { MAX_DURATION, MAX_SAMPLES, SAMPLE_RATE, sampleCount } from "./media.js";
import { DEFAULT_AUDIO, processAudio } from "./media-processing.js";

describe("moving an audio selection", () => {
  it("preserves length and clamps at both ends", () => {
    expect(moveAudioSelection(2, 5, 12, 4)).toEqual({ start: 6, end: 9 });
    expect(moveAudioSelection(2, 5, 12, -20)).toEqual({ start: 0, end: 3 });
    expect(moveAudioSelection(2, 5, 12, 20)).toEqual({ start: 9, end: 12 });
    expect(moveAudioSelection(0, 12, 12, 4)).toEqual({ start: 0, end: 12 });
  });
  it("keeps a maximum-length RSF valid after movement", () => {
    for (const delta of [0.01, 0.125, 1.56789, 300, -300]) {
      const { start, end } = moveAudioSelection(0, MAX_DURATION, 45.127, delta);
      expect(end - start).toBeCloseTo(MAX_DURATION, 10);
      expect(sampleCount(start, end, 45.127)).toBe(MAX_SAMPLES);
    }
  });
  it("rejects invalid selections", () => {
    expect(() => moveAudioSelection(NaN, 2, 5, 1)).toThrow();
    expect(() => moveAudioSelection(3, 2, 5, 1)).toThrow();
    expect(() => moveAudioSelection(0, 6, 5, 1)).toThrow();
  });
});

describe("continuous RSF export", () => {
  it.each([1, MAX_SAMPLES, MAX_SAMPLES + 1, MAX_SAMPLES * 2, MAX_SAMPLES * 2 + 37])(
    "preserves exactly %i quantized samples across parts",
    (length) => {
      const samples = Float32Array.from({ length }, (_, i) => Math.sin(i / 17));
      const parts = encodeRsfSegments(samples);
      expect(parts.length).toBe(Math.ceil(length / MAX_SAMPLES));
      const joined = new Uint8Array(length);
      let offset = 0;
      for (const part of parts) {
        const header = new DataView(part.buffer);
        expect(header.getUint16(0)).toBe(0x0100);
        expect(header.getUint16(2)).toBe(part.length - 8);
        expect(header.getUint16(4)).toBe(SAMPLE_RATE);
        expect(header.getUint16(6)).toBe(0);
        expect(part.length - 8).toBeGreaterThan(0);
        expect(part.length - 8).toBeLessThanOrEqual(MAX_SAMPLES);
        joined.set(part.subarray(8), offset);
        offset += part.length - 8;
      }
      expect(offset).toBe(length);
      expect(joined).toEqual(Uint8Array.from(samples, (value) => Math.round((value + 1) * 127.5)));
    },
  );
  it("keeps fades and normalization global instead of restarting at a join", () => {
    const samples = new Float32Array(MAX_SAMPLES * 2 + 13).fill(0.3);
    const processed = processAudio(samples, {
      ...DEFAULT_AUDIO,
      end: samples.length / SAMPLE_RATE,
      normalize: true,
      fadeIn: 1,
      fadeOut: 1,
    });
    const parts = encodeRsfSegments(processed.samples);
    expect(parts[0]![8]).toBe(128);
    expect(parts.at(-1)!.at(-1)).toBe(128);
    expect(parts[0]!.at(-1)).toBeGreaterThan(230);
    expect(parts[1]![8]).toBe(parts[0]!.at(-1));
  });
  it("accepts a long selection and validates range and sample rounding", () => {
    expect(sequenceSampleCount(2, 32, 40)).toBe(240000);
    expect(sequenceSampleCount(0, MAX_DURATION, MAX_DURATION)).toBe(MAX_SAMPLES);
    for (const range of [
      [-1, 2, 4],
      [0, 0, 4],
      [0, 5, 4],
      [0, NaN, 4],
      [0, 0.000001, 4],
    ] as const)
      expect(() => sequenceSampleCount(range[0], range[1], range[2])).toThrow();
    expect(() => encodeRsfSegments(new Float32Array())).toThrow();
  });
  it("generates ordered extension-free resource paths with a wait after every file", () => {
    expect(sequenceProgram(" voice ", 2)).toBe(
      'Speaker.Play(35, "assets/deploy/voice-001")\nSpeaker.Wait()\nSpeaker.Play(35, "assets/deploy/voice-002")\nSpeaker.Wait()\n',
    );
    expect(() => sequenceProgram("../bad", 2)).toThrow();
    expect(() => sequenceProgram('bad"name', 2)).toThrow();
  });
});
