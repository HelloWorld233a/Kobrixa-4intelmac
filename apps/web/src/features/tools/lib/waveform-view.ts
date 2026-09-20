import { clamp } from "./media-processing.js";

export type WaveformView = { start: number; span: number };

export function waveformView(duration: number, start: number, span: number): WaveformView {
  const boundedSpan = clamp(span, Math.min(0.25, duration), duration);
  return { start: clamp(start, 0, duration - boundedSpan), span: boundedSpan };
}

/** Move the timeline with the pointer, preserving its zoom and clamping at either edge. */
export function panWaveform(view: WaveformView, duration: number, fraction: number): WaveformView {
  return waveformView(duration, view.start - fraction * view.span, view.span);
}

export function selectionView(duration: number, start: number, end: number): WaveformView {
  if (![start, end].every(Number.isFinite) || start < 0 || end <= start || end > duration)
    return { start: 0, span: duration };
  const span = Math.max(1, (end - start) * 1.4);
  return waveformView(duration, (start + end - span) / 2, span);
}

export function waveformTime(view: WaveformView, fraction: number): number {
  return view.start + clamp(fraction, 0, 1) * view.span;
}

export function audioTime(seconds: number): string {
  const tenths = Math.round(seconds * 10);
  const minutes = Math.floor(tenths / 600);
  return `${minutes}:${((tenths % 600) / 10).toFixed(1).padStart(4, "0")}`;
}
