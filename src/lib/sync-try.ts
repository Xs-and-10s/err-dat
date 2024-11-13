import { GenericError } from "../errors/index.js";
import { UnresolvableError } from "../errors/index.js";
import type { Jsonable, Result } from "../types/index.js";
import { ensureError } from "./ensure-error.js";

export function syncTry<
  As extends any[],
  B extends any,
  E extends GenericError,
>(
  fnToTry: (...args: As) => B,
  errorsToCatch?:
    | (new (
        message: string,
        options: {
          cause?: any;
          context?: { readonly [key: string]: Jsonable };
        },
      ) => E)[]
    | null,
  onDone?: (doneValue: B) => void,
) {
  if (errorsToCatch == null) {
    errorsToCatch = [];
  }

  return <E extends GenericError>(...args: As) => {
    let dat: B | undefined;
    let result: Result<B, E>;
    try {
      dat = fnToTry(...args);
      result = [undefined, dat] as const;
      return result;
    } catch (error) {
      const [err, errName] = ensureError(error);
      if (err instanceof UnresolvableError) {
        return [err, undefined] as const;
      }
      if (errorsToCatch.some((E) => errName === E.name)) {
        const E = errorsToCatch.find((E) => err instanceof E);
        if (E) {
          const e = new E(err.message, { cause: error });
          return [e, undefined] as const;
        }
      }
      return [err, undefined] as const;
    } finally {
      if (onDone && dat) {
        onDone(dat);
      }
    }
  };
}
