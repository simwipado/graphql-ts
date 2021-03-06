const MAX_SUGGESTIONS = 5;

/**
 * Given [ A, B, C ] return ' Did you mean A, B, or C?'.
 */
export default function didYouMean(suggestions: string[]): string;
export default function didYouMean(
  subMessage: string,
  suggestions: string[],
): string;
export default function didYouMean(
  firstArg: string | string[],
  secondArg?: string[],
) {
  const [subMessage, suggestionsArg] = typeof firstArg === "string"
    ? [firstArg, secondArg]
    : [undefined, firstArg];

  let message = " Did you mean ";
  if (subMessage) {
    message += subMessage + " ";
  }

  const suggestions = (suggestionsArg as string[]).map((x) => `"${x}"`);
  switch (suggestions.length) {
    case 0:
      return "";
    case 1:
      return message + suggestions[0] + "?";
    case 2:
      return message + suggestions[0] + " or " + suggestions[1] + "?";
  }

  const selected = suggestions.slice(0, MAX_SUGGESTIONS);
  const lastItem = selected.pop() as string;
  return message + selected.join(", ") + ", or " + lastItem + "?";
}
