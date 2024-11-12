import { GenericError } from "../errors/_000-generic-error.js";
// import { CustomError } from "../errors/_0xx-custom-error.js";
// import { BadRequestError } from "../errors/_400-bad-request-error.js";
// import { NotFoundError } from "../errors/_404-not-found-error.js";
// import { InternalServerError } from "../errors/_500-internal-server-error.js";
import { UnresolvableError } from "../errors/_600-unresolvable-error.js";
import type { Jsonable } from "../types/jsonable.js";
import { isJsonable } from "../utils/is-jsonable.js";

export const unstringafiable = "[Unable to stringify the thrown value]";
export const non_error_type_info =
  "This value was thrown as is, not through an Error";
export const builtin_error_type_info =
  "This value was thrown as a built-in Error: converted to a GenericError";

export function ensureError(
  value: unknown,
):
  | readonly [UnresolvableError<any>, "UnresolvableError"]
  | readonly [GenericError, "GenericError"] {
  let error: GenericError;
  let stringified = unstringafiable;

  if (value != null) {
    if (value instanceof GenericError) {
      // ? value: IS a GenericError OR subclass
      // if (value.name === BadRequestError.name) return [value, value.name] as const;
      // if (value.name === NotFoundError.name) return [value, value.name] as const;
      // if (value.name === InternalServerError.name) return [value, value.name] as const;
      // if (value.name === CustomError.name) return [value, value.name] as const;
      if (value instanceof UnresolvableError)
        return [value, value.name] as const as readonly [
          UnresolvableError<any>,
          "UnresolvableError",
        ];
      if (value.name === GenericError.name)
        return [value, value.name] as const as readonly [
          GenericError,
          "GenericError",
        ];
      // ...
    } else if (value instanceof Error && value.name === Error.name) {
      // ? value: IS an Error
      error = new GenericError(value.message, {
        context: {
          info: builtin_error_type_info,
          type: "Error",
          value: value.message,
        },
      });
      return [error, error.name] as const as readonly [
        GenericError,
        "GenericError",
      ];
      // ...
    } else if (typeof value === "string") {
      // ? value: IS a string
      if (value.length === 0) {
        error = new GenericError(value, {
          context: {
            info: non_error_type_info,
            type: "string",
            value,
          },
        });
        return [error, error.name] as const as readonly [
          GenericError,
          "GenericError",
        ];
        // ...
      } else {
        error = new GenericError(value, {
          context: {
            info: non_error_type_info,
            type: "string",
            value,
          },
        });
        return [error, error.name] as const as readonly [
          GenericError,
          "GenericError",
        ];
      }
      // ...
    } else if (typeof value === "number") {
      // ? value IS a number
      const numOrNaN = value == value * 1 ? value * 1 : value;
      // const msg = value.toString()
      if (Number.isNaN(numOrNaN)) {
        // ? value IS NaN
        error = new GenericError(value.toString(), {
          context: {
            info: non_error_type_info,
            type: "numeric::NaN",
            value,
          },
        });
        return [error, error.name] as const as readonly [
          GenericError,
          "GenericError",
        ];
      }
      if (!Number.isFinite(value)) {
        // ? value IS Infinity OR -Infiniity
        error = new GenericError(value.toString(), {
          context: {
            info: non_error_type_info,
            type: "numeric::Infinite",
            value,
          },
        });
        return [error, error.name] as const as readonly [
          GenericError,
          "GenericError",
        ];
      }
      const str = value.toString();
      if (~str.indexOf(".")) {
        // ? value IS a float
        error = new GenericError(str, {
          context: {
            info: non_error_type_info,
            type: "numeric::float",
            value,
          },
        });
        return [error, error.name] as const as readonly [
          GenericError,
          "GenericError",
        ];
        // ...
      } else {
        // ? value IS an int
        error = new GenericError(str, {
          context: {
            info: non_error_type_info,
            type: "numeric::int",
            value,
          },
        });
        return [error, error.name] as const as readonly [
          GenericError,
          "GenericError",
        ];
        // ...
      }
      // ...
    } else if (isJsonable(value)) {
      // ? value IS an "object"
      // ? but NOT an Array
      try {
        stringified = JSON.stringify(value);
      } catch {} /**
       * ! drop error, only care about changing
       * ! `stringified` value if it exists
       */
      error = new GenericError(stringified, {
        context: {
          info: non_error_type_info,
          type: "Jsonable",
          value,
        },
      });

      return [error, error.name] as const as readonly [
        GenericError,
        "GenericError",
      ];
    }
    // ...
  } else if (value === null) {
    // ? value === null
    stringified = "null";
    error = new GenericError(stringified, {
      context: {
        info: non_error_type_info,
        type: "null",
        value,
      },
    });
    return [error, error.name] as const as readonly [
      GenericError,
      "GenericError",
    ];
    // ...
  } else if (value === undefined) {
    // ? value === undefined
    stringified = "undefined";
    error = new GenericError(stringified, {
      context: {
        info: non_error_type_info,
        type: "undefined",
        value,
      },
    });
    return [error, error.name] as const as readonly [
      GenericError,
      "GenericError",
    ];
    // ...
  } else {
    // ? ... ?
    // ! what actual is value ?
    try {
      stringified = JSON.stringify(value);
    } catch {} /**
     * ! drop error, only care about getting
     * ! `stringified` value if it exists
     */
    error = new GenericError(stringified, {
      context: {
        info: non_error_type_info,
        type: "Jsonable",
        value,
      },
    });
    return [error, error.name] as const as readonly [
      GenericError,
      "GenericError",
    ];
  }
  // ? ... ?
  // ! what actual is value ?
  try {
    stringified = JSON.stringify(value);
  } catch {} /**
   * ! drop error, only care about getting
   * ! `stringified` value if it exists
   */
  error = new GenericError(stringified, {
    context: {
      info: non_error_type_info,
      type: "IDK",
      value: value as Jsonable,
    },
  });
  return [error, error.name] as const as readonly [
    GenericError,
    "GenericError",
  ];
}
