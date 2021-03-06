import nodejsCustomInspectSymbol from "./nodejsCustomInspectSymbol.ts";

const MAX_ARRAY_LENGTH = 10;
const MAX_RECURSIVE_DEPTH = 2;

/**
 * Used to print values in error messages.
 */
export default function inspect(value: any): string {
  return formatValue(value, []);
}

function formatValue(value: any, seenValues: any[]): string {
  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "function":
      return value.name ? `[function ${value.name as string}]` : "[function]";
    case "object":
      return formatObjectValue(value, seenValues);
    default:
      return String(value);
  }
}

function formatObjectValue(value: any, previouslySeenValues: any) {
  if (previouslySeenValues.indexOf(value) !== -1) {
    return "[Circular]";
  }

  const seenValues = [...previouslySeenValues, value];
  const customInspectFn = getCustomFn(value);

  if (customInspectFn !== undefined) {
    const customValue = customInspectFn.call(value);

    // check for infinite recursion
    if (customValue !== value) {
      return typeof customValue === "string"
        ? customValue
        : formatValue(customValue, seenValues);
    }
  } else if (Array.isArray(value)) {
    return formatArray(value, seenValues);
  }

  return formatObject(value, seenValues);
}

function formatObject(object: any, seenValues: any) {
  const keys = Object.keys(object);
  if (keys.length === 0) {
    return "{}";
  }

  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return "[" + getObjectTag(object) + "]";
  }

  const properties = keys.map((key) => {
    const value = formatValue(object[key], seenValues);
    return key + ": " + value;
  });

  return "{ " + properties.join(", ") + " }";
}

function formatArray(array: any[], seenValues: any[]) {
  if (array.length === 0) {
    return "[]";
  }

  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return "[Array]";
  }

  const len = Math.min(MAX_ARRAY_LENGTH, array.length);
  const remaining = array.length - len;
  const items = [];

  for (let i = 0; i < len; ++i) {
    items.push(formatValue(array[i], seenValues));
  }

  if (remaining === 1) {
    items.push("... 1 more item");
  } else if (remaining > 1) {
    items.push(`... ${remaining} more items`);
  }

  return "[" + items.join(", ") + "]";
}

function getCustomFn(object: any): (() => undefined) | undefined {
  const customInspectFn = object[String(nodejsCustomInspectSymbol)];

  if (typeof customInspectFn === "function") {
    return customInspectFn;
  }

  if (typeof object.inspect === "function") {
    return object.inspect;
  }
}

function getObjectTag(object: any): string {
  const tag = Object.prototype.toString
    .call(object)
    .replace(/^\[object /, "")
    .replace(/]$/, "");

  if (tag === "Object" && typeof object.constructor === "function") {
    const name = object.constructor.name;
    if (typeof name === "string" && name !== "") {
      return name;
    }
  }

  return tag;
}
