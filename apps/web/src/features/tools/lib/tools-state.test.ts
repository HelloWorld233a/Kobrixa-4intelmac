import { describe, expect, it } from "vitest";
import { MAX_DURATION, MAX_SAMPLES, sampleCount } from "./media.js";
import { exportState, initialAudioSettings, validFileName } from "./tools-state.js";

describe("audio import and reset defaults", () => {
  it.each([0.000125, 3, MAX_DURATION, 30])(
    "selects an exportable clip for %s seconds",
    (duration) => {
      const settings = initialAudioSettings(duration);
      expect(settings.start).toBe(0);
      expect(settings.end).toBe(Math.min(duration, MAX_DURATION));
      expect(sampleCount(settings.start, settings.end, duration)).toBeLessThanOrEqual(MAX_SAMPLES);
      expect(settings).toMatchObject({ volume: 100, fadeIn: 0, fadeOut: 0, normalize: false });
    },
  );
  it("returns independent settings for import and reset", () => {
    const settings = initialAudioSettings(30);
    settings.volume = 150;
    expect(initialAudioSettings(30).volume).toBe(100);
  });
});

describe("download availability", () => {
  const ready = { hasSource: true, loading: false, valid: true, hasResult: true, name: "robot" };
  it("blocks old output while replacing a file, and restores it after a failed replacement", () => {
    expect(exportState({ ...ready, loading: true })).toBe("loading");
    expect(exportState(ready)).toBe("ready");
  });
  it("distinguishes empty, invalid, pending and failed conversion states", () => {
    expect(exportState({ ...ready, hasSource: false, valid: false, hasResult: false })).toBe(
      "empty",
    );
    expect(exportState({ ...ready, valid: false })).toBe("invalid");
    expect(exportState({ ...ready, hasResult: false })).toBe("updating");
    expect(exportState({ ...ready, hasResult: false, failed: true })).toBe("error");
  });
  it("requires valid settings and a safe name even if bytes exist", () => {
    expect(exportState({ ...ready, name: "../robot" })).toBe("filename");
    expect(exportState({ ...ready, valid: false, name: "" })).toBe("invalid");
    expect(exportState({ ...ready, name: "機器人" })).toBe("ready");
  });
  it.each(["", " ", ".", "..", "a/b", "a\\b", 'a"b', "a\nb", "a:b"])(
    "rejects unsafe name %j",
    (name) => {
      expect(validFileName(name)).toBe(false);
    },
  );
});
