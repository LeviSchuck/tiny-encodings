//deno-lint-ignore-file no-explicit-any
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.195.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.195.0/testing/bdd.ts";
import {
  decodeBase64,
  decodeBase64Url,
  decodeHex,
  encodeBase64,
  encodeBase64Url,
  encodeHex,
} from "./encoding.ts";

const textEncoder = new TextEncoder();

describe("Hex Decoding", () => {
  it("Hex decoding works", () => {
    assertEquals(decodeHex("00"), new Uint8Array([0x00]));
    assertEquals(decodeHex("00FF00FF"), new Uint8Array([0, 255, 0, 255]));
    assertEquals(decodeHex("00ff00ff"), new Uint8Array([0, 255, 0, 255]));
  });
  it("Hex decoding accepts empty", () => {
    assertEquals(decodeHex(""), new Uint8Array([]));
  });
  it("Decode Hex throws on null", () => {
    assertThrows(() => {
      decodeHex(null as any);
    });
  });
  it("Decode Hex throws on object", () => {
    assertThrows(() => {
      decodeHex({} as any);
    });
  });
  it("Decode Hex throws on string", () => {
    assertThrows(() => {
      decodeHex("taco");
    });
  });
});

describe("Hex Encoding", () => {
  it("Hex encoding works", () => {
    assertEquals(encodeHex(new Uint8Array([0x00])), "00");
    assertEquals(encodeHex(new Uint8Array([0, 255, 0, 255])), "00FF00FF");
  });
  it("Encode Hex throws on null", () => {
    assertThrows(() => {
      encodeHex(null as any);
    });
  });
  it("Encode Hex throws on object", () => {
    assertThrows(() => {
      encodeHex({} as any);
    });
  });
  it("Encode Hex throws on string", () => {
    assertThrows(() => {
      encodeHex("taco" as any);
    });
  });
});

describe("Base64 Decoding", () => {
  it("Base64 denies mangled padding", () => {
    assertThrows(() => {
      decodeBase64("A/==");
    });
    assertThrows(() => {
      decodeBase64("AA/=");
    });
  });
  it("Base64 decoding works", () => {
    assertEquals(
      decodeBase64("AA=="),
      new Uint8Array([0]),
    );
    assertEquals(
      decodeBase64("AAA="),
      new Uint8Array([0, 0]),
    );
    assertEquals(
      decodeBase64("AAAA"),
      new Uint8Array([0, 0, 0]),
    );
    assertEquals(
      decodeBase64("AQID"),
      new Uint8Array([1, 2, 3]),
    );
    assertEquals(
      decodeBase64("AQIDAQID"),
      new Uint8Array([1, 2, 3, 1, 2, 3]),
    );
    assertEquals(
      decodeBase64("/+7d"),
      new Uint8Array([0xff, 0xee, 0xdd]),
    );
    assertEquals(
      decodeBase64("/+7d/+7d"),
      new Uint8Array([0xff, 0xee, 0xdd, 0xff, 0xee, 0xdd]),
    );
    assertEquals(
      decodeBase64("aGVsbG8gd29ybGQ="),
      textEncoder.encode("hello world"),
    );
    assertEquals(
      decodeBase64("ABEiM0RVZneImaq7zN3u/w=="),
      new Uint8Array([
        0x00,
        0x11,
        0x22,
        0x33,
        0x44,
        0x55,
        0x66,
        0x77,
        0x88,
        0x99,
        0xAA,
        0xBB,
        0xCC,
        0xDD,
        0xEE,
        0xFF,
      ]),
    );
    assertEquals(decodeBase64("AAD+"), new Uint8Array([0, 0, 254]));
    assertEquals(decodeBase64("AAD/"), new Uint8Array([0, 0, 255]));
  });
});
describe("Base64 Encoding", () => {
  it("Base64 encoding works", () => {
    assertEquals(
      encodeBase64(textEncoder.encode("hello world")),
      "aGVsbG8gd29ybGQ=",
    );
    assertEquals(encodeBase64(new Uint8Array([0, 0, 254])), "AAD+");
    assertEquals(encodeBase64(new Uint8Array([0, 0, 255])), "AAD/");
  });
  it("Throws when given non buffers", () => {
    assertThrows(() => {
      encodeBase64("hello" as any);
    });
  });
});
describe("Base64 URL Encoding", () => {
  it("Base64 url encoding works", () => {
    assertEquals(
      encodeBase64Url(textEncoder.encode("hello world")),
      "aGVsbG8gd29ybGQ",
    );
    assertEquals(encodeBase64Url(new Uint8Array([0, 0, 254])), "AAD-");
    assertEquals(encodeBase64Url(new Uint8Array([0, 0, 255])), "AAD_");
  });
});
describe("Base64 URL Decoding", () => {
  it("Base64 url decoding works", () => {
    assertEquals(
      decodeBase64Url("aGVsbG8gd29ybGQ"),
      textEncoder.encode("hello world"),
    );
    assertEquals(
      decodeBase64Url("ABEiM0RVZneImaq7zN3u_w"),
      new Uint8Array([
        0x00,
        0x11,
        0x22,
        0x33,
        0x44,
        0x55,
        0x66,
        0x77,
        0x88,
        0x99,
        0xAA,
        0xBB,
        0xCC,
        0xDD,
        0xEE,
        0xFF,
      ]),
    );
    assertEquals(decodeBase64Url("AAD-"), new Uint8Array([0, 0, 254]));
    assertEquals(decodeBase64Url("AAD_"), new Uint8Array([0, 0, 255]));
  });
});
