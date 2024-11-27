import { expect, suite, test } from "vitest";
import { TryError } from "./try-error.js";

suite("TryError", () => {
  test("1) with code: Nullish Value Caught -> creates an instance with the correct error code & cause & message", () => {
    const error = new TryError(
      TryError.ErrCodeOptions.NULLISH_VALUE_CAUGHT,
      undefined,
    );

    expect(error.code).toBe(TryError.ErrCodeOptions.NULLISH_VALUE_CAUGHT);
    expect(error.cause).toBeUndefined();
    expect(error.message).toBe("A nullish value has been caught");
  });
  test("2) with code: Not A Function -> creates an instance with the correct error code & cause & message", () => {
    const error = new TryError(
      TryError.ErrCodeOptions.NOT_A_FUNCTION,
      "not a function",
    );

    expect(error.code).toBe(TryError.ErrCodeOptions.NOT_A_FUNCTION);
    expect(error.cause).toBe("not a function");
    expect(error.message).toBe("The 'fn' argument is not a function");
  });
  test("3) with code: Not An Array -> creates an instance with the correct error code & cause & message", () => {
    const error = new TryError(
      TryError.ErrCodeOptions.NOT_AN_ARRAY,
      "not an array",
    );

    expect(error.code).toBe(TryError.ErrCodeOptions.NOT_AN_ARRAY);
    expect(error.cause).toBe("not an array");
    expect(error.message).toBe("The 'listOfFns' argument is not an array");
  });
});
