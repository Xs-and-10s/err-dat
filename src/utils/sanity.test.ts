import { TEST_RUNNER_IS_WORKING } from "./sanity.js";
import { test, expect } from "vitest";

test("vitest test runner is working", () => {
  expect(TEST_RUNNER_IS_WORKING).toBe(true);
});
