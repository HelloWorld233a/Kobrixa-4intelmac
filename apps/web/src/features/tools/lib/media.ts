export const SAMPLE_RATE = 8000;
export const MAX_SAMPLES = 65535;
export const MAX_DURATION = MAX_SAMPLES / SAMPLE_RATE;

export function encodeRgf(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
  threshold = 128,
  invert = false,
): Uint8Array<ArrayBuffer> {
  if (
    !Number.isInteger(width) ||
    width < 1 ||
    width > 176 ||
    !Number.isInteger(height) ||
    height < 1 ||
    height > 128 ||
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    threshold > 255 ||
    rgba.length !== width * height * 4
  )
    throw new Error("Invalid image parameters");
  const stride = Math.ceil(width / 8);
  const bytes = new Uint8Array(2 + stride * height);
  bytes[0] = width;
  bytes[1] = height;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = rgba[i + 3]! / 255;
      const luminance =
        ((299 * rgba[i]! + 587 * rgba[i + 1]! + 114 * rgba[i + 2]!) / 1000) * alpha +
        255 * (1 - alpha);
      if (luminance < threshold !== invert)
        bytes[2 + y * stride + Math.floor(x / 8)]! |= 1 << (x % 8);
    }
  }
  return bytes;
}

export function sampleCount(start: number, end: number, duration: number): number {
  if (![start, end, duration].every(Number.isFinite) || start < 0 || end <= start || end > duration)
    throw new Error("Invalid audio range");
  const count = Math.round((end - start) * SAMPLE_RATE);
  if (count < 1 || count > MAX_SAMPLES || end - start > MAX_DURATION + 1e-10)
    throw new Error("Audio range exceeds RSF limit");
  return count;
}

export function encodeRsf(samples: Float32Array, gain = 1): Uint8Array<ArrayBuffer> {
  if (
    samples.length < 1 ||
    samples.length > MAX_SAMPLES ||
    !Number.isFinite(gain) ||
    gain < 0 ||
    gain > 2
  )
    throw new Error("Invalid audio parameters");
  const bytes = new Uint8Array(8 + samples.length);
  const header = new DataView(bytes.buffer);
  header.setUint16(0, 0x0100, false);
  header.setUint16(2, samples.length, false);
  header.setUint16(4, SAMPLE_RATE, false);
  header.setUint16(6, 0, false);
  samples.forEach((sample, index) => {
    if (!Number.isFinite(sample)) throw new Error("Invalid audio sample");
    bytes[8 + index] = Math.round((Math.max(-1, Math.min(1, sample * gain)) + 1) * 127.5);
  });
  return bytes;
}

// Preview contains precisely the same quantized PCM bytes as the RSF download.
export function rsfPreviewWav(rsf: Uint8Array): Uint8Array<ArrayBuffer> {
  const pcm = rsf.subarray(8);
  const bytes = new Uint8Array(44 + pcm.length + (pcm.length % 2));
  const view = new DataView(bytes.buffer);
  const label = (offset: number, text: string) =>
    [...text].forEach((c, i) => {
      bytes[offset + i] = c.charCodeAt(0);
    });
  label(0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  label(8, "WAVE");
  label(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  label(36, "data");
  view.setUint32(40, pcm.length, true);
  bytes.set(pcm, 44);
  return bytes;
}

export function outputName(name: string, extension: string): string {
  return `${name.replace(/\.[^.]+$/, "") || "media"}.${extension}`;
}
