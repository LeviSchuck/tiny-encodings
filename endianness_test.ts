import { assertEquals } from "https://deno.land/std@0.195.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.195.0/testing/bdd.ts";

import {
  ENDIAN_TEST,
  testOnlySetBigEndian,
  testOnlySetLittleEndian,
} from "./endianness_internal.ts";

import {
  arrayFromEndian,
  arrayToEndian,
  hostEndianness,
  hostIsBigEndian,
  hostIsLittleEndian,
} from "./endianness.ts";
import { decodeHex } from "./encoding.ts";
import { assertThrows } from "https://deno.land/std@0.195.0/assert/assert_throws.ts";

describe("Finds endianness automatically", () => {
  it("Initializes with endianness ", () => {
    assertEquals(ENDIAN_TEST[0] + ENDIAN_TEST[1], 1);
    if (ENDIAN_TEST[0] == 1) {
      assertEquals(hostEndianness(), "little");
    } else {
      assertEquals(hostEndianness(), "big");
    }
  });
});

describe("Little Endian", () => {
  it("Reports little endian", () => {
    const original = hostEndianness();
    testOnlySetLittleEndian();
    try {
      assertEquals(hostIsLittleEndian(), true);
      assertEquals(hostIsBigEndian(), false);
      assertEquals(hostEndianness(), "little");
    } finally {
      // restore
      if (original == "big") {
        testOnlySetBigEndian();
      }
    }
  });
});

describe("Big Endian", () => {
  it("Reports big endian", () => {
    const original = hostEndianness();
    testOnlySetBigEndian();
    try {
      assertEquals(hostIsLittleEndian(), false);
      assertEquals(hostIsBigEndian(), true);
      assertEquals(hostEndianness(), "big");
    } finally {
      // restore
      if (original == "little") {
        testOnlySetLittleEndian();
      }
    }
  });
});

describe("array to", () => {
  it("Identity over uint8", () => {
    assertEquals(
      arrayToEndian(new Uint8Array([1, 2, 3]), "big"),
      new Uint8Array([1, 2, 3]),
    );
    assertEquals(
      arrayToEndian(new Uint8Array([1, 2, 3]), "little"),
      new Uint8Array([1, 2, 3]),
    );
  });
  it("int8", () => {
    assertEquals(
      arrayToEndian(new Int8Array([-1, 2, 3]), "big"),
      new Uint8Array([255, 2, 3]),
    );
    assertEquals(
      arrayToEndian(new Int8Array([-1, 2, 3]), "little"),
      new Uint8Array([255, 2, 3]),
    );
  });
  it("uint16", () => {
    assertEquals(
      arrayToEndian(new Uint16Array([1, 2]), "big"),
      new Uint8Array([0, 1, 0, 2]),
    );
    assertEquals(
      arrayToEndian(new Uint16Array([1, 2]), "little"),
      new Uint8Array([1, 0, 2, 0]),
    );
  });
  it("int16", () => {
    assertEquals(
      arrayToEndian(new Int16Array([-2, 2]), "big"),
      new Uint8Array([255, 254, 0, 2]),
    );
    assertEquals(
      arrayToEndian(new Int16Array([-2, 2]), "little"),
      new Uint8Array([254, 255, 2, 0]),
    );
  });
  it("uint32", () => {
    assertEquals(
      arrayToEndian(new Uint32Array([1, 2]), "big"),
      new Uint8Array([0, 0, 0, 1, 0, 0, 0, 2]),
    );
    assertEquals(
      arrayToEndian(new Uint32Array([1, 2]), "little"),
      new Uint8Array([1, 0, 0, 0, 2, 0, 0, 0]),
    );
  });
  it("int32", () => {
    assertEquals(
      arrayToEndian(new Int32Array([-2, 2]), "big"),
      new Uint8Array([255, 255, 255, 254, 0, 0, 0, 2]),
    );
    assertEquals(
      arrayToEndian(new Int32Array([-2, 2]), "little"),
      new Uint8Array([254, 255, 255, 255, 2, 0, 0, 0]),
    );
  });
  it("uint64", () => {
    assertEquals(
      arrayToEndian(new BigUint64Array([1n, 2n]), "big"),
      decodeHex("00000000000000010000000000000002"),
    );
    assertEquals(
      arrayToEndian(new BigUint64Array([1n, 2n]), "little"),
      decodeHex("01000000000000000200000000000000"),
    );
  });
  it("int64", () => {
    assertEquals(
      arrayToEndian(new BigInt64Array([-2n, 2n]), "big"),
      decodeHex("FFFFFFFFFFFFFFFE0000000000000002"),
    );
    assertEquals(
      arrayToEndian(new BigInt64Array([-2n, 2n]), "little"),
      decodeHex("FEFFFFFFFFFFFFFF0200000000000000"),
    );
  });
  it("float32", () => {
    assertEquals(
      arrayToEndian(new Float32Array([-2, 2]), "big"),
      new Uint8Array([192, 0, 0, 0, 64, 0, 0, 0]),
    );
    assertEquals(
      arrayToEndian(new Float32Array([-2, 2]), "little"),
      new Uint8Array([0, 0, 0, 192, 0, 0, 0, 64]),
    );
  });
  it("float64", () => {
    assertEquals(
      arrayToEndian(new Float64Array([-2, 2]), "big"),
      decodeHex("C0000000000000004000000000000000"),
    );
    assertEquals(
      arrayToEndian(new Float64Array([-2, 2]), "little"),
      decodeHex("00000000000000C00000000000000040"),
    );
  });
});

