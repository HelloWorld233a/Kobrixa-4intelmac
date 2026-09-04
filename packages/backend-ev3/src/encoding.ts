export function int16(value: number): number[] {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setInt16(0, value, true);
  return [...bytes];
}

export function uint16(value: number): number[] {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return [...bytes];
}

export function int32(value: number): number[] {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setInt32(0, value, true);
  return [...bytes];
}

export function uint32(value: number): number[] {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return [...bytes];
}

export function float32(value: number): number[] {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setFloat32(0, value, true);
  return [...bytes];
}

export function lc(value: number): number[] {
  if (Number.isInteger(value) && value >= -32 && value <= 31) return [value & 0x3f];
  if (Number.isInteger(value) && value >= -128 && value <= 127) return [0x81, value & 0xff];
  if (Number.isInteger(value) && value >= -32768 && value <= 32767) return [0x82, ...int16(value)];
  return [0x83, ...int32(value)];
}

export function lcf(value: number): number[] {
  return [0x83, ...float32(value)];
}

export function lcs(value: string): number[] {
  return [0x84, ...new TextEncoder().encode(value), 0];
}

export function lv(offset: number): number[] {
  if (offset >= 0 && offset <= 31) return [0x40 | offset];
  if (offset <= 0xff) return [0xc1, offset];
  if (offset <= 0xffff) return [0xc2, ...uint16(offset)];
  return [0xc3, ...uint32(offset)];
}

export function gv(offset: number): number[] {
  if (offset >= 0 && offset <= 31) return [0x60 | offset];
  if (offset <= 0xff) return [0xe1, offset];
  if (offset <= 0xffff) return [0xe2, ...uint16(offset)];
  return [0xe3, ...uint32(offset)];
}

/** Encodes a local dynamic-array handle as a pointer to its array contents. */
export function lh(offset: number): number[] {
  if (offset <= 0xff) return [0xd1, offset];
  if (offset <= 0xffff) return [0xd2, ...uint16(offset)];
  return [0xd3, ...uint32(offset)];
}

/** Encodes a global dynamic-array handle as a pointer to its array contents. */
export function gh(offset: number): number[] {
  if (offset <= 0xff) return [0xf1, offset];
  if (offset <= 0xffff) return [0xf2, ...uint16(offset)];
  return [0xf3, ...uint32(offset)];
}

export function relativeOffset(value: number): number[] {
  return [0x83, ...int32(value)];
}
