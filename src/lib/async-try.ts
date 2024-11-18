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

  return async <E extends GenericError>(...args: As) => {
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
      if (errorsToCatch?.some((E) => E.name === errName)) {
        const E = errorsToCatch.find((E) => err instanceof E);
        if (E) {
          const e = new E(err.message, {
            cause: err,
            ...(err.context ? { context: err.context } : null),
          });
          return [err, undefined] as const;
        }
        return [
          UnresolvableError.create(
            "Error (Unresolvable): Errors to check listed, but none matched error produced",
            {
              errorsChecked: errorsToCatch.map((err) => err.name),
            },
          ),
          undefined,
        ] as const;
      }
      return [err, undefined] as const;
    } finally {
      if (onResolved && dat) {
        onResolved(dat);
      }
    }
  };
}
