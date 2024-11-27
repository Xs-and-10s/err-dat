import { expect, suite, test } from "vitest";
import { isPromise } from "./is-promise.js";

suite("isPromise(value: unknown): value is Promise", () => {
  let offset = 0;
  suite("value instanceof Promise === true", () => {
    [
      {
        n: "() => new Promise((r) => r(true))",
        v: () => new Promise((resolve) => resolve(true)),
      },
      { n: "() => Promise.resolve(true)", v: () => Promise.resolve(true) },
      // { n: "() => Promise.reject(true)", v: () => Promise.reject(true) },
      { n: "async () => true", v: async () => true },
      { n: "async () => await true", v: async () => await true },
    ].forEach(({ n, v }, i) => {
      test(`${i + 1}) ${n} ... true`, async () => {
        let promise;
        try {
          promise = v();
        } catch (e) {
          if (e != null) {
            promise = e;
          }
        }
        const positive = isPromise(promise);
        const awaited = await promise;
        const absurd = isPromise(awaited);

        expect(promise).toHaveProperty("then");
        expect(promise).toHaveProperty("catch");
        expect(promise).toHaveProperty("finally");
        expect(positive).toBe(true);
        expect(awaited).toBe(true);
        expect(absurd).not.toBe(true);
      });
      offset += 1;
    });
  });
  suite("value instanceof Promise === false", async () => {
    [
      { n: "null", v: null },
      { n: "undefined", v: undefined },
      { n: "true", v: true },
      { n: "false", v: false },
      { n: "1", v: 1 },
      { n: "0", v: 0 },
      { n: "100n (bigint)", v: 100n },
      { n: "'string'", v: "string" },
      { n: "[false]", v: [false] },
      { n: "{isPromise:false}", v: { isPromise: false } },
    ].forEach(({ n, v }, i) => {
      test(`${i + offset + 1}) ${n} ... false`, async () => {
        const positive = isPromise(v);
        const result = await v;

        expect(positive).toBe(false);
        if (v == null) {
          expect(result).toBe(v);
          return;
        }
        if (typeof v === "boolean") {
          expect(result).toBe(v);
          return;
        }
        if (typeof v === "string") {
          expect(result).toBe(v);
          return;
        }
        if (typeof v === "number") {
          expect(result).toBe(v);
          return;
        }
        if (typeof v === "bigint") {
          expect(result).toBe(v);
          return;
        }
        if (Array.isArray(v)) {
          expect(result).toEqual(v);
          return;
        } else {
          expect(result).toEqual(v);
          expect(v).not.toHaveProperty("then");
          expect(v).not.toHaveProperty("catch");
          expect(v).not.toHaveProperty("finally");
          return;
        }
      });
    });
  });
});
