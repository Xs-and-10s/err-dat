import type { GenericError } from "../errors/index.js";

export type Result<T, E extends Error = GenericError> =
  | readonly [error: undefined, value: T]
  | readonly [error: E, value: undefined];
