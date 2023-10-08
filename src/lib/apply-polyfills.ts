/**
 * Returns the given object with a polyfill applied.
 */
export function applyPolyfills<T extends object, P extends object>(
  object: T,
  polyfill: P,
): T & P {
  return new Proxy(object, {
    get(_target, p) {
      return (object as any)[p] ?? (polyfill as any)[p];
    },
  }) as never;
}
