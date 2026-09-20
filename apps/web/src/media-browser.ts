import { encodeRsf, sampleCount, SAMPLE_RATE } from "./media.js";
import { imageGeometry, processAudio, processImage } from "./media-processing.js";
import type { AudioSettings, ImageSettings } from "./media-processing.js";

export function convertImage(image: HTMLImageElement, settings: ImageSettings) {
  const { width, height } = settings;
  if (
    !Number.isInteger(width) ||
    width < 1 ||
    width > 176 ||
    !Number.isInteger(height) ||
    height < 1 ||
    height > 128
  )
    throw new Error("Invalid dimensions");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);
  const rect = imageGeometry(image.naturalWidth, image.naturalHeight, settings);
  ctx.drawImage(image, rect.left, rect.top, rect.width, rect.height);
  const original = canvas.toDataURL("image/png");
  const result = processImage(ctx.getImageData(0, 0, width, height).data, settings);
  ctx.putImageData(new ImageData(result.pixels, width, height), 0, 0);
  return {
    bytes: result.bytes,
    threshold: result.threshold,
    original,
    preview: canvas.toDataURL("image/png"),
  };
}

export async function convertAudio(buffer: AudioBuffer, settings: AudioSettings) {
  const count = sampleCount(settings.start, settings.end, buffer.duration);
  const context = new OfflineAudioContext(1, count, SAMPLE_RATE);
  // Copy only the selected range, with a short resampling boundary on each side.
  const first = Math.max(0, Math.floor(settings.start * buffer.sampleRate) - 128);
  const last = Math.min(buffer.length, Math.ceil(settings.end * buffer.sampleRate) + 128);
  const mono = context.createBuffer(1, last - first, buffer.sampleRate);
  const samples = mono.getChannelData(0);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const source = buffer.getChannelData(channel);
    for (let i = 0; i < samples.length; i++)
      samples[i]! += source[first + i]! / buffer.numberOfChannels;
  }
  const source = context.createBufferSource();
  source.buffer = mono;
  source.connect(context.destination);
  source.start(0, settings.start - first / buffer.sampleRate);
  try {
    const rendered = await context.startRendering();
    const processed = processAudio(rendered.getChannelData(0), settings);
    return { bytes: encodeRsf(processed.samples), clipped: processed.clipped };
  } finally {
    source.disconnect();
  }
}

export function demoImage(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 528;
  canvas.height = 384;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 528, 384);
  gradient.addColorStop(0, "#ecf5ff");
  gradient.addColorStop(1, "#5b84bd");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 528, 384);
  ctx.fillStyle = "#f6d470";
  ctx.beginPath();
  ctx.arc(425, 82, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#244263";
  ctx.beginPath();
  ctx.moveTo(0, 384);
  ctx.lineTo(110, 195);
  ctx.lineTo(200, 298);
  ctx.lineTo(360, 160);
  ctx.lineTo(528, 384);
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(171, 91, 150, 135);
  ctx.fillRect(190, 231, 112, 80);
  ctx.strokeStyle = "#182b40";
  ctx.lineWidth = 9;
  ctx.strokeRect(171, 91, 150, 135);
  ctx.fillStyle = "#182b40";
  ctx.fillRect(196, 124, 25, 28);
  ctx.fillRect(271, 124, 25, 28);
  ctx.fillRect(212, 180, 67, 10);
  ctx.fillRect(191, 308, 28, 39);
  ctx.fillRect(275, 308, 28, 39);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(new File([blob], "robot-adventure.png", { type: "image/png" }))
          : reject(new Error("Canvas unavailable")),
      "image/png",
    ),
  );
}

export function demoAudio(): File {
  const rate = 16000,
    count = rate * 3,
    bytes = new Uint8Array(44 + count * 2),
    view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) =>
    [...value].forEach((c, i) => (bytes[offset + i] = c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, count * 2, true);
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25];
  for (let i = 0; i < count; i++) {
    const t = i / rate,
      phase = t % 0.5,
      envelope = Math.min(1, phase / 0.015) * Math.max(0, 1 - phase / 0.45);
    view.setInt16(
      44 + i * 2,
      Math.round(Math.sin(2 * Math.PI * notes[Math.floor(t * 2)]! * t) * envelope * 16000),
      true,
    );
  }
  return new File([bytes], "robot-chime.wav", { type: "audio/wav" });
}
