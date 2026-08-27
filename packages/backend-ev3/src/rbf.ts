import { uint16, uint32 } from "./encoding.js";

export interface RbfObject {
  ownerObjectId: number;
  triggerCount: number;
  localBytes: number;
  code: Uint8Array;
}

export interface RbfInfo {
  imageSize: number;
  version: number;
  objectCount: number;
  globalBytes: number;
  offsets: number[];
}

export function createRbf(objects: RbfObject[], globalBytes = 0): Uint8Array {
  const headerSize = 16 + objects.length * 12;
  const offsets: number[] = [];
  let cursor = headerSize;
  for (const object of objects) {
    offsets.push(cursor);
    cursor += object.code.length;
  }
  const bytes = [
    ...new TextEncoder().encode("LEGO"),
    ...uint32(cursor),
    ...uint16(104),
    ...uint16(objects.length),
    ...uint32(globalBytes),
  ];
  objects.forEach((object, index) => {
    bytes.push(
      ...uint32(offsets[index]!),
      ...uint16(object.ownerObjectId),
      ...uint16(object.triggerCount),
      ...uint32(object.localBytes),
    );
  });
  for (const object of objects) bytes.push(...object.code);
  return Uint8Array.from(bytes);
}

export function inspectRbf(image: Uint8Array): RbfInfo {
  if (image.length < 28 || new TextDecoder().decode(image.slice(0, 4)) !== "LEGO")
    throw new Error("Invalid EV3 image magic.");
  const view = new DataView(image.buffer, image.byteOffset, image.byteLength);
  const imageSize = view.getUint32(4, true);
  const version = view.getUint16(8, true);
  const objectCount = view.getUint16(10, true);
  const globalBytes = view.getUint32(12, true);
  if (imageSize !== image.length) throw new Error("EV3 image size does not match its header.");
  if (version !== 104) throw new Error(`Unsupported EV3 bytecode version ${version}.`);
  if (objectCount < 1 || 16 + objectCount * 12 > image.length)
    throw new Error("Invalid EV3 object table.");
  const offsets = Array.from({ length: objectCount }, (_, index) =>
    view.getUint32(16 + index * 12, true),
  );
  if (
    offsets.some(
      (offset, index) =>
        offset < 16 + objectCount * 12 ||
        offset >= image.length ||
        (index > 0 && offset <= offsets[index - 1]!),
    )
  ) {
    throw new Error("Invalid EV3 object offset.");
  }
  return { imageSize, version, objectCount, globalBytes, offsets };
}
