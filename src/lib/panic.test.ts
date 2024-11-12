import { expect, suite, test } from "vitest";
import { panic } from "./panic.js";
import { GenericError } from "../errors/_000-generic-error.js";
import { UnresolvableError } from "../errors/_600-unresolvable-error.js";

suite("panic", () => {
  test("1) () -> throws error", () => {
    expect(() => panic()).toThrow("panic!");
    expect(() => panic()).toThrowError(UnresolvableError);
  });
  test("2) (error: UnresolvableError) -> throws UnresolvableError", () => {
    const error = UnresolvableError.create("panic!", {
      x: 5050,
    });
    const func = () => panic(error);

    expect(func).toThrow("panic!");
    expect(func).toThrowError(UnresolvableError);
  });
  test("3) (error: GenericError) -> throws UnresolvableError", () => {
    const error = new GenericError("test", {
      context: {
        x: 5050,
      },
    });
    const func = () => panic(error);

    expect(func).toThrow("panic!");
    expect(func).toThrowError(UnresolvableError);
  });
});
