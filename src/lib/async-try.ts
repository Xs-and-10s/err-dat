import type { GenericError } from "../errors/_000-generic-error.js";
import { UnresolvableError } from "../errors/_600-unresolvable-error.js";
import type { Jsonable } from "../types/jsonable.js";
import type { Result } from "../types/result.js";
import { ensureError } from "./ensure-error.js";

export function asyncTry<
  As extends any[],
  B extends any,
  E extends GenericError,
>(
  asyncFnToTry: (...args: As) => Promise<B>,
  errorsToCatch?:
    | (new (
        message: string,
        options: {
          cause?: any;
          context?: { readonly [key: string]: Jsonable };
        },
      ) => E)[]
    | null,
  onResolved?: (value: B) => void,
) {
  if (errorsToCatch == null) {
    errorsToCatch = [];
  }

  return async <E extends GenericError | UnresolvableError<any>>(
    ...args: As
  ) => {
    let dat: Awaited<B> | undefined;
    let result: Result<B, E>;
    try {
      dat = await asyncFnToTry(...args);
      result = [undefined, dat] as const;
      return result;
    } catch (error) {
      const [err, errName] = ensureError(error);
      if (err instanceof UnresolvableError) {
        return [err, undefined] as const;
      }
      if (errorsToCatch?.some((E) => errName === E.name)) {
        const E = errorsToCatch.find((E) => err instanceof E);
        if (E) {
          const e = new E(err.message, { cause: error });
          return [err, undefined] as const;
        }
      }
      return [err, undefined] as const;
    } finally {
      if (onResolved && dat) {
        onResolved(dat);
      }
    }
  };
}
