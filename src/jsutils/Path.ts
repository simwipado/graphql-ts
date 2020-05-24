import Maybe from "../tsutils/Maybe.ts";

export type Path = {
  prev: Maybe<Path>,
  key: string | number,
};

/**
 * Given a Path and a key, return a new Path containing the new key.
 */
export function addPath(
  prev: Maybe<Readonly<Path>>,
  key: string | number,
): Path {
  return { prev, key };
}

/**
 * Given a Path, return an Array of the path keys.
 */
export function pathToArray(path: Maybe<Readonly<Path>>): Array<string | number> {
  const flattened = [];
  let curr = path;
  while (curr) {
    flattened.push(curr.key);
    curr = curr.prev;
  }
  return flattened.reverse();
}
