import type { BufferType } from "./internal.ts";
import { bufferToDataView } from "./internal.ts";

const DECODER = new TextDecoder();
const ENCODER = new TextEncoder();
const HEX = ENCODER.encode("0123456789ABCDEF");
const HEX_CACHE = new Uint8Array(256);

function encodeHexFromView(view: DataView): string {
  if (view.byteLength == 0) {
    return "";
  }
  const length = view.byteLength;
  const hexBytes = new Uint8Array(view.byteLength * 2);

  for (let index = 0, outIndex = 0; index < length; index++, outIndex += 2) {
    const byte = view.getUint8(index);
    hexBytes[outIndex] = HEX[(byte & 0xF0) >> 4];
    hexBytes[outIndex + 1] = HEX[byte & 0x0F];
  }
  return DECODER.decode(hexBytes);
}

/**
 * Encode a data view, typed array, or array buffer as a hex string
 *
 * Note that multi-byte types will be encoded according to the process's
 * endianness. Therefore, for portability, it is recommended to use
 * `arrayToEndian` on multi-byte typed arrays, such as Uint32Array before
 * encoding as hex.
 *
 * @param array input array to encode
 * @returns a string which when decoded as hex will have the same bytes as was
 *          input.
 */
export function encodeHex(array: BufferType): string {
  if (
    array instanceof Uint8Array ||
    array instanceof Int8Array ||
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
    return encodeHexFromView(new DataView(array.buffer));
  } else if (array instanceof ArrayBuffer) {
    return encodeHexFromView(new DataView(array));
  } else if (array instanceof DataView) {
    return encodeHexFromView(array);
  } else {
    throw new Error("Bad input to encodeHex");
  }
}

const BAD_INPUT_HEX = "Bad input to decodeHex";
/**
 * Decode a hex string into a Uint8Array
 *
 * Will throw when the input text has non hex characters, including spaces,
 * or when the input text has a length which is not even.
 *
 * Upper and lower A-F are accepted.
 * Characters outside of 0-9, A-F, a-f will throw.
 *
 * @param text input text of hex characters
 * @returns a decoded Uint8Array
 */
export function decodeHex(text: string): Uint8Array {
  if (text == "") {
    return new Uint8Array();
  }
  const hexBytes = ENCODER.encode(text);
  let index = 0;
  let badHex = false;
  if (hexBytes.length & 1) {
    // Only even lengths
    throw new Error(BAD_INPUT_HEX);
  }
  if (HEX_CACHE[0] == 0) {
    for (let i = 0; i < 256; i++) {
      if (i >= 48 && i <= 57) {
        HEX_CACHE[i] = i - 48;
      } else if (i >= 65 && i <= 70) {
        HEX_CACHE[i] = i - 55;
      } else if (i >= 97 && i <= 102) {
        HEX_CACHE[i] = i - 87;
      } else {
        HEX_CACHE[i] = 255;
      }
    }
  }
  const bytes = new Uint8Array(Math.ceil(text.length / 2));
  for (let i = 0; i < hexBytes.length; i += 2, index++) {
    const leftHex = hexBytes[i];
    const rightHex = hexBytes[i + 1];
    const left = HEX_CACHE[leftHex];
    const right = HEX_CACHE[rightHex];
    bytes[index] = left << 4 | right;
    if (left == 255 || right == 255) {
      badHex = true;
      break;
    }
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
  }
  // mod3 == 2
  return [withPadding - 1, completeChunks, mod3];
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

/**
 * A base64 standard implementation, see RFC4648
 * https://datatracker.ietf.org/doc/html/rfc4648
 * section Base 64 Encoding
 *
 * This function will encode input bytes into a string using the characters
 * A-Z, a-z, 0-9, +, /, and = as padding at the end.
 *
 * Note that multi-byte types will be encoded according to the process's
 * endianness. Therefore, for portability, it is recommended to use
 * `arrayToEndian` on multi-byte typed arrays, such as Uint32Array before
 * encoding as hex.
 *
 * @param array Input data to encode
 * @returns a text string matching Base64
 */
export function encodeBase64(
  array: BufferType,
): string {
  return encodeBase64Alphabet(array, BASE64_OUT, true);
}

/**
 * A base64 url implementation, see RFC4648
 * https://datatracker.ietf.org/doc/html/rfc4648 section
 * Base 64 Encoding with URL and Filename Safe Alphabet
 *
 * This function will encode input bytes into a string using the characters
 * A-Z, a-z, 0-9, -, _, and with no padding.
 *
 * Note that multi-byte types will be encoded according to the process's
 * endianness. Therefore, for portability, it is recommended to use
 * `arrayToEndian` on multi-byte typed arrays, such as Uint32Array before
 * encoding as hex.
 *
 * @param array Input data to encode
 * @returns a text string matching Base64
 */
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
    const aValue = alphabet[input[i]];
    const bValue = alphabet[input[i + 1]];
    const cValue = alphabet[input[i + 2]];
    const dValue = alphabet[input[i + 3]];
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
/**
 * Decode a base64 standard input into a Uint8Array
 *
 * This function will throw when characters other than A-Z, a-z, 0-9, +, and
 * / are used, with the exception of allowing = at the end.
 *
 * This function will throw when the base64 input padding is mangled.
 *
 * This function will throw when the length does not meet expectations.
 *
 * @param text Input base64 standard string
 * @returns an output Uint8Array of decoded bytes
 */
export function decodeBase64(text: string): Uint8Array {
  if (typeof text != "string") {
    throw new Error("Expecting a string");
  }
  if (text.length == 0) {
    return new Uint8Array([]);
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
/**
 * Decode a base64 url input into a Uint8Array
 *
 * This function will throw when characters other than A-Z, a-z, 0-9, -, and
 * _ are used. No padding is expected.
 *
 * This function will throw when the base64 input padding is mangled.
 *
 * This function will throw when the length does not meet expectations.
 *
 * @param text Input base64 standard string
 * @returns an output Uint8Array of decoded bytes
 */
export function decodeBase64Url(text: string): Uint8Array {
  if (typeof text != "string") {
    throw new Error("Expecting a string");
  }
  if (text.length == 0) {
    return new Uint8Array([]);
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
