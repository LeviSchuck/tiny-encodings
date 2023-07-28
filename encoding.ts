// TODO correct all data view . buffer access
// TODO ensure padding bits are 0
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
function bufferToDataView(v: BufferType): DataView {
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

const HEX = [
  48, // 0
  49, // 1
  50, // 2
  51, // 3
  52, // 4
  53, // 5
  54, // 6
  55, // 7
  56, // 8
  57, // 9
  65, // A
  66, // B
  67, // C
  68, // D
  69, // E
  70, // F
];
const DECODER = new TextDecoder();
const ENCODER = new TextEncoder();

function encodeHexFromUint8Array(array: Uint8Array): string {
  if (array.length == 0) {
    return "";
  }
  const hexBytes = new Uint8Array(array.length * 2);
  array.forEach((byte, index) => {
    const hexIndex = index * 2;
    hexBytes[hexIndex] = HEX[(0xF0 & byte) >> 4];
    hexBytes[hexIndex + 1] = HEX[0x0F & byte];
  });
  return DECODER.decode(hexBytes);
}

export function encodeHex(array: ArrayBuffer | TypedArray | DataView): string {
  if (array instanceof Uint8Array) {
    return encodeHexFromUint8Array(array);
  } else if (
    array instanceof ArrayBuffer || array instanceof Int8Array ||
    array instanceof Int16Array ||
    array instanceof Uint16Array ||
    array instanceof Int32Array ||
    array instanceof Uint32Array ||
    array instanceof Uint8ClampedArray ||
    array instanceof Float32Array ||
    array instanceof Float64Array ||
    array instanceof BigInt64Array ||
    array instanceof BigUint64Array
  ) {
    return encodeHexFromUint8Array(new Uint8Array(array));
  } else if (array instanceof DataView) {
    return encodeHexFromUint8Array(new Uint8Array(array.buffer));
  } else {
    throw new Error("Bad input to encodeHex");
  }
}

const BAD_INPUT_HEX = "Bad input to decodeHex";
export function decodeHex(text: string): Uint8Array {
  if (text == "") {
    return new Uint8Array();
  }
  const bytes = new Uint8Array(Math.ceil(text.length / 2));
  const hexBytes = ENCODER.encode(text);
  let index = 0;
  let badHex = false;
  if (hexBytes.length & 1) {
    // Only even lengths
    throw new Error(BAD_INPUT_HEX);
  }
  for (let i = 0; i < hexBytes.length; i += 2, index++) {
    const leftHex = hexBytes[i];
    const rightHex = hexBytes[i + 1];
    let left: number;
    if (leftHex >= 48 && leftHex <= 57) {
      left = leftHex - 48;
    } else if (leftHex >= 65 && leftHex <= 70) {
      left = leftHex - 55;
    } else if (leftHex >= 97 && leftHex <= 102) {
      left = leftHex - 87;
    } else {
      badHex = true;
      break;
    }
    let right: number;
    if (rightHex >= 48 && rightHex <= 57) {
      right = rightHex - 48;
    } else if (rightHex >= 65 && rightHex <= 70) {
      right = rightHex - 55;
    } else if (rightHex >= 97 && rightHex <= 102) {
      right = rightHex - 87;
    } else {
      badHex = true;
      break;
    }
    bytes[index] = left << 4 | right;
  }
  if (badHex) {
    throw new Error(BAD_INPUT_HEX);
  }
  return bytes;
}

function encodeBase64Length(
  bufferLength: number,
  padding: boolean,
): [number, number, number] {
  const chunks = Math.ceil(bufferLength / 3);
  const withPadding = chunks * 4;
  const mod3 = bufferLength % 3;
  const completeChunks = mod3 == 0 ? bufferLength : (bufferLength - mod3);

  if (padding || mod3 == 0) {
    return [withPadding, completeChunks, mod3];
  }
  if (mod3 == 1) {
    return [withPadding - 2, completeChunks, mod3];
  } else if (mod3 == 2) {
    return [withPadding - 1, completeChunks, mod3];
  }
  // unreachable
  return [withPadding, completeChunks, mod3];
}

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64_OUT = ENCODER.encode(BASE64_ALPHABET);
const BASE64_CACHE = new Uint8Array(256);

const BASE64_URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const BASE64_URL_OUT = ENCODER.encode(BASE64_URL_ALPHABET);
const BASE64_URL_CACHE = new Uint8Array(256);

function encodeBase64Alphabet(
  array: BufferType,
  out: Uint8Array,
  padding: boolean,
) {
  const view = bufferToDataView(array);
  const [encodedLength, encodedChunkableLength, mod3] = encodeBase64Length(
    view.byteLength,
    padding,
  );
  const output = new Uint8Array(encodedLength);
  let outputIndex = 0;
  for (let i = 0; i < encodedChunkableLength; i += 3) {
    const a = view.getUint8(i);
    const b = view.getUint8(i + 1);
    const c = view.getUint8(i + 2);
    output[outputIndex] = out[(a & 0b1111_1100) >> 2];
    output[outputIndex + 1] = out[(a & 0b11) << 4 | (b & 0b1111_0000) >> 4];
    output[outputIndex + 2] = out[(b & 0b1111) << 2 | (c & 0b1100_0000) >> 6];
    output[outputIndex + 3] = out[c & 0b0011_1111];
    outputIndex += 4;
  }
  if (mod3 == 1) {
    const a = view.getUint8(encodedChunkableLength);
    output[outputIndex] = out[(a & 0b1111_1100) >> 2];
    output[outputIndex + 1] = out[(a & 0b0000_0011) << 4];
    if (padding) {
      output[outputIndex + 2] = 61;
      output[outputIndex + 3] = 61;
    }
  } else if (mod3 == 2) {
    const a = view.getUint8(encodedChunkableLength);
    const b = view.getUint8(encodedChunkableLength + 1);
    output[outputIndex] = out[(a & 0b1111_1100) >> 2];
    output[outputIndex + 1] =
      out[(a & 0b0000_0011) << 4 | (b & 0b1111_0000) >> 4];
    output[outputIndex + 2] = out[(b & 0b1111) << 2];
    if (padding) {
      output[outputIndex + 3] = 61;
    }
  }
  return DECODER.decode(output);
}

export function encodeBase64(
  array: BufferType,
): string {
  return encodeBase64Alphabet(array, BASE64_OUT, true);
}

export function encodeBase64Url(
  array: BufferType,
): string {
  return encodeBase64Alphabet(array, BASE64_URL_OUT, false);
}

function decodeBase64Alphabet(
  input: Uint8Array,
  length: number,
  lengthMod4: number,
  output: Uint8Array,
  alphabet: Uint8Array,
) {
  let index = 0;
  let unsupported: number | null = null;
  const totalLength = length - lengthMod4;
  for (let i = 0; i < totalLength; i += 4, index += 3) {
    const aValue = alphabet[input[i]]|0;
    const bValue = alphabet[input[i + 1]]|0;
    const cValue = alphabet[input[i + 2]]|0;
    const dValue = alphabet[input[i + 3]]|0;
    output[index] = (aValue << 2) | ((bValue & 0b110000) >> 4);
    output[index + 1] = ((bValue & 0xF) << 4) | ((cValue & 0b111100) >> 2);
    output[index + 2] = ((cValue & 0b11) << 6) | dValue;
    if (aValue == 255 || bValue == 255 || cValue == 255 || dValue == 255) {
      unsupported = i;
      break;
    }
  }
  if (unsupported != null) {
    throw new Error(
      "Unsupported characters in base64: " + DECODER.decode(
        new Uint8Array([
          input[unsupported],
          input[unsupported + 1],
          input[unsupported + 2],
          input[unsupported + 3],
        ]),
      ),
    );
  }
  if (lengthMod4 == 2) {
    const a = input[length - 2];
    const b = input[length - 1];
    const aValue = alphabet[a];
    const bValue = alphabet[b];
    if ((aValue | bValue) == 255) {
      throw new Error(
        "Unsupported characters in base64: " +
          DECODER.decode(new Uint8Array([a, b])) +
          JSON.stringify([aValue, bValue]),
      );
    }
    output[index] = (aValue << 2) | ((bValue & 0b110000) >> 4);
    if ((bValue & 0b1111) != 0) {
      throw new Error("Mangled Base64 padding");
    }
  } else if (lengthMod4 == 3) {
    const a = input[length - 3];
    const b = input[length - 2];
    const c = input[length - 1];
    const aValue = alphabet[a];
    const bValue = alphabet[b];
    const cValue = alphabet[c];
    if ((aValue | bValue | cValue) == 255) {
      throw new Error(
        "Unsupported characters in base64: " +
          DECODER.decode(new Uint8Array([a, b, c])) +
          JSON.stringify([aValue, bValue, cValue]),
      );
    }
    output[index] = (aValue << 2) | ((bValue & 0b110000) >> 4);
    output[index + 1] = ((bValue & 0xF) << 4) | ((cValue & 0b111100) >> 2);
    if ((cValue & 0b11) != 0) {
      throw new Error("Mangled Base64 padding");
    }
  }
}
function calculateLength(text: Uint8Array) {
  let length = text.length;
  // Subtract padding
  for (let i = length - 1; i >= 0; i--) {
    if (text[i] == 61) {
      length = i;
    }
  }
  const lengthMod4 = length % 4;
  let byteLength: number;
  if (lengthMod4 == 2) {
    byteLength = ((length - 2) / 4) * 3 + 1;
  } else if (lengthMod4 == 3) {
    byteLength = ((length - 3) / 4) * 3 + 2;
  } else if (lengthMod4 == 0) {
    byteLength = length / 4 * 3;
  } else {
    throw new Error("Invalid base64 length");
  }
  return [length, lengthMod4, byteLength];
}
export function decodeBase64(text: string): Uint8Array {
  if (typeof text != "string") {
    throw new Error("Expecting a string");
  }
  if (BASE64_CACHE[0] == 0) {
    for (let i = 0; i < 256; i++) {
      BASE64_CACHE[i] = 255;
    }
    for (let i = 0; i < BASE64_ALPHABET.length; i++) {
      BASE64_CACHE[BASE64_ALPHABET.charCodeAt(i)] = i;
    }
  }
  const input = ENCODER.encode(text);
  const [length, lengthMod4, byteLength] = calculateLength(input);
  const output = new Uint8Array(byteLength);
  decodeBase64Alphabet(input, length, lengthMod4, output, BASE64_CACHE);
  return output;
}
export function decodeBase64Url(text: string): Uint8Array {
  if (typeof text != "string") {
    throw new Error("Expecting a string");
  }
  if (BASE64_URL_CACHE[0] == 0) {
    for (let i = 0; i < 256; i++) {
      BASE64_URL_CACHE[i] = 255;
    }
    for (let i = 0; i < BASE64_URL_ALPHABET.length; i++) {
      BASE64_URL_CACHE[BASE64_URL_ALPHABET.charCodeAt(i)] = i;
    }
  }
  const input = ENCODER.encode(text);
  const [length, lengthMod4, byteLength] = calculateLength(input);
  const output = new Uint8Array(byteLength);
  decodeBase64Alphabet(input, length, lengthMod4, output, BASE64_URL_CACHE);
  return output;
}
