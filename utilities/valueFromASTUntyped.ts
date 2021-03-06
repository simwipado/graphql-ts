import inspect from "../utilities/inspect.ts";
import invariant from "../utilities/invariant.ts";
import keyValMap from "../utilities/keyValMap.ts";
import { ObjMap } from "../utilities/ObjMap.ts";

import { Kind } from "../language/kinds.ts";
import { ValueNode } from "../language/ast.ts";
import Maybe from "../utilities/Maybe.ts";

/**
 * Produces a JavaScript value given a GraphQL Value AST.
 *
 * Unlike `valueFromAST()`, no type is provided. The resulting JavaScript value
 * will reflect the provided GraphQL value AST.
 *
 * | GraphQL Value        | JavaScript Value |
 * | -------------------- | ---------------- |
 * | Input Object         | Object           |
 * | List                 | Array            |
 * | Boolean              | Boolean          |
 * | String / Enum        | String           |
 * | Int / Float          | Number           |
 * | Null                 | null             |
 *
 */
export function valueFromASTUntyped(
  valueNode: ValueNode,
  variables?: Maybe<ObjMap<any>>,
): any {
  switch (valueNode.kind) {
    case Kind.NULL:
      return null;
    case Kind.INT:
      return parseInt(valueNode.value, 10);
    case Kind.FLOAT:
      return parseFloat(valueNode.value);
    case Kind.STRING:
    case Kind.ENUM:
    case Kind.BOOLEAN:
      return valueNode.value;
    case Kind.LIST:
      return valueNode.values.map((node) =>
        valueFromASTUntyped(node, variables)
      );
    case Kind.OBJECT:
      return keyValMap(
        valueNode.fields,
        (field) => field.name.value,
        (field) => valueFromASTUntyped(field.value, variables),
      );
    case Kind.VARIABLE:
      return variables?.[valueNode.name.value];
  }

  // Not reachable. All possible value nodes have been considered.
  invariant(false, "Unexpected value node: " + inspect(valueNode));
}
