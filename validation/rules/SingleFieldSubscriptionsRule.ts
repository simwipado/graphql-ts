import { GraphQLError } from "../../error/GraphQLError.ts";

import { ASTVisitor } from "../../language/visitor.ts";
import { OperationDefinitionNode } from "../../language/ast.ts";

import { ASTValidationContext } from "../ValidationContext.ts";

/**
 * Subscriptions must only include one field.
 *
 * A GraphQL subscription is valid only if it contains a single root field.
 */
export function SingleFieldSubscriptionsRule(
  context: ASTValidationContext,
): ASTVisitor {
  return {
    OperationDefinition(node: OperationDefinitionNode) {
      if (node.operation === "subscription") {
        if (node.selectionSet.selections.length !== 1) {
          context.reportError(
            new GraphQLError(
              node.name
                ? `Subscription "${node.name.value}" must select only one top level field.`
                : "Anonymous Subscription must select only one top level field.",
              node.selectionSet.selections.slice(1),
            ),
          );
        }
      }
    },
  };
}
