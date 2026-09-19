import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "examples/media/original-media/assets/deploy");
const width = 176;
const height = 128;

function mascotRgf() {
  const pixels = Array.from({ length: height }, () => Array(width).fill(false));
  const fill = (left, top, right, bottom) => {
    for (let y = Math.max(0, top); y < Math.min(height, bottom); y += 1)
      for (let x = Math.max(0, left); x < Math.min(width, right); x += 1) pixels[y][x] = true;
  };
  const outline = (left, top, right, bottom, stroke = 3) => {
    fill(left, top, right, top + stroke);
    fill(left, bottom - stroke, right, bottom);
    fill(left, top, left + stroke, bottom);
    fill(right - stroke, top, right, bottom);
  };
  outline(44, 16, 132, 76, 4);
  fill(62, 38, 72, 48);
  fill(104, 38, 114, 48);
  fill(72, 60, 104, 64);
  fill(52, 80, 124, 112);
  outline(52, 80, 124, 112, 4);
  fill(64, 112, 78, 124);
  fill(98, 112, 112, 124);
  fill(26, 50, 44, 58);
  fill(132, 50, 150, 58);
  const bytes = new Uint8Array(2 + (width * height) / 8);
  bytes[0] = width;
  bytes[1] = height;
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1)
      // EV3 RGF stores the leftmost pixel in the least significant bit.
      if (pixels[y][x]) bytes[2 + y * (width / 8) + Math.floor(x / 8)] |= 1 << (x % 8);
  return bytes;
}

function chimeRsf() {
  const sampleRate = 8000;
  const samples = sampleRate / 2;
  const bytes = new Uint8Array(8 + samples);
  const header = new DataView(bytes.buffer);
  header.setUint16(0, 0x0100, false); // Uncompressed PCM, big endian.
  header.setUint16(2, samples, false);
  header.setUint16(4, sampleRate, false);
  header.setUint16(6, 0, false);
  for (let index = 0; index < samples; index += 1) {
    const envelope = Math.max(0, 1 - index / samples);
    bytes[8 + index] = Math.round(
      127 + Math.sin((2 * Math.PI * 660 * index) / sampleRate) * 70 * envelope,
    );
  }
  return bytes;
}

await mkdir(output, { recursive: true });
await Promise.all([
  writeFile(path.join(output, "kobrixa-mascot.rgf"), mascotRgf()),
  writeFile(path.join(output, "kobrixa-chime.rsf"), chimeRsf()),
]);
console.log("Generated original EV3 media assets.");
