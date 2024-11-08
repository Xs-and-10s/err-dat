import { expect, suite, test } from "vitest";
import { UnresolvableError } from "./_600-unresolvable-error.js";
import { GenericError } from "./_000-generic-error.js";

suite("UnresolvableError", () => {
  test("1) instanceof operator works with built-in Error (super-super-class)", () => {
    const cause = new GenericError("1_inner");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("1_outer", {
      cause,
      context,
    });

    expect(ue instanceof Error).toBe(true);
  });
  test("2) instanceof operator works with GenericError (super-class)", () => {
    const cause = new GenericError("2_inner");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("2_outer", {
      cause,
      context,
    });

    expect(ue instanceof GenericError).toBe(true);
  });
  test("3) instanceof operator works with UnresolvableError", () => {
    const cause = new GenericError("3_inner");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("3_outer", {
      cause,
      context,
    });

    expect(ue instanceof UnresolvableError).toBe(true);
  });
  test("4) instance .name = class (static) .name", () => {
    const cause = new GenericError("4_inner");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("4_outer", {
      cause,
      context,
    });

    expect(ue.name).toBe(UnresolvableError.name);
    expect(ue.name).not.toBe(GenericError.name);
    expect(ue.name).not.toBe(Error.name);
    expect(cause.name).toBe(GenericError.name);
  });
  test("5) instance .name = 'UnresolvableError'", () => {
    const cause = new GenericError("5_inner");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("5_outer", {
      cause,
      context,
    });

    expect(ue.name).toBe("UnresolvableError");
  });
  test("6) class (static) .name = 'UnresolvableError'", () => {
    expect(UnresolvableError.name).toBe("UnresolvableError");
  });
  test("7) instance .message works like built-in Error (super-super-class)", () => {
    const cause = new GenericError("7_inner: <insert hint(s)>");
    const context = {
      owners: ["Xs-and-10s"], // ! @special field: goes into .cause !
      fileName: "this-one", // ! @special field: goes into .cause !
      lineNumber: 42, // ! @special field: goes into .cause !
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("7_outer", {
      cause,
      context,
    });

    expect(ue.message).toBe("7_outer");
  });
  test("8) instance .cause .message is a hard-coded, read-only, special constant", () => {
    const cause = new GenericError("8_inner: <insert hint(s)>");
    const context = {
      owners: ["Xs-and-10s"], // ! @special field: goes into .cause !
      fileName: "this-one", // ! @special field: goes into .cause !
      lineNumber: 42, // ! @special field: goes into .cause !
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("8_outer", {
      cause,
      context,
    });

    expect((ue.cause as any).message).toBe(
      "Unresolvable Error thrown! This should not happen, contact the owning dev(s)...",
    );
  });
  test("9) instance .cause .cause .message is a place to put helpful hints", () => {
    const cause = new GenericError("9_inner: <insert hint(s)>");
    const context = {
      owners: ["Xs-and-10s"], // ! @special field: goes into .cause !
      fileName: "this-one", // ! @special field: goes into .cause !
      lineNumber: 42, // ! @special field: goes into .cause !
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("9_outer", {
      cause,
      context,
    });

    expect(((ue.cause as any).cause as any).message).toBe(
      "9_inner: <insert hint(s)>",
    );
  });
  test("10) instance .context gives all values EXCEPT special keys: 'owners' | 'fileName' | 'lineNumber'", () => {
    const cause = new GenericError("10_inner: <insert hint(s)>");
    const context = {
      owners: ["Xs-and-10s"], // ! @special field: goes into .cause !
      fileName: "this-one", // ! @special field: goes into .cause !
      lineNumber: 42, // ! @special field: goes into .cause !
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("10_outer", {
      cause,
      context,
    });

    expect(ue.context as any).toEqual({
      a: 1,
      b: 2,
      c: 3,
    });
  });
  test("11) instance .cause .context gives ONLY special keys: 'owners' | 'fileName' | 'lineNumber' !", () => {
    const cause = new GenericError("11_inner: <insert hint(s)>");
    const context = {
      owners: ["Xs-and-10s"], // ! @special field: goes into .cause !
      fileName: "this-one", // ! @special field: goes into .cause !
      lineNumber: 42, // ! @special field: goes into .cause !
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("11_outer", {
      cause,
      context,
    });

    expect((ue.cause as any).context).toEqual({
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
    });
  });
  test("12) instance .cause .cause .context keys depend on the error given as .cause for the sake of extra hints, if provided...", () => {
    const causeA = new GenericError("12a_inner: <insert hint(s)>");
    const causeB = new GenericError("12b_inner: <insert hint(s)>", {
      context: { x: 5050 },
    });
    const context = {
      owners: ["Xs-and-10s"], // ! @special field: goes into .cause !
      fileName: "this-one", // ! @special field: goes into .cause !
      lineNumber: 42, // ! @special field: goes into .cause !
      a: 1,
      b: 2,
      c: 3,
    };
    const ueA = new UnresolvableError("12a_outer", {
      cause: causeA,
      context,
    });
    const ueB = new UnresolvableError("12b_outer", {
      cause: causeB,
      context,
    });

    expect(((ueA.cause as any).cause as any).context).toBeUndefined();
    expect(((ueB.cause as any).cause as any).context).toEqual({
      x: 5050,
    });
  });
  test("13) instance .statusCode = '600'", () => {
    const cause = new GenericError("13_inner");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("13_outer", {
      cause,
      context,
    });

    expect(ue.statusCode).toBe("600");
  });
  test("14) class (static) .statusCode = '600'", () => {
    expect(UnresolvableError.statusCode).toBe("600");
  });
  test("15) instance .statusCode = class (static) .statusCode", () => {
    const cause = new GenericError("15_inner");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("15_outer", {
      cause,
      context,
    });

    expect(ue.statusCode).toBe(UnresolvableError.statusCode);
  });
});
suite("UnresolvableError.create", () => {
  test("16) @create .message = instance .message", () => {
    const cause = new GenericError("16_inner");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("16_outer", {
      cause,
      context,
    });
    const actual = UnresolvableError.create("16_outer", context, cause);

    expect(actual.message).toBe(ue.message);
  });
  test("17) @create(,,cause) .message = instance .cause .cause .message", () => {
    const cause = new GenericError("17_inner");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = new UnresolvableError("17_outer", {
      cause,
      context,
    });
    const actual = UnresolvableError.create("17_outer", context, cause);

    expect((actual.cause as any).cause.cause.message).toBe(
      (ue.cause as any).cause.message,
    );
    expect((actual.cause as any).cause.message).toBe("...rest");
    expect((actual.cause as any).cause.cause.message).toBe(cause.message);
  });
  test("18) @create .statusCode = Unresolvable .statusCode", () => {
    const cause = new GenericError("18_hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("18_outer", context, cause);

    expect(ue.statusCode).toBe(UnresolvableError.statusCode);
  });
  test("19) @create (message, _, _) = instance .message", () => {
    const cause = new GenericError("19_hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("19_outer", context, cause);

    expect(ue.message).toBe("19_outer");
  });
  test("20) @create .context = ...rest of context", () => {
    const cause = new GenericError("20_hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("20_outer", context, cause);

    expect(ue.context).toEqual({
      a: 1,
      b: 2,
      c: 3,
    });
  });
  test("21) @create .cause .message = special message warning to contact the relevant devs", () => {
    const cause = new GenericError("21_hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("21_outer", context, cause);

    expect((ue.cause as any).message).toBe(
      "Unresolvable Error thrown! This should not happen, contact the owning dev(s)...",
    );
  });
  test("22) @create .cause .context = { owners, fileName, lineNumber }", () => {
    const cause = new GenericError("22_hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("22_outer", context, cause);

    expect((ue.cause as any).context).toEqual({
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
    });
  });
  test("23) @create .cause .cause .message = '...rest'", () => {
    const cause = new GenericError("23_hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("23_outer", context, cause);

    expect((ue.cause as any).cause.message).toBe("...rest");
  });
  test("24) @create .cause .cause .context = ...rest of context", () => {
    const cause = new GenericError("24_hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("24_outer", context, cause);

    expect((ue.cause as any).cause.context).toEqual({
      a: 1,
      b: 2,
      c: 3,
    });
  });
  test("25) @create .cause .cause .cause .message = (cause) .message", () => {
    const cause = new GenericError("25_hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("25_outer", context, cause);

    expect((ue.cause as any).cause.cause.message).toBe(cause.message);
  });
  test("26) @create .cause .cause .cause .context depends on error passed in as an extra hint", () => {
    const causeA = new GenericError("26a_hint");
    const causeB = new GenericError("26b_hint", {
      context: {
        x: 5050,
      },
    });
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ueA = UnresolvableError.create("26a_outer", context, causeA);
    const ueB = UnresolvableError.create("26b_outer", context, causeB);

    expect((ueA.cause as any).cause.cause.context).toBeUndefined();
    expect((ueB.cause as any).cause.cause.context).toEqual(causeB.context);
  });
  test("27) @create instanceof Error", () => {
    const cause = new GenericError("hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("outer", context, cause);

    expect(ue instanceof Error).toBe(true);
  });
  test("28) @create instanceof GenericError", () => {
    const cause = new GenericError("hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("outer", context, cause);

    expect(ue instanceof GenericError).toBe(true);
  });
  test("29) @create instanceof UnresolvableError", () => {
    const cause = new GenericError("hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("outer", context, cause);

    expect(ue instanceof UnresolvableError).toBe(true);
  });
  test("30) @create .name = 'UnresolvableError'", () => {
    const cause = new GenericError("hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "this-one",
      lineNumber: 42,
      a: 1,
      b: 2,
      c: 3,
    };
    const ue = UnresolvableError.create("outer", context, cause);

    expect(ue.name).toBe(UnresolvableError.name);
    expect(ue.name).not.toBe(GenericError.name);
    expect(ue.name).not.toBe(Error.name);
  });
});
