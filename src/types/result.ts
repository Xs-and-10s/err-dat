import type { GenericError } from "../errors/_000-generic-error.js";

export type Result<T, E extends GenericError = GenericError> =
  | [undefined, value: T]
  | [error: E, undefined];
