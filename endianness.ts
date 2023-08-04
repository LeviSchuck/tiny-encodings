import { ENDIAN_TEST } from "./endianness_internal.ts";
import type { BufferType, TypedArray } from "./internal.ts";
import { bufferToDataView } from "./internal.ts";

/**
 * Inspect if the byte ordering of this process is big endian.
 *
 * @returns true if the process uses big endian memory order
 */
export function hostIsBigEndian(): boolean {
  return ENDIAN_TEST[1] != 0;
}
/**
 * Inspect if the byte ordering of this process is little endian.
 *
 * @returns true if the process uses little endian memory order
 */
export function hostIsLittleEndian(): boolean {
  return ENDIAN_TEST[0] != 0;
}
/**
 * Inspect if the byte ordering of this process is big or little endian.
 *
 * @returns "big" if the system is big endian, otherwise "little".
 */
export function hostEndianness(): "little" | "big" {
  return hostIsBigEndian() ? "big" : "little";
}

function internalArrayTo(
  array: TypedArray,
  endianness: "little" | "big",
  width: 2 | 4 | 8,
  fun: (v: DataView, i: number, n: number | bigint, l: boolean) => void,
): Uint8Array {
  const out = new Uint8Array(array.byteLength);
  const view = new DataView(out.buffer);
  const length = array.length;
  const little = endianness == "little";
  for (let i = 0, outIndex = 0; i < length; i++, outIndex += width) {
    fun(view, outIndex, array[i], little);
  }
  return out;
}
function internalArrayFrom(
  view: DataView,
  littleEndian: boolean,
  width: 1 | 2 | 4 | 8,
  output: TypedArray,
  fun: (v: DataView, i: number, l: boolean) => number | bigint,
): TypedArray {
  for (let i = 0, j = 0; i < view.byteLength; j++, i += width) {
    output[j] = fun(view, i, littleEndian);
  }
  return output;
}

/**
 * This function takes a typed input array and encodes all elements in the
 * requested endianness order, so that the input array may be communicated
 * in a reliable way to another recipient.
 *
 * Protocols may specify that numbers are encoded in "big" endian, while the
 * host uses "little" endian byte ordering in memory. This function may help
 * in ensuring that sequences of multi-byte numbers are portable between
 * processes.
 *
 * @param array Input array to encode
 * @param endianness what endianness to encode the input array as
 * @returns an output Uint8Array with bytes set in the requested endianness
 *          order which represents the multi-byte numbers in the input array.
 */
export function arrayToEndian(
  array: TypedArray,
  endianness: "little" | "big",
): Uint8Array {
  if (array instanceof Uint8Array) {
    return array;
  } else if (array instanceof Uint16Array) {
    return internalArrayTo(
      array,
      endianness,
      2,
      (v, i, n, l) => v.setUint16(i, n as number, l),
    );
  } else if (array instanceof Int16Array) {
    return internalArrayTo(
      array,
      endianness,
      2,
      (v, i, n, l) => v.setInt16(i, n as number, l),
    );
  } else if (array instanceof Uint32Array) {
    return internalArrayTo(
      array,
      endianness,
      4,
      (v, i, n, l) => v.setUint32(i, n as number, l),
    );
  } else if (array instanceof Int32Array) {
    return internalArrayTo(
      array,
      endianness,
      4,
      (v, i, n, l) => v.setInt32(i, n as number, l),
    );
  } else if (array instanceof BigUint64Array) {
    return internalArrayTo(
      array,
      endianness,
      8,
      (v, i, n, l) => v.setBigUint64(i, n as bigint, l),
    );
  } else if (array instanceof BigInt64Array) {
    return internalArrayTo(
      array,
      endianness,
      8,
      (v, i, n, l) => v.setBigInt64(i, n as bigint, l),
    );
  } else if (array instanceof Float32Array) {
    return internalArrayTo(
      array,
      endianness,
      4,
      (v, i, n, l) => v.setFloat32(i, n as number, l),
    );
  } else if (array instanceof Float64Array) {
    return internalArrayTo(
      array,
      endianness,
      8,
      (v, i, n, l) => v.setFloat64(i, n as number, l),
    );
  }
  // Int8Array
  return new Uint8Array(array.buffer);
}

/**
 * This function receives a sequence of bytes, which is known to contain
 * multi-byte numbers encoded with a known endianness, and outputs a typed
 * array of those multi-byte numbers in the requested format / type.
 *
 * Will throw if the input array is not sized for the type that is asked for.
 * If you are processing a section of data in a larger sequence of bytes then
 * use a DataView.
 *
 * @param array Source bytes to read from, various types are supported, the
 *              bytes will be read as they are stored in memory. While it can
 *              take a Uint32Array type, this is not advised.
 * @param endianness the endianness of bytes, most protocols use "big",
 *                   while most systems use "little".
 * @param type the output type desired, for example "uint32" will
 *             return a Uint32Array.
 * @returns a typed array populated with the numbers sourced from the input
 *          array with the endianness taken into account
 */
