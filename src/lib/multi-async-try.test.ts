import { expect, suite, test } from "vitest";
import { multiAsyncTry } from "./multi-async-try.js";
import { UnresolvableError } from "../errors/_600-unresolvable-error.js";
import { GenericError } from "../errors/_000-generic-error.js";

suite("multiAsyncTry", () => {
  test("1) No args -> exception", async () => {
    const [except, tryGetNothing] = multiAsyncTry<[number], [never]>();
    expect(except).toBeTruthy();
    expect(tryGetNothing).toBeTypeOf("function");

    const { exception, failed } = tryGetNothing([42]);
    expect(exception).toEqual(
      UnresolvableError.create("asyncFns must be an array of functions", {
        functionName: "tryGetNothing",
        values: [42],
      }),
    );
    expect(failed).toBe(true);
  });
  test("2) Empty Array as args -> exception", async () => {
    const [except, tryGetNothing] = multiAsyncTry([]);
    expect(except).toBeTruthy();
    expect(tryGetNothing).toBeDefined();

    const { exception, failed } = tryGetNothing([]);
    expect(exception).toEqual(
      UnresolvableError.create("asyncFns must NOT be an empty array", {
        functionName: "tryGetNothing",
        value: [],
      }),
    );
    expect(failed).toBe(true);
  });
  test("3) Promise.resolve works as expected", async () => {
    const odds = 5050;
    const resolve = async (o: number) => Promise.resolve(o);

    const [except, tryGetOdds] = multiAsyncTry<[number], [number]>([resolve]);
    expect(except).toBeUndefined();
    expect(tryGetOdds).toBeTruthy();

    const { exception, failed, firstSettled, allSettled } = tryGetOdds([odds]);
    expect(exception).toBeUndefined();
    expect(failed).toBe(false);

    const [err1, dat1] = await firstSettled;
    expect(err1).toBeUndefined();
    expect(dat1).toBe(5050);

    const [[e1, d1]] = await allSettled;
    expect(e1).toBeUndefined();
    expect(d1).toBe(5050);

    expect(err1).toBe(e1);
    expect(dat1).toBe(d1);
  });
  test("4) Promise.reject works as expected", async () => {
    const msg = "message";
    const reject = async (msg: string) => {
      return Promise.reject(msg);
    };

    const [except, tryGetMessage] = multiAsyncTry<[string], [never]>([reject]);
    expect(except).toBeUndefined();
    expect(tryGetMessage).toBeTruthy();

    const { exception, failed, firstSettled, allSettled } = await tryGetMessage(
      [msg],
    );
    expect(exception).toBeUndefined();
    expect(failed).toBe(false);

    const [err1, dat1] = await firstSettled;
    expect(err1.message).toBe(msg);
    expect(dat1).toBeUndefined();

    const [[e1, d1]] = await allSettled;
    expect(e1.message).toBe(msg);
    expect(d1).toBeUndefined();

    expect(err1).toBe(e1);
    expect(dat1).toBe(d1);
  });
  test("5) Coin Flip test is 5050", async () => {
    const getOddsOfCoinFlip = async (ms: number) => {
      await msToWait(ms);
      return 5050;
    };

    const [exceptionAtCoinFlip, tryGetOddsOfCoinFlip] = multiAsyncTry<
      [number],
      [number]
    >([getOddsOfCoinFlip]);

    expect(exceptionAtCoinFlip).toBeUndefined();
    expect(tryGetOddsOfCoinFlip).toBeTruthy();

    const { exception, failed, firstSettled, allSettled } =
      tryGetOddsOfCoinFlip([1]);

    expect(exception).toBeUndefined();
    expect(failed).toBe(false);

    const [err1, dat1] = await firstSettled;
    expect(err1).toBeUndefined();
    expect(dat1).toBe(5050);

    const [[e1, d1]] = await allSettled;
    expect(e1).toBeUndefined();
    expect(d1).toBe(5050);

    expect(err1).toBe(e1);
    expect(dat1).toBe(d1);
  });
  test("6) 2 funcs: one good, one bad (slower)", async () => {
    const goodMsg = "good";
    const badMsg = "bad";
    const goodFn = async (msg: string) => {
      await msToWait(0);
      return msg;
    };
    const badFn = async (msg: string) => {
      await msToWait(16);
      throw new GenericError(msg);
    };

    const [except, tryGetGoodBadMsgs] = multiAsyncTry<
      [string, string],
      [string, never]
    >([goodFn, badFn]);
    expect(except).toBeUndefined();
    expect(tryGetGoodBadMsgs).toBeTruthy();

    const { exception, failed, firstSettled, allSettled } = tryGetGoodBadMsgs([
      goodMsg,
      badMsg,
    ]);
    expect(exception).toBeUndefined();
    expect(failed).toBe(false);

    const [err1, dat1] = await firstSettled;
    expect(err1).toBeUndefined();
    expect(dat1).toBe(goodMsg);

    const [[eGood, dGood], [eBad, dBad]] = await allSettled;
    expect(eGood).toBeUndefined();
    expect(dGood).toBe(goodMsg);
    expect(eBad.message).toBe(badMsg);
    expect(dBad).toBeUndefined();

    expect(err1).toBe(eGood);
    expect(dat1).toBe(dGood);
  });
  test("7) 2 funcs: one good, one bad (faster)", async () => {
    const goodMsg = "good";
    const badMsg = "bad";
    const goodFn = async (msg: string) => {
      await msToWait(16);
      return msg;
    };
    const badFn = async (msg: string) => {
      await msToWait(0);
      throw new GenericError(msg);
    };

    const [except, tryGetGoodBadMsgs] = multiAsyncTry<
      [string, string],
      [string, never]
    >([goodFn, badFn]);
    expect(except).toBeUndefined();
    expect(tryGetGoodBadMsgs).toBeTruthy();

    const { exception, failed, firstSettled, allSettled } = tryGetGoodBadMsgs([
      goodMsg,
      badMsg,
    ]);
    expect(exception).toBeUndefined();
    expect(failed).toBe(false);

    const [err1, dat1] = await firstSettled;
    expect(err1.message).toBe(badMsg);
    expect(dat1).toBeUndefined();

    const [[eGood, dGood], [eBad, dBad]] = await allSettled;
    expect(eGood).toBeUndefined();
    expect(dGood).toBe(goodMsg);
    expect(eBad.message).toBe(badMsg);
    expect(dBad).toBeUndefined();

    expect(err1).toBe(eBad);
    expect(dat1).toBe(dBad);
  });
});

function msToWait(duration: number = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}
