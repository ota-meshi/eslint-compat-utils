/**
 * Returns the given object with a polyfill applied.
 */
export function applyPolyfills<T extends object, P extends object>(
  object: T,
  polyfill: P,
): T & P {
  return new Proxy(object, {
    get(target, propertyKey, receiver) {
      const result = Reflect.get(target, propertyKey, receiver);
      if (typeof result === "function") {
        return function (this: T, ...args: any[]) {
          // eslint-disable-next-line no-invalid-this -- `this` is valid in this context
          if (this === receiver) {
            return result.call(object, ...args);
          }
          // eslint-disable-next-line no-invalid-this -- `this` is valid in this context
          return result.call(this, ...args);
        };
      }
      return result ?? (polyfill as any)[propertyKey];
    },
  }) as never;
}
