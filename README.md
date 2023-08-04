# Tiny Encodings

[![](https://img.shields.io/github/actions/workflow/status/levischuck/tiny-encodings/build.yml?branch=main)](https://github.com/LeviSchuck/tiny-encodings/actions)
[![](https://img.shields.io/codecov/c/gh/levischuck/tiny-encodings?style=flat-square)](https://codecov.io/gh/levischuck/tiny-encodings)
[![](https://badge.fury.io/js/@levischuck%2Ftiny-encodings.svg)](https://www.npmjs.com/package/@levischuck/tiny-encodings)
[![](https://img.shields.io/github/v/tag/levischuck/tiny-encodings?label=version&logo=deno&style=flat-square)](https://deno.land/x/tiny_encodings)
[![](https://img.shields.io/github/license/levischuck/tiny-encodings)](https://github.com/LeviSchuck/tiny-encodings/blob/main/LICENSE.txt)
![](https://img.shields.io/bundlephobia/min/%40levischuck/tiny-encodings)

A companion library to join a few other `tiny-*` libraries.

This library provides reasonably fast implementations of:

- Base64 Standard Encoding
- Base64 URL Encoding
- Base64 Standard Decoding
- Base64 URL Decoding
- Hex / Base16 Encoding
- Hex / Base16 Decoding

Where decoding functions take `string`s and output a `Uint8Array`s, and encoding
functions take any buffer type (`ArrayBuffer`, `Uint8Array`, other typed arrays,
and `DataView`s) and output a `string`.

This library follows the byte order of the host, this means that typed arrays
such as `Uint32Array` will be encoded in the byte order in its underlying memory
buffer which is host specific. If platform compatibility is required for
multi-byte buffers, see `arrayToEndian` and `arrayFromEndian`.

_Initially, this library was going to be the reference implementation, as seen
in `encoding_reference.ts`. However, the reference implementation performance is
abysmal._

Tiny-encodings mitigates [Base64 Malleability](https://eprint.iacr.org/2022/361)
by refusing mangled encoded inputs.

```ts
// NPM
// import { decodeBase64 } from "@levischuck/tiny-encodings";
// or Deno
// import { decodeBase64 } from "https://deno.land/x/tiny_encodings@version/index.ts";
import { decodeBase64 } from "./index.ts";

decodeBase64("SGVsbG8gd29ybGQ=");
// returns a Uint8Array with the bytes for "Hello world"
```
