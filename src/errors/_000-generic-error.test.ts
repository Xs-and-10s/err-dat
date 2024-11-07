import { expect, suite, test } from "vitest";
import { GenericError } from "./_000-generic-error.js";

suite("GenericError", () => {
  test("instanceof operator works with built-in Error (super-class)", () => {
    const ge = new GenericError("1");

    expect(ge instanceof Error).toBe(true);
  });
  test("instanceof operator works with GenericError", () => {
    const ge = new GenericError("2");

    expect(ge instanceof GenericError).toBe(true);
  });
  test("instance .name = class (static) .name", () => {
    const e = new Error("3");
    const ge = new GenericError("3");

    expect(ge.name).toBe(GenericError.name);
    expect(ge.name).not.toBe(Error.name);
    expect(e.name).toBe(Error.name);
  });
  test("instance .name = 'GenericError'", () => {
    const ge = new GenericError("4");

    expect(ge.name).toBe("GenericError");
  });
  test("class (static) .name = 'GenericError'", () => {
    expect(GenericError.name).toBe("GenericError");
  });
  test("instance .message works like built-in Error (super-class)", () => {
    const ge = new GenericError("6");

    expect(ge.message).toBe("6");
  });
  test("instance .cause works with built-in Error (super-class)", () => {
    const cause = new Error("7_inner");
    const geWithCause = new GenericError("7_outer", {
      cause: cause,
    });

    expect(geWithCause.cause).toBe(cause);
  });
  test("instance .cause.message = inner error's .message", () => {
    const cause = new Error("8_inner");
    const geWithCause = new GenericError("8_outer", {
      cause: cause,
    });

    expect((geWithCause.cause as { message: string }).message).toBe("8_inner");
  });
  test("instance .cause.name = inner error's .name", () => {
    const cause = new Error("9_inner");
    const geWithCause = new GenericError("9_outer", {
      cause: cause,
    });

    expect((geWithCause.cause as { name: string }).name).toBe(Error.name);
  });
  test("instance .context = context", () => {
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ge = new GenericError("10", {
      context,
    });

    expect(ge.context).toEqual({
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    });
  });
  test("instance .statusCode = '000'", () => {
    const ge = new GenericError("11");

    expect(ge.statusCode).toBe("000");
  });
  test("class (static) .statusCode = '000'", () => {
    const _11 = new GenericError("12");

    expect(GenericError.statusCode).toBe("000");
  });
  test("instance .statusCode = class (static) .statusCode", () => {
    const ge = new GenericError("13");

    expect(ge.statusCode).toBe(GenericError.statusCode);
  });
});
