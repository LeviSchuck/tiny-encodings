import {
  decodeBase64,
  decodeBase64Url,
  decodeHex,
  encodeBase64,
  encodeBase64Url,
  encodeHex,
} from "./encoding.ts";

const array = new Uint8Array(128);
crypto.getRandomValues(array);
const exampleBase64 = encodeBase64(array);
const exampleBase64Url = encodeBase64Url(array);
const exampleHex = encodeHex(array);

Deno.bench({
  name: "Encode Base64",
  fn() {
    encodeBase64(array);
  },
});

Deno.bench({
  name: "Encode Base64Url",
  fn() {
    encodeBase64Url(array);
  },
});

Deno.bench({
  name: "Decode Base64",
  fn() {
    decodeBase64(exampleBase64);
  },
});

Deno.bench({
  name: "Decode Base64Url",
  fn() {
    decodeBase64Url(exampleBase64Url);
  },
});

Deno.bench({
  name: "Encode Hex",
  fn() {
    encodeHex(array);
  },
});

Deno.bench({
  name: "Decode Hex",
  fn() {
    decodeHex(exampleHex);
  },
});
