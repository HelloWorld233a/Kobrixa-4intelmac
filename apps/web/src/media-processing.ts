import { encodeRgf, SAMPLE_RATE } from "./media.js";

export type ImageSettings = {
  width: number;
  height: number;
  fit: "contain" | "cover";
  x: number;
  y: number;
  mode: "auto" | "manual" | "dither";
  threshold: number;
  invert: boolean;
  brightness: number;
  contrast: number;
};
export const DEFAULT_IMAGE: ImageSettings = {
  width: 176,
  height: 128,
  fit: "contain",
  x: 50,
  y: 50,
  mode: "auto",
  threshold: 128,
  invert: false,
  brightness: 0,
  contrast: 0,
};
export type AudioSettings = {
  start: number;
  end: number;
  volume: number;
  normalize: boolean;
  fadeIn: number;
  fadeOut: number;
};
export const DEFAULT_AUDIO: AudioSettings = {
  start: 0,
  end: 0,
  volume: 100,
  normalize: false,
  fadeIn: 0,
  fadeOut: 0,
};
export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function imageGeometry(sourceWidth: number, sourceHeight: number, settings: ImageSettings) {
  const { width, height, fit, x, y } = settings;
  if (![sourceWidth, sourceHeight, width, height].every((n) => Number.isFinite(n) && n > 0))
    throw new Error("Invalid dimensions");
  if (![x, y].every(Number.isFinite)) throw new Error("Invalid crop position");
  const scale = (fit === "cover" ? Math.max : Math.min)(width / sourceWidth, height / sourceHeight);
  const w = sourceWidth * scale,
    h = sourceHeight * scale;
  return {
    width: w,
    height: h,
    left: (width - w) * (fit === "cover" ? clamp(x, 0, 100) / 100 : 0.5) + 0,
    top: (height - h) * (fit === "cover" ? clamp(y, 0, 100) / 100 : 0.5) + 0,
  };
}

// Return the first white value, matching encodeRgf's strict "brightness < threshold" comparison.
export function otsuThreshold(values: ArrayLike<number>) {
  const hist = new Uint32Array(256);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    const v = clamp(Math.round(values[i]!), 0, 255);
    hist[v]!++;
    sum += v;
  }
  if (Array.from(hist).filter(Boolean).length < 2) return 128;
  let weight = 0,
    partial = 0,
    best = -1,
    threshold = 128;
  for (let i = 0; i < 255; i++) {
    weight += hist[i]!;
    partial += i * hist[i]!;
    if (!weight || weight === values.length) continue;
    const rest = values.length - weight;
    const delta = partial / weight - (sum - partial) / rest;
    const variance = weight * rest * delta * delta;
    if (variance > best) {
      best = variance;
      threshold = i + 1;
    }
  }
  return threshold;
}

export function processImage(rgba: ArrayLike<number>, settings: ImageSettings) {
  const { width, height, threshold, brightness, contrast, mode, invert } = settings;
  if (
    !Number.isInteger(width) ||
    width < 1 ||
    width > 176 ||
    !Number.isInteger(height) ||
    height < 1 ||
    height > 128 ||
    rgba.length !== width * height * 4 ||
    ![threshold, brightness, contrast].every(Number.isFinite) ||
    threshold < 0 ||
    threshold > 255 ||
    Math.abs(brightness) > 100 ||
    Math.abs(contrast) > 100
  )
    throw new Error("Invalid image settings");
  const gray = new Float32Array(width * height);
  const factor = (100 + contrast) / 100;
  for (let i = 0; i < gray.length; i++) {
    const j = i * 4,
      alpha = rgba[j + 3]! / 255;
    const luma =
      ((299 * rgba[j]! + 587 * rgba[j + 1]! + 114 * rgba[j + 2]!) / 1000) * alpha +
      255 * (1 - alpha);
    gray[i] = clamp((luma - 128) * factor + 128 + brightness * 2.55, 0, 255);
  }
  const usedThreshold = mode === "auto" ? otsuThreshold(gray) : mode === "dither" ? 128 : threshold;
  const output = new Uint8ClampedArray(gray.length * 4);
  const spread = (x: number, y: number, error: number) => {
    if (x >= 0 && x < width && y < height) gray[y * width + x]! += error;
  };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      let v = gray[i]! < usedThreshold ? 0 : 255;
      if (mode === "dither") {
        const error = gray[i]! - v;
        spread(x + 1, y, (error * 7) / 16);
        spread(x - 1, y + 1, (error * 3) / 16);
        spread(x, y + 1, (error * 5) / 16);
        spread(x + 1, y + 1, error / 16);
      }
      if (invert) v = 255 - v;
      output[i * 4] = output[i * 4 + 1] = output[i * 4 + 2] = v;
      output[i * 4 + 3] = 255;
    }
  return { pixels: output, bytes: encodeRgf(output, width, height), threshold: usedThreshold };
}

export function processAudio(samples: Float32Array, settings: AudioSettings) {
  if (
    ![settings.volume, settings.fadeIn, settings.fadeOut].every(Number.isFinite) ||
    settings.volume < 0 ||
    settings.volume > 200 ||
    settings.fadeIn < 0 ||
    settings.fadeOut < 0
  )
    throw new Error("Invalid audio settings");
  let peak = 0;
  for (const v of samples) {
    if (!Number.isFinite(v)) throw new Error("Invalid sample");
    peak = Math.max(peak, Math.abs(v));
  }
  const gain =
    (settings.volume / 100) * (settings.normalize && peak > 0 ? 10 ** (-1 / 20) / peak : 1);
  const output = new Float32Array(samples.length);
  const fadeIn = Math.min(Math.round(settings.fadeIn * SAMPLE_RATE), samples.length - 1);
  const fadeOut = Math.min(Math.round(settings.fadeOut * SAMPLE_RATE), samples.length - 1);
  let clipped = 0;
  for (let i = 0; i < samples.length; i++) {
    const envelope = Math.min(
      fadeIn > 0 ? Math.min(1, i / fadeIn) : 1,
      fadeOut > 0 ? Math.min(1, (samples.length - 1 - i) / fadeOut) : 1,
    );
    const v = samples[i]! * gain * envelope;
    if (Math.abs(v) > 1) clipped++;
    output[i] = clamp(v, -1, 1);
  }
  return { samples: output, clipped, gain };
}

export function waveformPeaks(channels: Float32Array[], bins = 600) {
  const length = channels[0]?.length ?? 0;
  const count = Math.min(bins, length);
  const peaks = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const from = Math.floor((i * length) / count),
      to = Math.floor(((i + 1) * length) / count);
    let peak = 0;
    for (const channel of channels)
      for (let j = from; j < to; j++) peak = Math.max(peak, Math.abs(channel[j]!));
    peaks[i] = peak;
  }
  return peaks;
}
