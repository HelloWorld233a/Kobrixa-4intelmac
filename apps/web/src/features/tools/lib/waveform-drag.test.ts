import { describe, expect, it } from "vitest";
import { dragAudioSelection, edgeScrollSpeed, trimBounds } from "./waveform-drag.js";
import { MAX_DURATION, SAMPLE_RATE, sampleCount } from "./media.js";

describe("smart waveform dragging", () => {
  it("preserves selection length and snaps near the source edges", () => {
    const original = { start: 10, end: 15 };
    expect(dragAudioSelection("selection", original, 600, -9.98, false, 0.03)).toEqual({
      start: 0,
      end: 5,
    });
    expect(dragAudioSelection("selection", original, 600, 584.98, false, 0.03)).toEqual({
      start: 595,
      end: 600,
    });
    expect(dragAudioSelection("selection", original, 600, 12, false, 0.03)).toEqual({
      start: 22,
      end: 27,
    });
  });
  it("keeps either single-file handle within the RSF limit and allows reversing", () => {
    const original = { start: 300, end: 304 };
    const end = dragAudioSelection("end", original, 600, 50, false, 0);
    expect(end.end).toBe(300 + MAX_DURATION);
    expect(sampleCount(end.start, end.end, 600)).toBe(65535);
    const start = dragAudioSelection("start", original, 600, -50, false, 0);
    expect(start.start).toBe(304 - MAX_DURATION);
    expect(sampleCount(start.start, start.end, 600)).toBe(65535);
    expect(dragAudioSelection("end", original, 600, 1, false, 0)).toEqual({ start: 300, end: 305 });
  });
  it("allows sequence trimming beyond a single file but prevents crossed handles", () => {
    const original = { start: 300, end: 304 };
    expect(dragAudioSelection("end", original, 600, 200, true, 0)).toEqual({
      start: 300,
      end: 504,
    });
    expect(dragAudioSelection("start", original, 600, 200, true, 0).start).toBe(
      304 - 1 / SAMPLE_RATE,
    );
    expect(dragAudioSelection("end", original, 600, -200, true, 0).end).toBe(300 + 1 / SAMPLE_RATE);
    expect(trimBounds("start", original, 600, true).min).toBe(0);
  });
  it("does not move a handle when grabbed away from its center without pointer movement", () => {
    const original = { start: 302, end: 306 };
    expect(dragAudioSelection("start", original, 600, 0, true, 0)).toEqual(original);
  });
  it("scrolls only in edge zones, gradually accelerating and capping outside the view", () => {
    expect(edgeScrollSpeed(300, 600)).toBe(0);
    expect(edgeScrollSpeed(22, 600)).toBe(-0.5);
    expect(edgeScrollSpeed(578, 600)).toBe(0.5);
    expect(edgeScrollSpeed(-50, 600)).toBe(-1);
    expect(edgeScrollSpeed(900, 600)).toBe(1);
    expect(edgeScrollSpeed(20, 80)).toBe(0);
  });
});
