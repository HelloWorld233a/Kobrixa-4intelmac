import { moveAudioSelection } from "./audio-segments.js";
import { clamp } from "./media-processing.js";
import { MAX_DURATION, SAMPLE_RATE } from "./media.js";

export type AudioDragKind = "selection" | "start" | "end";
export type AudioSelection = { start: number; end: number };

export function trimBounds(
  kind: "start" | "end",
  selection: AudioSelection,
  duration: number,
  split: boolean,
) {
  return kind === "start"
    ? {
        min: Math.max(0, split ? 0 : selection.end - MAX_DURATION),
        max: Math.max(0, selection.end - 1 / SAMPLE_RATE),
      }
    : {
        min: Math.min(duration, selection.start + 1 / SAMPLE_RATE),
        max: Math.min(duration, split ? duration : selection.start + MAX_DURATION),
      };
}

export function dragAudioSelection(
  kind: AudioDragKind,
  original: AudioSelection,
  duration: number,
  delta: number,
  split: boolean,
  tolerance: number,
): AudioSelection {
  const snap = (value: number, min: number, max: number) => {
    const bounded = clamp(value, min, max);
    const distance = Math.min(Math.max(0, tolerance), (max - min) / 3);
    if (bounded - min <= distance) return min;
    if (max - bounded <= distance) return max;
    return bounded;
  };
  if (kind === "selection") {
    const start = snap(original.start + delta, 0, duration - (original.end - original.start));
    return moveAudioSelection(original.start, original.end, duration, start - original.start);
  }
  const bounds = trimBounds(kind, original, duration, split);
  return { ...original, [kind]: snap(original[kind] + delta, bounds.min, bounds.max) };
}

/** Normalized scroll speed within the outer 44 pixels; stationary pointers keep scrolling. */
export function edgeScrollSpeed(x: number, width: number): number {
  const edge = Math.min(44, width / 4);
  if (x < edge) return -clamp((edge - x) / edge, 0, 1);
  if (x > width - edge) return clamp((x - (width - edge)) / edge, 0, 1);
  return 0;
}
