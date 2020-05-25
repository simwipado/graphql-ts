import invariant from './invariant.ts';
import nodejsCustomInspectSymbol from './nodejsCustomInspectSymbol.ts';

/**
 * The `defineInspect()` function defines `inspect()` prototype method as alias of `toJSON`
 */
export default function defineInspect(
  classObject: any | ((...args: any[]) => any),
): void {
  const fn = classObject.prototype.toJSON;
  invariant(typeof fn === 'function');

  classObject.prototype.inspect = fn;

  // istanbul ignore else (See: https://github.com/graphql/graphql-js/issues/2317)
  if (nodejsCustomInspectSymbol) {
    classObject.prototype[nodejsCustomInspectSymbol] = fn;
  }
}
