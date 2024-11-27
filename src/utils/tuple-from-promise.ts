import type { ErrDatTuple } from "../types/err-dat-tuple.js";
import type { UnknownError } from "../types/unknown-error.js";
import { failure } from "./failure.js";
import { success } from "./success.js";

export const tupleFromPromise: {
  (promise: Promise<never>): Promise<readonly [UnknownError, never]>;
  <T>(promise: Promise<T>): Promise<ErrDatTuple<T>>;
} = <T>(promise: Promise<T>): any => promise.then(success, failure);
