import { ab2hexstring } from "./convert";
import { HexString } from "./HexString";
import { OpCode } from "../sc/OpCode";
import { Buffer } from "buffer";

const hexRegex = /^([0-9A-Fa-f]{2})*$/;

/**
 * Checks if input is a hexstring. Empty string is considered a hexstring.
 */
export function isHex(str: string): boolean {
  try {
    return hexRegex.test(str);
  } catch (err) {
    return false;
  }
}

/**
 * Throws an error if input is not hexstring.
 */
export function ensureHex(str: string): void {
  if (!isHex(str)) {
    throw new Error(`Expected a hexstring but got ${str}`);
  }
}

/**
 * XORs two hexstrings
 *
 * @param str1 - HEX string
 * @param str2 - HEX string
 * @returns XOR output as a HEX string
 */
export function hexXor(str1: string, str2: string): string {
  ensureHex(str1);
  ensureHex(str2);
  if (str1.length !== str2.length) {
    throw new Error(
      `strings are disparate lengths. Inputs are of length ${str1.length} and ${str2.length}`
    );
  }
  const result = [];
  for (let i = 0; i < str1.length; i += 2) {
    result.push(
      // tslint:disable-next-line:no-bitwise
      parseInt(str1.substr(i, 2), 16) ^ parseInt(str2.substr(i, 2), 16)
    );
  }
  return ab2hexstring(result);
}

/**
 * Reverses an array.
 *
 * @example
 * reverseArray('abcd') = 'dcba'
 */
export function reverseArray<T>(arr: ArrayLike<T>): T[] {
  if (typeof arr !== "object" || !arr.length) {
    throw new Error("reverseArray expects an array");
  }
  const result = new Array<T>(arr.length);
  for (let i = 0; i < arr.length; i++) {
    result[i] = arr[arr.length - 1 - i];
  }
  return result;
}

/**
 * Reverses a HEX string, treating 2 chars as a byte.
 *
 * @example
 * reverseHex('abcdef') = 'efcdab'
 */
export function reverseHex(hex: string): string {
  ensureHex(hex);
  let out = "";
  for (let i = hex.length - 2; i >= 0; i -= 2) {
    out += hex.substr(i, 2);
  }
  return out;
}

interface NeonSerializable {
  size: number;
  serialize: () => string;
}
type Serializables = number | HexString | NeonSerializable[];
/**
 * Calculates the byte size of any supported input following NEO's variable int format.
 */
export function getSerializedSize(value: Serializables): number {
  switch (typeof value) {
    case "number": {
      if (value < 0xfd) return 1;
      else if (value <= 0xffff) return 3;
      else return 5;
    }
    case "object": {
      if (value instanceof HexString) {
        const size = value.byteLength;
        return getSerializedSize(size) + size;
      } else if (Array.isArray(value)) {
        let size = 0;
        if (value.length > 0) {
          if (
            typeof value[0].size === "number" &&
            typeof value[0].serialize === "function"
          ) {
            size = value
              .map((item) => item.size)
              .reduce((prev, curr) => prev + curr, 0);
          }
        }
        return getSerializedSize(value.length) + size;
      }
      // do not break here so we fall through to the default
    }
    default:
      throw new Error("Unsupported value type: " + typeof value);
  }
}

/**
 * Check if the format of input matches that of a single signature contract
 */
export function isSignatureContract(input: HexString): boolean {
  const PUBLIC_KEY_LENGTH = 33;
  const script = Buffer.from(input.toString(), "hex");
  return !(
    script.length != 40 ||
    script[0] != OpCode.PUSHDATA1 ||
    script[1] != PUBLIC_KEY_LENGTH ||
    script[35] != OpCode.SYSCALL ||
    script.readUInt32LE(36) != 2859889780
  );
}

/**
 * Check if the format of input matches that of a multi-signature contract
 */
export function isMultisigContract(input: HexString): boolean {
  const script = Buffer.from(input.toString(), "hex");
  if (script.length < 42) {
    return false;
  }

  let signatureCount, i;
  if (script[0] == OpCode.PUSHINT8) {
    signatureCount = script[1];
    i = 2;
  } else if (script[0] == OpCode.PUSHINT16) {
    signatureCount = script.readUInt16LE(1);
    i = 3;
  } else if (script[0] <= OpCode.PUSH1 || script[0] >= OpCode.PUSH16) {
    signatureCount = script[0] - OpCode.PUSH0;
    i = 1;
  } else {
    return false;
  }

  if (signatureCount < 1 || signatureCount > 1024) {
    return false;
  }

  let publicKeyCount = 0;
  while (script[i] == OpCode.PUSHDATA1) {
    if (script.length <= i + 35) {
      return false;
    }
    if (script[i + 1] != 33) {
      return false;
    }
    i += 35;
    publicKeyCount += 1;
  }

  if (publicKeyCount < signatureCount || publicKeyCount > 1024) {
    return false;
  }

  const value = script[i];
  if (value == OpCode.PUSHINT8) {
    if (script.length <= i + 1 || publicKeyCount != script[i + 1]) {
      return false;
    }
    i += 2;
  } else if (value == OpCode.PUSHINT16) {
    if (script.length < i + 3 || publicKeyCount != script.readUInt16LE(i + 1)) {
      return false;
    }
    i += 3;
  } else if (OpCode.PUSH1 <= value && value <= OpCode.PUSH16) {
    if (publicKeyCount != value - OpCode.PUSH0) {
      return false;
    }
    i += 1;
  } else {
    return false;
  }

  if (script.length != i + 5 || script[i + 1] != OpCode.SYSCALL) {
    return false;
  }

  i += 2;

  if (script.readUInt32LE(i) != 2775371387) {
    return false;
  }

  return true;
}