export function arrayFromEndian(
  view: BufferType,
  endianness: "little" | "big",
  type: "uint8",
): Uint8Array;
export function arrayFromEndian(
  view: BufferType,
  endianness: "little" | "big",
  type: "int8",
): Int8Array;
export function arrayFromEndian(
  view: BufferType,
  endianness: "little" | "big",
  type: "uint16",
): Uint16Array;
export function arrayFromEndian(
  view: BufferType,
  endianness: "little" | "big",
  type: "int16",
): Int16Array;
export function arrayFromEndian(
  view: BufferType,
  endianness: "little" | "big",
  type: "uint32",
): Uint32Array;
export function arrayFromEndian(
  view: BufferType,
  endianness: "little" | "big",
  type: "int32",
): Int32Array;
export function arrayFromEndian(
  view: BufferType,
  endianness: "little" | "big",
  type: "uint64",
): BigUint64Array;
export function arrayFromEndian(
  view: BufferType,
  endianness: "little" | "big",
  type: "int64",
): BigInt64Array;
export function arrayFromEndian(
  view: BufferType,
  endianness: "little" | "big",
  type: "float32",
): Float32Array;
export function arrayFromEndian(
  view: BufferType,
  endianness: "little" | "big",
  type: "float64",
): Float64Array;
export function arrayFromEndian(
  array: BufferType,
  endianness: "little" | "big",
  type:
    | "uint8"
    | "int8"
    | "uint16"
    | "int16"
    | "uint32"
    | "int32"
    | "uint64"
    | "int64"
    | "float32"
    | "float64",
): TypedArray {
  const view = bufferToDataView(array);
  const littleEndian = endianness == "little";
  if (type == "int8") {
    return internalArrayFrom(
      view,
      littleEndian,
      1,
      new Int8Array(view.byteLength),
      (v, i, _l) => v.getInt8(i),
    );
  } else if (type == "uint16") {
    if (view.byteLength & 1) {
      throw new Error("Incomplete byte sequence");
    }
    return internalArrayFrom(
      view,
      littleEndian,
      2,
      new Uint16Array(view.byteLength >>> 1),
      (v, i, l) => v.getUint16(i, l),
    );
  } else if (type == "int16") {
    if (view.byteLength & 1) {
      throw new Error("Incomplete byte sequence");
    }
    return internalArrayFrom(
      view,
      littleEndian,
      2,
      new Int16Array(view.byteLength >>> 1),
      (v, i, l) => v.getInt16(i, l),
    );
  } else if (type == "uint32") {
    if (view.byteLength & 3) {
      throw new Error("Incomplete byte sequence");
    }
    return internalArrayFrom(
      view,
      littleEndian,
      4,
      new Uint32Array(view.byteLength >>> 2),
      (v, i, l) => v.getUint32(i, l),
    );
  } else if (type == "int32") {
    if (view.byteLength & 3) {
      throw new Error("Incomplete byte sequence");
    }
    return internalArrayFrom(
      view,
      littleEndian,
      4,
      new Int32Array(view.byteLength >>> 2),
      (v, i, l) => v.getInt32(i, l),
    );
  } else if (type == "uint64") {
    if (view.byteLength & 7) {
      throw new Error("Incomplete byte sequence");
    }
    return internalArrayFrom(
      view,
      littleEndian,
      8,
      new BigUint64Array(view.byteLength >>> 3),
      (v, i, l) => v.getBigUint64(i, l),
    );
  } else if (type == "int64") {
    if (view.byteLength & 7) {
      throw new Error("Incomplete byte sequence");
    }
    return internalArrayFrom(
      view,
      littleEndian,
      8,
      new BigInt64Array(view.byteLength >>> 3),
      (v, i, l) => v.getBigInt64(i, l),
    );
  } else if (type == "float32") {
    if (view.byteLength & 3) {
      throw new Error("Incomplete byte sequence");
    }
    return internalArrayFrom(
      view,
      littleEndian,
      4,
      new Float32Array(view.byteLength >>> 2),
      (v, i, l) => v.getFloat32(i, l),
    );
  } else if (type == "float64") {
    if (view.byteLength & 7) {
      throw new Error("Incomplete byte sequence");
    }
    return internalArrayFrom(
      view,
      littleEndian,
      8,
      new Float64Array(view.byteLength >>> 3),
      (v, i, l) => v.getFloat64(i, l),
    );
  }
  // Last is uint8
  return new Uint8Array(
    view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength),
  );
}
