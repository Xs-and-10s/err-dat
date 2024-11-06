import type { Jsonable } from "../types/index.js";

// Here is the base error classes to extend from
export class GenericError extends Error {
  public readonly context?: { readonly [key: string]: Jsonable } = {};

  constructor(
    message: string,
    options: {
      cause?: Error;
      context?: { readonly [key: string]: Jsonable };
    } = {},
  ) {
    const { cause, context } = options;
    super(message, { cause });
    this.name = this.constructor.name;
    this.context = context;

    // Set the prototype explicitly, so instanceof works.
    Object.setPrototypeOf(this, GenericError.prototype);
  }
  static override get name() {
    return "GenericError";
  }
  static get statusCode() {
    return "000";
  }
  get statusCode() {
    return "000";
  }
}
