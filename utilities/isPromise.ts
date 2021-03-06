/**
 * Returns true if the value acts like a Promise, i.e. has a "then" function,
 * otherwise returns false.
 */

export default function isPromis(value: any): value is Promise<any> {
  return typeof value?.then === "function";
}
