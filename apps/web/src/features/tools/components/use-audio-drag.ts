import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";
import { dragAudioSelection, edgeScrollSpeed, trimBounds } from "../lib/waveform-drag.js";
import type { AudioDragKind, AudioSelection } from "../lib/waveform-drag.js";
import { waveformTime, waveformView } from "../lib/waveform-view.js";
import type { WaveformView } from "../lib/waveform-view.js";

type Options = {
  source: AudioBuffer;
  active: boolean;
  split: boolean;
  selection: AudioSelection;
  window: WaveformView;
  view: RefObject<HTMLDivElement | null>;
  update: (selection: AudioSelection) => void;
  navigate: (window: WaveformView) => void;
};

type Gesture = {
  kind: AudioDragKind;
  original: AudioSelection;
  last: AudioSelection;
  originX: number;
  clientX: number;
  originTime: number;
  window: WaveformView;
  activated: boolean;
  time: number;
  element: HTMLDivElement;
  pointerId: number;
};

export function useAudioDrag(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const drag = useRef<Gesture | null>(null);
  const frame = useRef(0);
  const [kind, setKind] = useState<AudioDragKind | null>(null);
  const [feedback, setFeedback] = useState<
    "moving" | "trimming" | "left" | "right" | "limit" | null
  >(null);
  const finish = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const current = drag.current;
    drag.current = null;
    if (current?.element.hasPointerCapture(current.pointerId))
      current.element.releasePointerCapture(current.pointerId);
    setFeedback(null);
    setKind(null);
  }, []);
  useEffect(() => {
    finish();
  }, [options.source, options.active, options.split, finish]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) finish();
    };
    const released = (event: globalThis.PointerEvent) => {
      if (drag.current?.pointerId === event.pointerId) finish();
    };
    window.addEventListener("pointerup", released);
    window.addEventListener("pointercancel", released);
    window.addEventListener("blur", finish);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      cancelAnimationFrame(frame.current);
      drag.current = null;
      window.removeEventListener("pointerup", released);
      window.removeEventListener("pointercancel", released);
      window.removeEventListener("blur", finish);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [finish]);

  function tick(now: number) {
    const gesture = drag.current;
    if (!gesture) return;
    const config = latest.current;
    const rect = config.view.current?.getBoundingClientRect();
    if (!rect?.width) {
      finish();
      return;
    }
    const dt = Math.min(0.05, Math.max(0, (now - gesture.time) / 1000));
    gesture.time = now;
    if (Math.abs(gesture.clientX - gesture.originX) > 3) gesture.activated = true;
    if (gesture.activated) {
      const x = gesture.clientX - rect.left;
      const duration = config.source.duration;
      const tolerance = Math.min(0.05, (gesture.window.span * 6) / rect.width);
      const calculate = (view: WaveformView) =>
        dragAudioSelection(
          gesture.kind,
          gesture.original,
          duration,
          waveformTime(view, x / rect.width) - gesture.originTime,
          config.split,
          tolerance,
        );
      let next = calculate(gesture.window);
      let speed = edgeScrollSpeed(x, rect.width);
      const bounds =
        gesture.kind === "selection"
          ? { min: 0, max: duration - (gesture.original.end - gesture.original.start) }
          : trimBounds(gesture.kind, gesture.original, duration, config.split);
      const value = gesture.kind === "end" ? next.end : next.start;
      const limited = (speed < 0 && value <= bounds.min) || (speed > 0 && value >= bounds.max);
      if (limited) speed = 0;
      const nextView = waveformView(
        duration,
        gesture.window.start + speed * Math.min(30, gesture.window.span * 0.8) * dt,
        gesture.window.span,
      );
      const scrolled = nextView.start !== gesture.window.start;
      if (scrolled) {
        gesture.window = nextView;
        config.navigate(nextView);
        next = calculate(nextView);
      }
      if (next.start !== gesture.last.start || next.end !== gesture.last.end) {
        gesture.last = next;
        config.update(next);
      }
      setFeedback(
        limited
          ? "limit"
          : scrolled
            ? speed < 0
              ? "left"
              : "right"
            : gesture.kind === "selection"
              ? "moving"
              : "trimming",
      );
    }
    frame.current = requestAnimationFrame(tick);
  }

  function begin(kind: AudioDragKind, e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || !latest.current.active) return;
    const config = latest.current;
    const rect = config.view.current?.getBoundingClientRect();
    if (
      !rect?.width ||
      ![config.selection.start, config.selection.end].every(Number.isFinite) ||
      config.selection.start < 0 ||
      config.selection.end <= config.selection.start ||
      config.selection.end > config.source.duration
    )
      return;
    finish();
    e.preventDefault();
    e.currentTarget.focus({ preventScroll: true });
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      kind,
      original: { ...config.selection },
      last: { ...config.selection },
      originX: e.clientX,
      clientX: e.clientX,
      originTime: waveformTime(config.window, (e.clientX - rect.left) / rect.width),
      window: config.window,
      activated: false,
      time: performance.now(),
      element: e.currentTarget,
      pointerId: e.pointerId,
    };
    setKind(kind);
    frame.current = requestAnimationFrame(tick);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === e.pointerId) drag.current.clientX = e.clientX;
  }
  function end(e: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== e.pointerId) return;
    // Apply the final pointer position even if release occurs before the next frame.
    drag.current.clientX = e.clientX;
    cancelAnimationFrame(frame.current);
    tick(performance.now());
    finish();
  }
  return { begin, move, end, finish, feedback, kind };
}
