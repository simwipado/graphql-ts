import isPromise from "./isPromise.ts";
import { PromiseOrValue } from "./PromiseOrValue.ts";

/**
 * Similar to Array.prototype.reduce(), however the reducing callback may return
 * a Promise, in which case reduction will continue after each promise resolves.
 *
 * If the callback does not return a Promise, then this function will also not
 * return a Promise.
 */
export default function promiseReduce<T, U>(
  values: T[],
  callback: (arg1: U, arg2: T) => PromiseOrValue<U>,
  initialValue: PromiseOrValue<U>,
): PromiseOrValue<U> {
  return values.reduce(
    (previous, value) =>
      isPromise(previous)
        ? previous.then((resolved) => callback(resolved, value))
        : callback(previous, value),
    initialValue,
  );
}
