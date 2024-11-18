import { GenericError, UnresolvableError } from "../errors/index.js";
import type { Jsonable, Result } from "../types/index.js";
import { isBuiltInError } from "../utils/is-buit-in-error.js";
import { isJsonable } from "../utils/is-jsonable.js";
import { ensureError } from "./ensure-error.js";

type AsyncFunction<Args, B extends any> = (
  ...args: Args extends any[] ? Args : [Args]
) => Promise<B>;
type GenErrConstructor<E> = new (
  message: string,
  options: {
    cause?: any;
    context?: { readonly [key: string]: Jsonable };
  },
) => E;
type ErrorTypeMap<T, BaseError extends GenericError> =
  | [GenErrConstructor<BaseError>]
  | [GenErrConstructor<BaseError>, ...GenErrConstructor<BaseError>[]];

type MultiSettled<T extends any, E extends GenericError> =
  | {
      exception: UnresolvableError<any>;
      failed: true;
    }
  | {
      failed: false;
      firstSettled: Promise<Result<T, E>>;
      allSettled: Promise<Result<T, E>[]>;
    };

export function multiAsyncTry<
  ArgTypes extends any[],
  RetTypes extends any[],
>(asyncFns: {
  [ArgKey in keyof ArgTypes]: AsyncFunction<
    ArgTypes[ArgKey],
    RetTypes[ArgKey extends keyof RetTypes ? ArgKey : never]
  >;
}) {
  let setupException: UnresolvableError<any> | undefined = undefined;

  if (!asyncFns || !Array.isArray(asyncFns)) {
    const exception = UnresolvableError.create(
      "asyncFns must be an array of functions",
      {
        value: asyncFns,
      },
    );
    setupException = exception;
    return [
      exception,
      tryWithArgsAsync,
      // () =>
      //   ({
      //     exception,
      //     failed: true,
      //   }) satisfies MultiSettled<never, never>,
    ] as const;
  }
  if (asyncFns.length === 0) {
    const exception = UnresolvableError.create(
      "asyncFns must NOT be an empty array",
      {
        value: [],
      },
    );
    setupException = exception;
    return [
      exception,
      tryWithArgsAsync,
      // () =>
      //   ({
      //     exception,
      //     failed: true,
      //   }) satisfies MultiSettled<never, never>,
    ] as const;
  }
  asyncFns.forEach((fn, index) => {
    if (typeof fn !== "function") {
      const exception = UnresolvableError.create(
        `Item at index ${index} is not a function`,
        {
          value: fn,
        },
      );
      setupException = exception;
      return [
        exception,
        tryWithArgsAsync,
        // () =>
        //   ({
        //     exception,
        //     failed: true,
        //   }) satisfies MultiSettled<never, never>,
      ] as const;
    }
  });

  return [setupException, tryWithArgsAsync] as const;

  function tryWithArgsAsync<E extends GenericError>(
    args: ArgTypes,
    errorListsToCatch?: ErrorTypeMap<RetTypes, E>[],
    onSettled?: {
      first?: (r: RetTypes[number]) => void;
      all?: (rs: RetTypes[number][]) => void;
    },
  ) {
    if (!!setupException) {
      return {
        exception: setupException,
        failed: true,
      } satisfies MultiSettled<never, never>;
    }

    if (errorListsToCatch == null) {
      errorListsToCatch = [];
    }

    const promises = asyncFns.map((fn, index) => {
      const arg = args[index];
      return (Array.isArray(arg) ? fn(...arg) : fn(arg)).then(
        (result) => {
          return [undefined, result] as const;
        },
        (error: unknown) => {
          if (error) {
            if (error instanceof UnresolvableError) {
              return [error, undefined] as const;
            }

            const errorTypes = errorListsToCatch[index];
            if (errorTypes?.some((Err) => error instanceof Err)) {
              const Err = errorTypes.find(
                (ErrorType, idx) => error instanceof ErrorType,
              );
              if (Err && error instanceof Err) {
                return [error, undefined] as const;
              }
              return [
                UnresolvableError.create(
                  "UnresolvableError: Errors to check listed, but none matched error produced",
                  {
                    errorsChecked: errorTypes.map((err) => err.name),
                  },
                ),
                undefined,
              ] as const;
            }
            if (error instanceof GenericError) {
              return [error, undefined] as const;
            }
            if (isBuiltInError(error)) {
              const [err, _name] = ensureError(error);
              return [err, undefined, _name] as const;
            }
            if (isJsonable(error)) {
              const [err, _name] = ensureError(error);
              return [err, undefined] as const;
            }
          } else if (error === null) {
            return [new GenericError("Reason: null"), undefined] as const;
          } else if (error === undefined) {
            return [new GenericError("Reason: undefined"), undefined] as const;
          }
          return [
            UnresolvableError.create("Unknown Reason!", {}),
            undefined,
          ] as const;
        },
      );
    });

    const firstSettled = Promise.race(
      promises.map((p) => {
        let dat: any; //: Awaited<RetTypes[typeof i]>;
        return p
          .then((result) => {
            dat = result;
            return result;
          })
          .finally(() => {
            if (onSettled?.first) {
              if (dat) {
                onSettled.first(dat);
              } else {
                onSettled.first(undefined);
              }
            }
          });
      }),
    );

    let allDat: any[] = []; /* : Awaited<RetTypes[number]>; */
    const allSettled = Promise.all(
      promises.map((p) => {
        return p.then((result) => {
          allDat.push(result);
          return result;
        });
      }),
    );
    if (onSettled?.all) {
      allSettled.finally(() => {
        if (onSettled?.all) {
          if (allDat) {
            onSettled.all(allDat);
          } else {
            onSettled.all([]);
          }
        }
      });
    }

    return {
      failed: false,
      firstSettled,
      allSettled,
    };
  }
}
