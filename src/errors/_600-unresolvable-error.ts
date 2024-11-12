import type { Jsonable } from "../types/jsonable.js";
import { GenericError } from "./_000-generic-error.js";

export class UnresolvableError<E extends GenericError> extends GenericError {
  public override readonly context?: { readonly [key: string]: Jsonable } = {};
  public override readonly name: string = "UnresolvableError";

  constructor(
    message: string,
    options: {
      cause: E;
      context: {
        [key: string]: Jsonable;
      };
    },
  ) {
    const {
      cause,
      context,
      context: { owners, fileName, lineNumber, ...rest },
    } = options;
    super(message, {
      cause: new GenericError(
        "Unresolvable Error thrown! This should not happen, contact the owning dev(s)...",
        {
          cause,
          context: {
            owners,
            fileName,
            lineNumber,
          },
        },
      ),
      context: rest,
    });
    // this.name = this.constructor.name;
    this.context = rest ?? {};

    // Set the prototype explicitly, so instanceof works.
    Object.setPrototypeOf(this, UnresolvableError.prototype);
  }
  static override get name(): "UnresolvableError" {
    return "UnresolvableError";
  }
  static override get statusCode(): "600" {
    return "600";
  }
  override get statusCode(): "600" {
    return "600";
  }

  static create<E extends GenericError>(
    msg: string,
    context: {
      readonly [key: string]: Jsonable;
    },
    cause?: E,
  ): UnresolvableError<E> {
    const { owners, fileName, lineNumber, ...rest } = context;

    return new UnresolvableError(msg, {
      cause: new GenericError("...rest", {
        cause: cause ?? new GenericError("time to debug..."),
        context: rest,
      }),
      context,
    });
  }
}
