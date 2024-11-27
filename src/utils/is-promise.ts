export function isPromise(value: unknown): value is Promise<unknown> {
  return value != null && typeof (value as any).then === "function";
}
