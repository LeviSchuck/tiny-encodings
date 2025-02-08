// Reference implementations, several of these come from StackOverflow

/** 
 * Reference implementation of Hex encoding
 * @param array Input bytes
 * @returns hex encoded string
 */
export function encodeHex(array: ArrayBuffer): string {
  return Array.from(new Uint8Array(array))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
/**
 * Reference implementation of Hex decoding
 * @param text Input hex
 * @returns decoded bytes
 */
export function decodeHex(text: string): Uint8Array {
  text = text.replace(/[^0-9a-zA-Z]+/g, "");
  const match = text.match(/[0-9a-fA-F]{1,2}/g);
  if (text.match(/^[0-9a-fA-F]+$/) && match && match.length) {
    return Uint8Array.from(match.map((byte) => parseInt(byte, 16)));
  }
  throw new Error("Bad input to decodeHex");
}
/**
 * Reference implementation of Base64 encoding
 * @param array Input bytes
 * @returns base64 encoded string
 */
export function encodeBase64(array: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(array)));
}
/**
 * Reference implementation of Base64 decoding
 * @param text Input base64
 * @returns decoded bytes
 */
export function decodeBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}
/**
 * Reference Base64 URL encoding implementation
 * @param array Input bytes
 * @returns base64 URL encoded string
 */
export function encodeBase64Url(array: ArrayBuffer): string {
  return encodeBase64(array)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
/**
 * Reference Base64 URL decoding implementation
 * @param text Input base64
 * @returns decoded bytes
 */
export function decodeBase64Url(text: string): Uint8Array {
  return decodeBase64(text.replace(/-/g, "+").replace(/_/g, "/"));
}
