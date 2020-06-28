/**
 * Build a string describing the path.
 */
export default function printPathArray(
  path: (string | number)[],
): string {
  return path
    .map((key) =>
      typeof key === "number" ? "[" + key.toString() + "]" : "." + key
    )
    .join("");
}
