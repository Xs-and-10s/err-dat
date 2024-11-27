import { expect, suite, test } from "vitest";
import { tupleFromPromise } from "./tuple-from-promise.js";

suite("tupleFromPromise(promise): ErrDatTuple<T>", () => {
  let offset = 0;
  suite("dats...", () => {
    [
      {
        n: "() => new Promise((r) => r(true))",
        v: () => new Promise((resolve) => resolve(true)),
      },
      { n: "() => Promise.resolve(true)", v: () => Promise.resolve(true) },
      { n: "async () => true", v: async () => true },
    ].forEach(async ({ n, v }, i) => {
      const promise = v();
      const value = await promise;

      test(`${i + 1}) ${n} ... ${value}`, async () => {
        const result = tupleFromPromise(promise);

        const [err, dat] = await result;

        expect(promise).toHaveProperty("then");
        expect(promise).toHaveProperty("catch");
        expect(promise).toHaveProperty("finally");
        expect(err).toBeUndefined();
        expect(dat).toBe(value);
      });
      offset++;
    });
    test(`${4}) Promise.reject`, async () => {
      const throws = () => Promise.reject("boom.").catch((e) => e);
      const result = tupleFromPromise(throws());

      const [err, dat] = await result;

      expect(err).toBeUndefined();
      expect(dat).toBe("boom.");
    });
    offset++;
  });
  suite("errs...", () => {
    test(`${1 + offset}) async thunk throws Error`, async () => {
      const msg = "boom.";
      const throws = async () => {
        throw new Error(msg);
      };

      const promise = throws();
      const [err, dat] = await tupleFromPromise(promise);

      expect.assertions(5);
      expect(promise).toHaveProperty("then");
      expect(promise).toHaveProperty("catch");
      expect(promise).toHaveProperty("finally");
      if (err != null && err instanceof Error) {
        expect(err.message).toBe(msg);
      }
      expect(dat).toBeUndefined();
    });
  });
});
