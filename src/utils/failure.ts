import { TryError } from "../errors/try-error.js";
import type { Failure } from "../types/failure.js";

export const failure = (err: unknown): Failure =>
  [err ?? new TryError.NullishValueCaught(err), undefined] as const;
