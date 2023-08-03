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
    assertEquals(encodeHex(new Uint8Array([])), "");
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
  it("Hex encoding takes dataview", () => {
    const data = new Uint8Array([0, 255, 0, 255]);
    const view = new DataView(data.buffer);
    assertEquals(encodeHex(view), "00FF00FF");
  });
  it("Hex encoding takes Various array types", () => {
    // ArrayBuffer
    assertEquals(encodeHex(new Uint8Array([1, 2, 3]).buffer), "010203");
    // Typed Arrays
    assertEquals(encodeHex(new Uint8Array([1, 2, 3])), "010203");
    assertEquals(encodeHex(new Int8Array([1, 2, 3])), "010203");
    assertEquals(encodeHex(new Uint8ClampedArray([1, 2, 3])), "010203");

    // Detect platform endianness
    const array = new Uint8Array(4);
    const view = new Uint32Array(array.buffer);
    if (!((view[0] = 1) & array[0])) {
      // Host is Big Endian
      assertEquals(encodeHex(new Uint16Array([1, 2, 3])), "000100020003");
      assertEquals(encodeHex(new Int16Array([1, 2, 3])), "000100020003");
      assertEquals(
        encodeHex(new Uint32Array([1, 2, 3])),
        "000000010000000200000003",
      );
      assertEquals(
        encodeHex(new Int32Array([1, 2, 3])),
        "000000010000000200000003",
      );
      assertEquals(
        encodeHex(new BigUint64Array([1n, 2n, 3n])),
        "000000000000000100000000000000020000000000000003",
      );
      assertEquals(
        encodeHex(new BigInt64Array([1n, 2n, 3n])),
        "000000000000000100000000000000020000000000000003",
      );
    } else {
      // Host Little Endian
      assertEquals(encodeHex(new Uint16Array([1, 2, 3])), "010002000300");
      assertEquals(encodeHex(new Int16Array([1, 2, 3])), "010002000300");
      assertEquals(
        encodeHex(new Uint32Array([1, 2, 3])),
        "010000000200000003000000",
      );
      assertEquals(
        encodeHex(new Int32Array([1, 2, 3])),
        "010000000200000003000000",
      );
      assertEquals(
        encodeHex(new BigUint64Array([1n, 2n, 3n])),
        "010000000000000002000000000000000300000000000000",
      );
      assertEquals(
        encodeHex(new BigInt64Array([1n, 2n, 3n])),
        "010000000000000002000000000000000300000000000000",
      );
    }
    assertEquals(encodeHex(new Float32Array([1.0, 2.0])), "0000803F00000040");
    assertEquals(
      encodeHex(new Float64Array([1.0, 2.0])),
      "000000000000F03F0000000000000040",
    );
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
    assertThrows(() => {
      // Not enough characters (minimum 2 per chunk)
      decodeBase64("A===");
    });
  });

  it("Base64 denies illegal characters", () => {
    assertThrows(() => {
      decodeBase64("A%==");
    });
    assertThrows(() => {
      decodeBase64("AA%=");
    });
    assertThrows(() => {
      decodeBase64("AAA%");
    });
  });

  it("Base64 denies non strings", () => {
    assertThrows(() => {
      decodeBase64(123 as any);
    });
    assertThrows(() => {
      decodeBase64(new Uint8Array([1, 2, 3]) as any);
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
    assertEquals(encodeBase64(new Uint8Array([0])), "AA==");
    assertEquals(encodeBase64(new Uint8Array([0, 0])), "AAA=");
  });
  it("Throws when given non buffers", () => {
    assertThrows(() => {
      encodeBase64("hello" as any);
    });
  });
  it("Base64 encoding accepts various types", () => {
    assertEquals(encodeBase64(new Uint8Array([0, 0, 0]).buffer), "AAAA");
    assertEquals(encodeBase64(new Int8Array([0, 0, 0])), "AAAA");
    // Detect platform endianness
    const array = new Uint8Array(4);
    const view = new Uint32Array(array.buffer);
    if (!((view[0] = 1) & array[0])) {
      // Host is Big Endian
      assertEquals(encodeBase64(new Uint16Array([1, 2, 3])), "AAEAAgAD");
      assertEquals(encodeBase64(new Int16Array([1, 2, 3])), "AAEAAgAD");
      assertEquals(
        encodeBase64(new Uint32Array([1, 2, 3])),
        "AAAAAQAAAAIAAAAD",
      );
      assertEquals(
        encodeBase64(new Int32Array([1, 2, 3])),
        "AAAAAQAAAAIAAAAD",
      );
      assertEquals(
        encodeBase64(new BigUint64Array([1n, 2n, 3n])),
        "AAAAAAAAAAEAAAAAAAAAAgAAAAAAAAAD",
      );
      assertEquals(
        encodeBase64(new BigInt64Array([1n, 2n, 3n])),
        "AAAAAAAAAAEAAAAAAAAAAgAAAAAAAAAD",
      );
    } else {
      // Host Little Endian
      assertEquals(encodeBase64(new Uint16Array([1, 2, 3])), "AQACAAMA");
      assertEquals(encodeBase64(new Int16Array([1, 2, 3])), "AQACAAMA");
      assertEquals(
        encodeBase64(new Uint32Array([1, 2, 3])),
        "AQAAAAIAAAADAAAA",
      );
      assertEquals(
        encodeBase64(new Int32Array([1, 2, 3])),
        "AQAAAAIAAAADAAAA",
      );
      assertEquals(
        encodeBase64(new BigUint64Array([1n, 2n, 3n])),
        "AQAAAAAAAAACAAAAAAAAAAMAAAAAAAAA",
      );
      assertEquals(
        encodeBase64(new BigInt64Array([1n, 2n, 3n])),
        "AQAAAAAAAAACAAAAAAAAAAMAAAAAAAAA",
      );
    }
    assertEquals(encodeBase64(new Float32Array([1.0, 2.0])), "AACAPwAAAEA=");
    assertEquals(
      encodeBase64(new Float64Array([1.0, 2.0])),
      "AAAAAAAA8D8AAAAAAAAAQA==",
    );
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
    assertEquals(encodeBase64Url(new Uint8Array([0])), "AA");
    assertEquals(encodeBase64Url(new Uint8Array([0, 0])), "AAA");
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
  it("Base64 URL decoding rejects non strings", () => {
    assertThrows(() => {
      decodeBase64Url(123 as any);
    });
    assertThrows(() => {
      decodeBase64Url(new Uint8Array([1, 2, 3]) as any);
    });
  });
});
