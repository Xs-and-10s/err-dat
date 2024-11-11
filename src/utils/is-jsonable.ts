import type { Jsonable } from "../types/jsonable.js";

export function isJsonable(value: unknown): value is Jsonable {
  if (value === undefined) {
    return false;
  }

  if (value === null) {
    return true;
  }

  // Handle basic primitives
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  // Handle arrays recursively
  if (Array.isArray(value)) {
    return value.every((item) => isJsonable(item));
  }

  // Handle plain objects recursively
  if (typeof value === "object") {
    // Check if it's a plain object (not Date, RegExp, etc)
    if (Object.getPrototypeOf(value) !== Object.prototype) {
      return false;
    }

    return Object.values(value).every((item) => isJsonable(item));
  }

  return false;
}
