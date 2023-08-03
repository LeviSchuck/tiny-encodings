export const ENDIAN_TEST = new Uint8Array(2);
const MULTI_BYTE_VIEW = new Uint16Array(ENDIAN_TEST.buffer);
MULTI_BYTE_VIEW[0] = 1;
export function testOnlySetBigEndian() {
  ENDIAN_TEST[0] = 0;
  ENDIAN_TEST[1] = 1;
}
export function testOnlySetLittleEndian() {
  ENDIAN_TEST[0] = 1;
  ENDIAN_TEST[1] = 0;
}
