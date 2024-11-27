// export const TryError.CodeOptions = {
//   ERR_NULLISH_VALUE_CAUGHT: "ERR_NULLISH_VALUE_CAUGHT",
//   ERR_NOT_A_FUNCTION: "ERR_NOT_A_FUNCTION",
//   ERR_NOT_AN_ARRAY: "ERR_NOT_AN_ARRAY",
// } as const;

export type TryErrorCode =
  (typeof TryError.ErrCodeOptions)[keyof typeof TryError.ErrCodeOptions];

function tryErrorMessageFromCode(code: TryErrorCode): string {
  switch (code) {
    case TryError.ErrCodeOptions.NULLISH_VALUE_CAUGHT:
      return "A nullish value has been caught";
    case TryError.ErrCodeOptions.NOT_A_FUNCTION:
      return "The 'fn' argument is not a function";
    case TryError.ErrCodeOptions.NOT_AN_ARRAY:
      return "The 'listOfFns' argument is not an array";
  }
}

export class TryError extends Error {
  static ErrCodeOptions = {
    NULLISH_VALUE_CAUGHT: "ERR_NULLISH_VALUE_CAUGHT",
    NOT_A_FUNCTION: "ERR_NOT_A_FUNCTION",
    NOT_AN_ARRAY: "ERR_NOT_AN_ARRAY",
  } as const;

  static NullishValueCaught = class NullishValueCaught extends TryError {
    constructor(cause: null | undefined) {
      super(TryError.ErrCodeOptions.NULLISH_VALUE_CAUGHT, cause);
    }
  };

  static NotAFunction = class NotAFunction extends TryError {
    constructor(cause: null | undefined) {
      super(TryError.ErrCodeOptions.NOT_A_FUNCTION, cause);
    }
  };

  static NotAnArray = class NotAnArray extends TryError {
    constructor(cause: null | undefined) {
      super(TryError.ErrCodeOptions.NOT_AN_ARRAY, cause);
    }
  };

  constructor(
    public code: TryErrorCode,
    public override cause: unknown,
  ) {
    super(tryErrorMessageFromCode(code));
    Object.defineProperties(this, {
      code: { enumerable: true, writable: false, value: code },
      cause: { enumerable: true, writable: false, value: cause },
    });
  }
}
