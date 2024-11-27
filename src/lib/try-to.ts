import { TryError } from "../errors/try-error.js";
import type { ErrDatTuple } from "../types/err-dat-tuple.js";
import type { UnknownError } from "../types/unknown-error.js";
import { failure } from "../utils/failure.js";
import { isPromise } from "../utils/is-promise.js";
import { success } from "../utils/success.js";
import { tupleFromPromise } from "../utils/tuple-from-promise.js";

type FuncCallsThrowableThunk = {
  (fn: () => never): readonly [UnknownError, never];
  (fn: () => Promise<never>): Promise<readonly [UnknownError, never]>;
  <T>(fn: () => Promise<T>): Promise<ErrDatTuple<T>>;
  <T>(fn: () => T): ErrDatTuple<T>;
};

export const tryTo: {
  (fn: () => never): readonly [UnknownError, never];
  (fn: () => Promise<never>): Promise<readonly [UnknownError, never]>;
  <T>(fn: () => Promise<T>): Promise<ErrDatTuple<T>>;
  <T>(fn: () => T): ErrDatTuple<T>;
} = <T>(fn: () => T | Promise<T>): any => {
  // | readonly [UnknownError, never]
  // | Promise<readonly [UnknownError, never]>
  // | Promise<ErrDatTuple<T>>
  // | ErrDatTuple<T> => {
  if (typeof fn !== "function") return failure(new TryError.NotAFunction(fn));

  try {
    const result = fn();
    const returned = isPromise(result)
      ? tupleFromPromise(result)
      : success(result);
    return returned;
  } catch (error) {
    return failure(error);
  }
};
