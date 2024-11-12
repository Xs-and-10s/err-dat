import { GenericError } from "../errors/_000-generic-error.js";
import { UnresolvableError } from "../errors/_600-unresolvable-error.js";
import type { Jsonable } from "../types/jsonable.js";
import { ensureError } from "./ensure-error.js";

export function panic<E extends GenericError = UnresolvableError<any>>(
  error?: unknown,
  options?: {
    cause: E;
    context: { readonly [key: string]: Jsonable };
  },
) {
  const coz = options?.cause;
  const ctx = options?.context;

  if (error instanceof UnresolvableError) {
    throw error;
  }

  const [e, name] = ensureError(error);

  if (e instanceof UnresolvableError) {
    throw e;
  }

  if (!!options) {
    if (coz && ctx) {
      throw UnresolvableError.create(
        "panic!",
        {
          type: name,
          cause: e.message,
          ...ctx,
        } satisfies Jsonable,
        coz,
      );
    }
    if (ctx) {
      throw UnresolvableError.create(
        "panic!",
        {
          type: name,
          ...ctx,
        } satisfies Jsonable,
        new GenericError(e.message),
      );
    }
    if (coz) {
      throw UnresolvableError.create(
        "panic!",
        {
          type: name,
          cause: e.message,
        } satisfies Jsonable,
        coz,
      );
    }
  } else if (e instanceof Error) {
    throw UnresolvableError.create(
      "panic!",
      {
        type: name,
        cause: e.message,
        context: { ...ctx },
      } satisfies Jsonable,
      coz ?? undefined,
    );
  }
  throw UnresolvableError.create("panic!", {
    type: name,
    cause: e.message,
  } satisfies Jsonable);
}
