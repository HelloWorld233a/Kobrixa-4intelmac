import { encodeRsf, MAX_SAMPLES, SAMPLE_RATE } from "./media.js";
import { validFileName } from "./tools-state.js";
import { clamp } from "./media-processing.js";

/** Move a selection without changing its length, clamped to the source. */
export function moveAudioSelection(start: number, end: number, duration: number, delta: number) {
  if (
    ![start, end, duration, delta].every(Number.isFinite) ||
    start < 0 ||
    end <= start ||
    end > duration
  )
    throw new Error("Invalid audio selection");
  const length = end - start;
  const next = clamp(start + delta, 0, duration - length);
  return { start: next, end: Math.min(duration, next + length) };
}

/** A continuous selection may exceed one RSF's 16-bit sample count. */
export function sequenceSampleCount(start: number, end: number, duration: number) {
  if (![start, end, duration].every(Number.isFinite) || start < 0 || end <= start || end > duration)
    throw new Error("Invalid audio range");
  const count = Math.round((end - start) * SAMPLE_RATE);
  if (!Number.isSafeInteger(count) || count < 1) throw new Error("Invalid sample count");
  return count;
}

export function encodeRsfSegments(samples: Float32Array) {
  if (!samples.length) throw new Error("Empty audio selection");
  const parts: Uint8Array<ArrayBuffer>[] = [];
  for (let offset = 0; offset < samples.length; offset += MAX_SAMPLES) {
    parts.push(encodeRsf(samples.subarray(offset, offset + MAX_SAMPLES)));
  }
  return parts;
}

export function segmentName(name: string, index: number) {
  if (!validFileName(name) || !Number.isInteger(index) || index < 0)
    throw new Error("Invalid segment name");
  return `${name.trim()}-${String(index + 1).padStart(3, "0")}`;
}

export function sequenceProgram(name: string, count: number) {
  if (!Number.isInteger(count) || count < 1) throw new Error("Invalid segment count");
  return (
    Array.from(
      { length: count },
      (_, index) => `Speaker.Play(35, "assets/deploy/${segmentName(name, index)}")\nSpeaker.Wait()`,
    ).join("\n") + "\n"
  );
}
