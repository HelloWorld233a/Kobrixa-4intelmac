import { describe, expect, it } from "vitest";
import {
  audioTime,
  panWaveform,
  selectionView,
  waveformTime,
  waveformView,
} from "./waveform-view.js";
import { moveAudioSelection } from "./audio-segments.js";

describe("waveform navigation", () => {
  it("makes an eight-second selection editable in a ten-minute track", () => {
    const view = selectionView(600, 0, 8.191875);
    expect(view.start).toBe(0);
    expect(view.span).toBeCloseTo(11.468625);
    expect(8.191875 / view.span).toBeGreaterThan(0.7);
  });
  it("fits selections at either end without leaving the source", () => {
    expect(selectionView(600, 592, 600)).toEqual({ start: 588.8, span: 11.2 });
    expect(selectionView(3, 0, 3)).toEqual({ start: 0, span: 3 });
    expect(selectionView(600, NaN, 3)).toEqual({ start: 0, span: 600 });
  });
  it("bounds zoom and panning, including sub-second sources", () => {
    expect(waveformView(600, 590, 20)).toEqual({ start: 580, span: 20 });
    expect(waveformView(600, -5, 0.01)).toEqual({ start: 0, span: 0.25 });
    expect(waveformView(0.1, 8, 1)).toEqual({ start: 0, span: 0.1 });
    expect(waveformView(600, 200, 1200)).toEqual({ start: 0, span: 600 });
  });
  it("maps trimming and clip movement to visible seconds at a nonzero offset", () => {
    const view = waveformView(600, 300, 10);
    expect(waveformTime(view, 0.4)).toBe(304);
    expect(waveformTime(view, -1)).toBe(300);
    expect(waveformTime(view, 2)).toBe(310);
    expect(moveAudioSelection(302, 306, 600, view.span * 0.1)).toEqual({ start: 303, end: 307 });
  });
  it("drags the visible timeline without changing zoom or crossing either source edge", () => {
    const view = { start: 300, span: 10 };
    expect(panWaveform(view, 600, -0.2)).toEqual({ start: 302, span: 10 });
    expect(panWaveform(view, 600, 0.2)).toEqual({ start: 298, span: 10 });
    expect(panWaveform(view, 600, 100)).toEqual({ start: 0, span: 10 });
    expect(panWaveform(view, 600, -100)).toEqual({ start: 590, span: 10 });
    expect(view).toEqual({ start: 300, span: 10 });
  });
  it("formats absolute times without rounding to an invalid 60-second field", () => {
    expect(audioTime(59.99)).toBe("1:00.0");
    expect(audioTime(3672.34)).toBe("61:12.3");
    expect(audioTime(0)).toBe("0:00.0");
  });
});
