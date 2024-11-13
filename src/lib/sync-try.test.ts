import { expect, suite, test } from "vitest";
import { syncTry } from "./sync-try.js";
import { UnresolvableError } from "../errors/index.js";
import { GenericError } from "../errors/index.js";
import type { Jsonable } from "../types/index.js";

suite("syncTry", () => {
  test("1) (thunk) -> () -> [_, 'PASS']", () => {
    const expected = "PASS";
    const thunk = () => expected;

    const tryIt = syncTry(thunk);
    const [err, dat] = tryIt();

    expect(err).toBeUndefined();
    expect(dat).toBe(expected);
  });
  test("2) (inc) -> (1) -> [_, 2]", () => {
    const n = 1;
    const inc = (n: number) => n + 1;

    const tryItWith = syncTry(inc);
    const [err, dat] = tryItWith(n);

    expect(err).toBeUndefined();
    expect(dat).toBe(2);
  });
  test("3) (add) -> (1,1) -> [_, 2]", () => {
    const expected = 1 + 1;
    const add = (a: number, b: number) => a + b;

    const tryItWith = syncTry(add);
    const [err, dat] = tryItWith(1, 1);

    expect(err).toBeUndefined();
    expect(dat).toBe(expected);
  });
  test("4) (JSON.stringify) -> (null) -> [_, 'null']", () => {
    const that = null;
    const stringify = (x: Jsonable) => JSON.stringify(x);
    const tryItWith = syncTry(stringify);

    const [err, dat] = tryItWith(that);

    expect(err).toBeUndefined();
    expect(dat).toBe("null");
  });
  test("5) (JSON.stringify) -> ({x:5050}) -> [_, {'x':5050}]", () => {
    const that = { x: 5050 };
    const stringify = (x: Jsonable) => JSON.stringify(x);
    const tryItWith = syncTry(stringify);

    const [err, dat] = tryItWith(that);

    expect(err).toBeUndefined();
    expect(dat).toBe('{"x":5050}');
  });
  test("6) (JSON.stringify) -> (undefined) -> [err: undefined, dat: undefined]", () => {
    const that = undefined;
    const stringify = (x: Jsonable) => JSON.stringify(x);
    const tryItWith = syncTry(stringify);

    const [err, dat] = tryItWith(that);

    expect(err).toBeUndefined();
    expect(dat).toBeUndefined();
  });
  test("7) (JSON.stringify) -> ({a:undefined, b:2}) -> [_, {'b':2}]", () => {
    const that = { a: undefined, b: 2 };
    const stringify = (x: Jsonable) => JSON.stringify(x);

    const tryItWith = syncTry(stringify);

    const [err, dat] = tryItWith(that);

    expect(err).toBeUndefined();
    expect(dat).toBe('{"b":2}');
  });
  test("8) (JSON.stringify) -> ([null, undefined, {a: undefined}] -> [_, '[null,null,{}]']", () => {
    const that = [null, undefined, { a: undefined }];
    const stringify = (x: Jsonable) => JSON.stringify(x);

    const tryItWith = syncTry(stringify);
    const [err, dat] = tryItWith(that);

    expect(err).toBeUndefined();
    expect(dat).toBe("[null,null,{}]");
  });
  test("9) (throws: GenericError) -> () -> [err: GenericError, _]", () => {
    const that = "test";
    const tryIt = syncTry(() => {
      throw new GenericError(that);
    });

    const [err, dat] = tryIt();

    expect(err).toBeInstanceOf(GenericError);
    expect(err?.message).toBe(that);
    expect(dat).toBeUndefined();
  });
  test("10) (throws: UnresolvableError) -> () -> [err: UnresolvableError, _]", () => {
    const that = "panic!";
    const tryIt = syncTry(() => {
      throw UnresolvableError.create(that, { a: 1 });
    });

    const [err, dat] = tryIt();

    expect(err).toBeInstanceOf(UnresolvableError);
    expect(err?.message).toBe(that);
    expect(err?.context).toEqual({ a: 1 });
    expect(dat).toBeUndefined();
  });
  test("11) (throws: GenericError, [GenericError]) -> () -> [err: GenericError, _]", () => {
    const that = "test";
    const tryIt = syncTry(() => {
      throw new GenericError(that);
    }, [GenericError]);

    const [err, dat] = tryIt();

    expect(err).toBeInstanceOf(GenericError);
    expect(err?.message).toBe(that);
    expect(dat).toBeUndefined();
  });
  test("12) (inc, null, onDone) -> (n: 1) -> [_, 2]", () => {
    let actual: number = 1;
    const expected = 2;
    const inc = (n: number) => n + 1;
    const onDone = (y: number) => {
      actual = y;
    };
    const tryItWith = syncTry(inc, null, onDone);

    const [err, dat] = tryItWith(1);

    expect(err).toBeUndefined();
    expect(dat).toBe(expected);
    expect(actual).toEqual(expected);
  });
  test("13) (tail_recur, null, onDone) -> ([1,100], 0) -> [_, 5050]", () => {
    let actual: number = 0;
    const expected = 5050;
    const range = [1, 100] as const;
    const sum = ([a, z]: readonly [a: number, z: number], y = 0) => {
      // Base case: when we've processed all pairs
      if (a > z) return y;

      // If we have a single number left, add it to accumulator
      if (a === z) return y + a;

      // Add current pair and continue with next pair
      return sum([a + 1, z - 1] as const, y + a + z);
    };
    const onDone = (total: number) => {
      actual = total;
    };
    const tryItWith = syncTry(sum, null, onDone);

    const [err, dat] = tryItWith(range, 0);

    expect(err).toBeUndefined();
    expect(dat).toBe(expected);
    expect(actual).not.toBe(0);
    expect(actual).toBe(expected);
  });
});
