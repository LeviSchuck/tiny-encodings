export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;
export type BufferType = TypedArray | ArrayBuffer | DataView;
export function bufferToDataView(v: BufferType): DataView {
  if (v instanceof DataView) {
    return v;
  } else if (
    v instanceof Uint8Array ||
    v instanceof Int8Array ||
    v instanceof Int16Array ||
    v instanceof Uint16Array ||
    v instanceof Int32Array ||
    v instanceof Uint32Array ||
    v instanceof Uint8ClampedArray ||
    v instanceof Float32Array ||
    v instanceof Float64Array ||
    v instanceof BigInt64Array ||
    v instanceof BigUint64Array
  ) {
    return new DataView(v.buffer);
  } else if (v instanceof ArrayBuffer) {
    return new DataView(v);
  }
  throw new Error("Unsupported type");
}
