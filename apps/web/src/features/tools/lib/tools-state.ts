import { MAX_DURATION } from "./media.js";
import { DEFAULT_AUDIO } from "./media-processing.js";

export function initialAudioSettings(duration: number) {
  return { ...DEFAULT_AUDIO, end: Math.min(Math.max(0, duration), MAX_DURATION) };
}

export function validFileName(name: string) {
  const trimmed = name.trim();
  return (
    trimmed.length > 0 &&
    trimmed !== "." &&
    trimmed !== ".." &&
    !/[\\/:*?"<>|]/.test(name) &&
    ![...name].some((c) => c.charCodeAt(0) < 32)
  );
}

export type ExportState =
  "empty" | "loading" | "updating" | "invalid" | "error" | "filename" | "ready";

export function exportState({
  hasSource,
  loading,
  valid,
  failed = false,
  hasResult,
  name,
}: {
  hasSource: boolean;
  loading: boolean;
  valid: boolean;
  failed?: boolean;
  hasResult: boolean;
  name: string;
}): ExportState {
  if (loading) return "loading";
  if (!hasSource) return "empty";
  if (!valid) return "invalid";
  if (failed) return "error";
  if (!validFileName(name)) return "filename";
  return hasResult ? "ready" : "updating";
}
