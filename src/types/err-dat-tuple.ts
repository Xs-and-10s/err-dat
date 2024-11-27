import type { Failure } from "./failure.js";
import type { Success } from "./success.js";

export type ErrDatTuple<T> = Failure | Success<T>;
