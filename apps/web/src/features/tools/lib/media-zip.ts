export type ArchiveFile = { name: string; bytes: Uint8Array<ArrayBuffer> };

const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  return crc >>> 0;
});
function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255]!;
  return (crc ^ 0xffffffff) >>> 0;
}

/** ZIP "store" entries: small local export, UTF-8 paths, no compression or ZIP64. */
export function mediaZip(files: ArchiveFile[]): Uint8Array<ArrayBuffer> {
  if (!files.length || files.length > 65535) throw new Error("Invalid archive size");
  const names = new Set<string>();
  let localSize = 0,
    directorySize = 0;
  const entries = files.map((file) => {
    if (
      !file.name ||
      names.has(file.name) ||
      file.name.startsWith("/") ||
      file.name.includes("\\") ||
      file.name.includes("\0") ||
      file.name.split("/").some((part) => !part || part === "." || part === "..")
    )
      throw new Error("Invalid archive path");
    names.add(file.name);
    const name = new TextEncoder().encode(file.name);
    if (name.length > 65535 || file.bytes.length > 0xffffffff)
      throw new Error("Archive entry too large");
    const entry = { ...file, encodedName: name, offset: localSize, crc: crc32(file.bytes) };
    localSize += 30 + name.length + file.bytes.length;
    directorySize += 46 + name.length;
    return entry;
  });
  if (localSize + directorySize + 22 > 0xffffffff) throw new Error("Archive too large");
  const bytes = new Uint8Array(localSize + directorySize + 22);
  const view = new DataView(bytes.buffer);
  let directoryOffset = localSize;
  for (const entry of entries) {
    const offset = entry.offset;
    view.setUint32(offset, 0x04034b50, true);
    view.setUint16(offset + 4, 20, true); // version needed
    view.setUint16(offset + 6, 0x800, true); // UTF-8
    view.setUint16(offset + 12, 0x21, true); // 1980-01-01
    view.setUint32(offset + 14, entry.crc, true);
    view.setUint32(offset + 18, entry.bytes.length, true);
    view.setUint32(offset + 22, entry.bytes.length, true);
    view.setUint16(offset + 26, entry.encodedName.length, true);
    bytes.set(entry.encodedName, offset + 30);
    bytes.set(entry.bytes, offset + 30 + entry.encodedName.length);

    view.setUint32(directoryOffset, 0x02014b50, true);
    view.setUint16(directoryOffset + 4, 20, true);
    view.setUint16(directoryOffset + 6, 20, true);
    view.setUint16(directoryOffset + 8, 0x800, true);
    view.setUint16(directoryOffset + 14, 0x21, true);
    view.setUint32(directoryOffset + 16, entry.crc, true);
    view.setUint32(directoryOffset + 20, entry.bytes.length, true);
    view.setUint32(directoryOffset + 24, entry.bytes.length, true);
    view.setUint16(directoryOffset + 28, entry.encodedName.length, true);
    view.setUint32(directoryOffset + 42, offset, true);
    bytes.set(entry.encodedName, directoryOffset + 46);
    directoryOffset += 46 + entry.encodedName.length;
  }
  view.setUint32(directoryOffset, 0x06054b50, true);
  view.setUint16(directoryOffset + 8, entries.length, true);
  view.setUint16(directoryOffset + 10, entries.length, true);
  view.setUint32(directoryOffset + 12, directorySize, true);
  view.setUint32(directoryOffset + 16, localSize, true);
  return bytes;
}