describe("array from", () => {
  it("Identity over uint8", () => {
    assertEquals(
      arrayFromEndian(decodeHex("010203"), "big", "uint8"),
      decodeHex("010203"),
    );
    assertEquals(
      arrayFromEndian(decodeHex("010203"), "little", "uint8"),
      decodeHex("010203"),
    );
  });
  it("int8", () => {
    assertEquals(
      arrayFromEndian(decodeHex("FF0203"), "big", "int8"),
      new Int8Array([-1, 2, 3]),
    );
    assertEquals(
      arrayFromEndian(decodeHex("FF0203"), "little", "int8"),
      new Int8Array([-1, 2, 3]),
    );
  });
  it("uint16", () => {
    assertEquals(
      arrayFromEndian(decodeHex("00010002"), "big", "uint16"),
      new Uint16Array([1, 2]),
    );
    assertEquals(
      arrayFromEndian(decodeHex("01000200"), "little", "uint16"),
      new Uint16Array([1, 2]),
    );
    assertThrows(() => {
      arrayFromEndian(decodeHex("01"), "little", "uint16");
    });
  });
  it("int16", () => {
    assertEquals(
      arrayFromEndian(decodeHex("FFFE0002"), "big", "int16"),
      new Int16Array([-2, 2]),
    );
    assertEquals(
      arrayFromEndian(decodeHex("FEFF0200"), "little", "int16"),
      new Int16Array([-2, 2]),
    );
    assertThrows(() => {
      arrayFromEndian(decodeHex("01"), "little", "int16");
    });
  });
  it("uint32", () => {
    assertEquals(
      arrayFromEndian(decodeHex("0000000100000002"), "big", "uint32"),
      new Uint32Array([1, 2]),
    );
    assertEquals(
      arrayFromEndian(decodeHex("0100000002000000"), "little", "uint32"),
      new Uint32Array([1, 2]),
    );
    assertThrows(() => {
      arrayFromEndian(decodeHex("01"), "little", "uint32");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("0102"), "little", "uint32");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("010203"), "little", "uint32");
    });
  });
  it("int32", () => {
    assertEquals(
      arrayFromEndian(decodeHex("FFFFFFFE00000002"), "big", "int32"),
      new Int32Array([-2, 2]),
    );
    assertEquals(
      arrayFromEndian(decodeHex("FEFFFFFF02000000"), "little", "int32"),
      new Int32Array([-2, 2]),
    );
    assertThrows(() => {
      arrayFromEndian(decodeHex("01"), "little", "int32");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("0102"), "little", "int32");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("010203"), "little", "int32");
    });
  });
  it("uint64", () => {
    assertEquals(
      arrayFromEndian(
        decodeHex("00000000000000010000000000000002"),
        "big",
        "uint64",
      ),
      new BigUint64Array([1n, 2n]),
    );
    assertEquals(
      arrayFromEndian(
        decodeHex("01000000000000000200000000000000"),
        "little",
        "uint64",
      ),
      new BigUint64Array([1n, 2n]),
    );
    assertThrows(() => {
      arrayFromEndian(decodeHex("01"), "little", "uint64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("0102"), "little", "uint64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("010203"), "little", "uint64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("01020304"), "little", "uint64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("0102030405"), "little", "uint64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("010203040506"), "little", "uint64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("01020304050607"), "little", "uint64");
    });
  });
  it("int64", () => {
    assertEquals(
      arrayFromEndian(
        decodeHex("FFFFFFFFFFFFFFFE0000000000000002"),
        "big",
        "int64",
      ),
      new BigInt64Array([-2n, 2n]),
    );
    assertEquals(
      arrayFromEndian(
        decodeHex("FEFFFFFFFFFFFFFF0200000000000000"),
        "little",
        "int64",
      ),
      new BigInt64Array([-2n, 2n]),
    );
    assertThrows(() => {
      arrayFromEndian(decodeHex("01"), "little", "int64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("0102"), "little", "int64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("010203"), "little", "int64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("01020304"), "little", "int64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("0102030405"), "little", "int64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("010203040506"), "little", "int64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("01020304050607"), "little", "int64");
    });
  });
  it("float32", () => {
    assertEquals(
      arrayFromEndian(decodeHex("C000000040000000"), "big", "float32"),
      new Float32Array([-2, 2]),
    );
    assertEquals(
      arrayFromEndian(decodeHex("000000C000000040"), "little", "float32"),
      new Float32Array([-2, 2]),
    );
    assertThrows(() => {
      arrayFromEndian(decodeHex("01"), "little", "float32");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("0102"), "little", "float32");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("010203"), "little", "float32");
    });
  });
  it("float64", () => {
    assertEquals(
      arrayFromEndian(
        decodeHex("C0000000000000004000000000000000"),
        "big",
        "float64",
      ),
      new Float64Array([-2, 2]),
    );
    assertEquals(
      arrayFromEndian(
        decodeHex("00000000000000C00000000000000040"),
        "little",
        "float64",
      ),
      new Float64Array([-2, 2]),
    );
    assertThrows(() => {
      arrayFromEndian(decodeHex("01"), "little", "float64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("0102"), "little", "float64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("010203"), "little", "float64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("01020304"), "little", "float64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("0102030405"), "little", "float64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("010203040506"), "little", "float64");
    });
    assertThrows(() => {
      arrayFromEndian(decodeHex("01020304050607"), "little", "float64");
    });
  });
});
