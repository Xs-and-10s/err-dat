import type { Success } from "../types/success.js";

export const success = <T>(value: T): Success<T> => [undefined, value] as const;
