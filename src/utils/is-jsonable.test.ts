import { expect, suite, test } from "vitest";
import { isJsonable } from "./is-jsonable.js";

const tests = [
  { name: "string", value: "string", expected: true },
  { name: `${123}`, value: 123, expected: true },
  { name: `${true}`, value: true, expected: true },
  { name: `${null}`, value: null, expected: true },
  { name: "undefined", value: undefined, expected: false },
  { name: "() => {}", value: () => {}, expected: false },
  { name: "Symbol()", value: Symbol(), expected: false },
  { name: "BigInt()", value: BigInt(123), expected: false },
  { name: "new Date()", value: new Date(), expected: false },
  { name: "/regex/", value: /regex/, expected: false },
  { name: "new Map()", value: new Map(), expected: false },
  { name: "new Set()", value: new Set(), expected: false },
  { name: "{}", value: {}, expected: true }, // Empty object test case
  {
    name: "multitype object",
    value: { a: 1, b: "2", c: true },
    expected: true,
  },
  {
    name: "multitype object w/ undefined key",
    value: { a: 1, b: undefined },
    expected: false,
  },
  {
    name: "multitype object w/ function property",
    value: { a: 1, b: () => {} },
    expected: false,
  },
  { name: "multitype array", value: [1, "2", true], expected: true },
  {
    name: "multitype array w/ undefined",
    value: [1, undefined],
    expected: false,
  },
  {
    name: "nested obj/array/obj",
    value: { nested: { array: [1, 2, { valid: true }] } },
    expected: true,
  },
  {
    name: "object w/ empty object",
    value: { circular: {} },
    expected: true,
  }, // Note: This won't catch circular references
];

suite("isJsonable", () => {
  tests.forEach(({ name, value, expected }, i) => {
    const testIdx = i + 1;
    test(`${testIdx}) ${name}: ${expected}`, () => {
      const result = isJsonable(value);

      expect(result).toBe(expected);
    });
  });
});
