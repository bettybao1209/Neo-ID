import { evalTransportError } from "../src/ErrorCode";
import { getDevicePaths, getPublicKey, getSignature } from "../src/main";
import { DerToHexSignature } from "../src/utils";
import Transport from "@ledgerhq/hw-transport";

jest.mock("../src/ErrorCode");
jest.mock("../src/utils");

describe("getDevicePaths", () => {
  test("throws error when not supported", async () => {
    const mockLedgerLib = ({
      isSupported: jest.fn().mockImplementation(async () => false),
    } as unknown) as typeof Transport;

    const result = getDevicePaths(mockLedgerLib);
    expect(result).rejects.toThrow("not support the ledger");
  });

  test("returns data from list method", async () => {
    const expected = [] as ReadonlyArray<string>;
    const mockLedgerLib = ({
      isSupported: jest.fn().mockImplementation(async () => true),
      list: jest.fn().mockImplementation(async () => expected),
    } as unknown) as typeof Transport;

    const result = await getDevicePaths(mockLedgerLib);

    expect(result).toBe(expected);
  });
});

describe("getPublicKey", () => {
  test("throws processed error if error", () => {
    const thrownError = new Error();
    const expectedError = new Error();
    const mockLedgerInstance = ({
      send: jest.fn().mockImplementation(() => {
        return Promise.reject(thrownError);
      }),
    } as unknown) as Transport;

    evalTransportError.mockImplementationOnce((e) => {
      if (e === thrownError) {
        return expectedError;
      }
    });

    const result = getPublicKey(mockLedgerInstance, "");
    expect(result).rejects.toThrowError(expectedError);
  });

  test("sends correctly constructed message", async () => {
    const expected = "1234";
    const expectedBuffer = Buffer.from(expected, "hex");
    const bip44Input = "abcd";
    const mockLedgerInstance = ({
      send: jest.fn().mockImplementation(async () => expectedBuffer),
    } as unknown) as Transport;

    const result = await getPublicKey(mockLedgerInstance, bip44Input);

    expect(result).toBe(expected);
  });
});

describe("getSignature", () => {
  test("throws processed error if error", () => {
    const thrownError = new Error();
    const expectedError = new Error();
    const mockLedgerInstance = ({
      send: jest.fn().mockImplementation(() => {
        return Promise.reject(thrownError);
      }),
    } as unknown) as Transport;

    evalTransportError.mockImplementationOnce((e) => {
      if (e === thrownError) {
        return expectedError;
      }
    });

    const result = getSignature(mockLedgerInstance, "cdcd", "abab");
    expect(result).rejects.toThrowError(expectedError);
  });

  test("throws error if ledger does not return signature after finalising", () => {
    const inputMsg = "1".repeat(512) + "2".repeat(512);
    const bip44Input = "abcd";
    const mockLedgerInstance = ({
      send: jest.fn().mockImplementation(async () => {
        return Buffer.from("9000", "hex");
      }),
    } as unknown) as Transport;

    const result = getSignature(mockLedgerInstance, inputMsg, bip44Input);
    expect(result).rejects.toThrowError("did not return signature");
  });

  test("returns signature successfully after sending message", async () => {
    const inputMsg = "1".repeat(512) + "2".repeat(512);
    const bip44Input = "abcd";
    const mockDer = "9999";
    const expectedSig = "9876";
    const mockLedgerInstance = ({
      send: jest
        .fn()
        .mockImplementation(async (_cla, _ins, p1, _p2, ..._args) => {
          if (p1 === 0x80) {
            return Buffer.from(mockDer, "hex");
          }
          return Buffer.from("9000", "hex");
        }),
    } as unknown) as Transport;
    DerToHexSignature.mockImplementationOnce(() => expectedSig);

    const result = await getSignature(mockLedgerInstance, inputMsg, bip44Input);

    expect(result).toBe(expectedSig);

    expect(DerToHexSignature).toBeCalledWith(mockDer);
    expect(mockLedgerInstance.send).toBeCalledTimes(3);
  });
});
