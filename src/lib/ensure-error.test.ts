import { expect, suite, test } from "vitest";
import { ensureError, non_error_type_info } from "./ensure-error.js";
import { GenericError } from "../errors/_000-generic-error.js";
import { UnresolvableError } from "../errors/_600-unresolvable-error.js";
import type { Jsonable } from "../types/jsonable.js";

suite("ensureError", () => {
  test("(new Error) -> err: GenericError", () => {
    const message = "test";
    const [err, name] = ensureError(new Error(message));

    expect(err.message).toBe(message);
    expect(name).toBe(GenericError.name);
  });
  test("(new GenericError) -> err: GenericError", () => {
    const message = "test";
    const [err, name] = ensureError(new GenericError(message));

    expect(err.message).toBe(message);
    expect(name).toBe(GenericError.name);
  });
  test("(new UnresolvableError(...)) -> err: UnresolvableError", () => {
    const message = "should_panic!";
    const hint = new GenericError("hint");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "@/src/dir/file.ts",
      lineNumber: 42,
      x: 5050,
    };
    const [err, name] = ensureError(
      new UnresolvableError(message, {
        cause: hint,
        context,
      }),
    );

    expect(err.message).toBe(message);
    expect(name).toBe(UnresolvableError.name);
    if (err.cause instanceof GenericError) {
      expect(err.cause.cause).toBe(hint);
    }
    if (err instanceof UnresolvableError) {
      expect(err.context).toEqual({ x: 5050 });
      if (err.cause instanceof GenericError) {
        expect(err.cause.context).toEqual({
          owners: ["Xs-and-10s"],
          fileName: "@/src/dir/file.ts",
          lineNumber: 42,
        });
      }
    }
  });
  test("(UnresolvableError::create(...)) -> err: UnresolvableError", () => {
    const message = "panic!";
    const hint = new GenericError("reason");
    const context = {
      owners: ["Xs-and-10s"],
      fileName: "@/src/dir/file.ts",
      lineNumber: 42,
      x: 5050,
    };
    const [err, name] = ensureError(
      UnresolvableError.create(message, context, hint),
    );

    expect(err.message).toBe(message);
    expect(name).toBe(UnresolvableError.name);
    if (
      err.cause instanceof GenericError &&
      err.cause.cause instanceof GenericError &&
      err.cause.cause.cause instanceof GenericError
    ) {
      expect(err.cause.message).toBe(
        "Unresolvable Error thrown! This should not happen, contact the owning dev(s)...",
      );
      expect(err.cause.cause.message).toBe("...rest");
      expect(err.cause.cause.cause.message).toBe(hint.message);
    }
    if (err instanceof UnresolvableError) {
      expect(err.context).toEqual({ x: 5050 });
      if (err.cause instanceof GenericError) {
        expect(err.cause.context).toEqual({
          owners: ["Xs-and-10s"],
          fileName: "@/src/dir/file.ts",
          lineNumber: 42,
        });
      }
    }
  });
  test("('raw':string) -> err: GenericError", () => {
    const message: string = "raw";
    const [err, name] = ensureError(message);

    expect(err.message).toBe(message);
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "string",
        value: "raw",
      });
    }
    expect(name).toBe(GenericError.name);
  });
  test('("":string) -> err: GenericError', () => {
    const message: string = "";
    const [err, name] = ensureError(message);

    expect(err.message).toBeTypeOf("string");
    expect(err.message).not.toBeTruthy();
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "string",
        value: "",
      });
    }
    expect(name).toBe(GenericError.name);
  });
  test("(42:number::int) -> err: GenericError", () => {
    const input: number = 42;
    const [err, name] = ensureError(input);

    expect(err.message).toBe(`${input}`);
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "numeric::int",
        value: input,
      });
    }
    expect(name).toBe(GenericError.name);
  });
  test("(0:number::int) -> err: GenericError", () => {
    const input: number = 0;
    const [err, name] = ensureError(input);

    expect(err.message).toBe(`${input}`);
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "numeric::int",
        value: input,
      });
    }
    expect(name).toBe(GenericError.name);
  });
  test("(3.1:number::float) -> err: GenericError", () => {
    const input: number = 3.1;
    const [err, name] = ensureError(input);

    expect(err.message).toBe(`${input}`);
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "numeric::float",
        value: input,
      });
    }
    expect(name).toBe(GenericError.name);
  });
  test("(3.0:number::float) -> err: GenericError", () => {
    const input: number = 3.1;
    const [err, name] = ensureError(input);

    expect(err.message).toBe(`${input}`);
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "numeric::float",
        value: input,
      });
    }
    expect(name).toBe(GenericError.name);
  });
  test("(null) -> err: GenericError", () => {
    const input = null;
    const [err, name] = ensureError(input);

    expect(err.message).toBe(`${input}`);
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "null",
        value: input,
      });
    }
    expect(name).toBe(GenericError.name);
  });
  test("(undefined) -> err: GenericError", () => {
    const input = undefined;
    const [err, name] = ensureError(input);

    expect(err.message).toBe(`${input}`);
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "undefined",
        value: input,
      });
    }
    expect(name).toBe(GenericError.name);
  });
  test("({}) -> err: GenericError", () => {
    const input: Jsonable = {};
    const [err, name] = ensureError(input);

    expect(err.message).toBe("{}");
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "Jsonable",
        value: input,
      });
    }
    expect(name).toBe(GenericError.name);
  });
  test("({ x: 5050 }) -> err: GenericError", () => {
    const input: Jsonable = { x: 5050 };
    const [err, name] = ensureError(input);

    expect(err.message).toBe('{"x":5050}');
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "Jsonable",
        value: input,
      });
    }
    expect(name).toBe(GenericError.name);
  });
  test("([]) -> err: GenericError", () => {
    const input: Jsonable = [];
    const [err, name] = ensureError(input);

    expect(err.message).toBe("[]");
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "Jsonable",
        value: input,
      });
    }
    expect(name).toBe(GenericError.name);
  });
  test("([{ x: 5050 }]) -> err: GenericError", () => {
    const input: Jsonable = [{ x: 5050 }];
    const [err, name] = ensureError(input);

    expect(err.message).toBe('[{"x":5050}]');
    if (err.context) {
      expect(err.context).toEqual({
        info: non_error_type_info,
        type: "Jsonable",
        value: input,
      });
    }
    expect(name).toBe(GenericError.name);
  });
});
