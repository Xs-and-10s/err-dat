import { expect, suite, test } from "vitest";
import { asyncTry } from "./async-try.js";
import type { Jsonable } from "../types/index.js";
import { GenericError } from "../errors/_000-generic-error.js";
import { UnresolvableError } from "../errors/_600-unresolvable-error.js";
import type { N } from "vitest/dist/chunks/environment.LoooBwUu.js";

suite("asyncTry", () => {
  test("1) (asyncThunk) -> async () -> [_, 'PASS']", async () => {
    const expected = "PASS";
    const asyncThunk = () => Promise.resolve(expected);

    const tryIt = asyncTry(asyncThunk);
    const [err, dat] = await tryIt();

    expect(err).toBeUndefined();
    expect(dat).toBe(expected);
  });
  test("2) (inc) -> async (1) -> [_, 2]", async () => {
    const n = 1;
    const inc = (n: number) => Promise.resolve(n + 1);

    const tryItWith = asyncTry(inc);
    const [err, dat] = await tryItWith(n);

    expect(err).toBeUndefined();
    expect(dat).toBe(2);
  });
  test("3) (add) -> async (1,1) -> [_, 2]", async () => {
    const expected = 1 + 1;
    const add = (a: number, b: number) => Promise.resolve(a + b);

    const tryItWith = asyncTry(add);
    const [err, dat] = await tryItWith(1, 1);

    expect(err).toBeUndefined();
    expect(dat).toBe(expected);
  });
  test("4) (JSON.stringify) -> async (null) -> 'null'", async () => {
    const that = null;
    const stringify = (x: Jsonable) => Promise.resolve(JSON.stringify(x));
    const tryItWith = asyncTry(stringify);

    const [err, dat] = await tryItWith(that);

    expect(err).toBeUndefined();
    expect(dat).toBe("null");
  });
  test("5) (JSON.stringify) -> async ({x:5050}) -> [_, {'x':5050}]", async () => {
    const that = { x: 5050 };
    const stringify = (x: Jsonable) => Promise.resolve(JSON.stringify(x));
    const tryItWith = asyncTry(stringify);

    const [err, dat] = await tryItWith(that);

    expect(err).toBeUndefined();
    expect(dat).toBe('{"x":5050}');
  });
  test("6) (JSON.stringify) -> async (undefined) -> [_, undefined]", async () => {
    const that = undefined;
    const stringify = (x: Jsonable) => Promise.resolve(JSON.stringify(x));
    const tryItWith = asyncTry(stringify);

    const [err, dat] = await tryItWith(that);

    expect(err).toBeUndefined();
    expect(dat).toBeUndefined();
  });
  test("7) (JSON.stringify) -> async ({a:undefined, b:2}) -> [_, {'b':2}]", async () => {
    const that = { a: undefined, b: 2 };
    const stringify = (x: Jsonable) => Promise.resolve(JSON.stringify(x));

    const tryItWith = asyncTry(stringify);

    const [err, dat] = await tryItWith(that);

    expect(err).toBeUndefined();
    expect(dat).toBe('{"b":2}');
  });
  test("8) (JSON.stringify) -> async ([null, undefined, {a: undefined}] -> [_, '[null,null,{}]'", async () => {
    const that = [null, undefined, { a: undefined }];
    const stringify = (x: Jsonable) => Promise.resolve(JSON.stringify(x));

    const tryItWith = asyncTry(stringify);
    const [err, dat] = await tryItWith(that);

    expect(err).toBeUndefined();
    expect(dat).toBe("[null,null,{}]");
  });
  test("9) (throws: GenericError) -> async () -> [err: GenericError, _]", async () => {
    const that = "test";
    const tryIt = asyncTry(() => Promise.reject(new GenericError(that)));

    const [err, dat] = await tryIt();

    expect(err).toBeInstanceOf(GenericError);
    expect(err?.message).toBe(that);
    expect(dat).toBeUndefined();
  });
  test("10) (throws: UnresolvableError) -> async () -> [err: UnresolvableError, _]", async () => {
    const that = "panic!";
    const tryIt = asyncTry(() =>
      Promise.reject(UnresolvableError.create(that, { a: 1 })),
    );

    const [err, dat] = await tryIt();

    expect(err).toBeInstanceOf(UnresolvableError);
    expect(err?.message).toBe(that);
    expect(err?.context).toEqual({ a: 1 });
    expect(dat).toBeUndefined();
  });
  test("11) (throws: GenericError, [GenericError]) -> async () -> [err: GenericError, _]", async () => {
    const that = "test";
    const tryIt = asyncTry(
      () => Promise.reject(new GenericError(that)),
      [GenericError],
    );

    const [err, dat] = await tryIt();

    expect(err).toBeInstanceOf(GenericError);
    expect(err?.message).toBe(that);
    expect(dat).toBeUndefined();
  });
  test("12) (inc, null, onResolved) -> async (n: 1) -> [_, 2]", async () => {
    let actual: number = 1;
    const expected = 2;
    const inc = (n: number) => Promise.resolve(n + 1);
    const onResolved = (y: number) => {
      actual = y;
    };
    const tryItWith = asyncTry(inc, null, onResolved);

    const [err, dat] = await tryItWith(1);

    expect(err).toBeUndefined();
    expect(dat).toBe(expected);
    expect(actual).toBe(expected);
  });
  test("13) (tail_recur, null, onResolved) -> async ([1,100], 0) -> [_, 5050]", async () => {
    let actual: number = 0;
    const expected = 5050;
    const range = [1, 100] as const;
    const sum = (
      [a, z]: readonly [a: number, z: number],
      y = 0,
    ): Promise<number> => {
      // Base case: when we've processed all pairs
      if (a > z) return Promise.resolve(y);

      // If we have a single number left, add it to accumulator
      if (a === z) return Promise.resolve(y + a);

      // Add current pair and continue with next pair
      return Promise.resolve(sum([a + 1, z - 1] as const, y + a + z));
    };
    const onResolved = (total: number) => {
      actual = total;
    };
    const tryItWith = asyncTry(sum, null, onResolved);

    const [err, dat] = await tryItWith(range, 0);

    expect(err).toBeUndefined();
    expect(dat).toBe(expected);
    expect(actual).not.toBe(0);
    expect(actual).toBe(expected);
  });
});
