import { GraphQLError } from "../../error/GraphQLError.ts";

import { ASTVisitor } from "../../language/visitor.ts";
import { VariableDefinitionNode } from "../../language/ast.ts";

import { ASTValidationContext } from "../ValidationContext.ts";

/**
 * Unique variable names
 *
 * A GraphQL operation is only valid if all its variables are uniquely named.
 */
export function UniqueVariableNamesRule(
  context: ASTValidationContext,
): ASTVisitor {
  let knownVariableNames = Object.create(null);
  return {
    OperationDefinition() {
      knownVariableNames = Object.create(null);
    },
    VariableDefinition(node: VariableDefinitionNode) {
      const variableName = node.variable.name.value;
      if (knownVariableNames[variableName]) {
        context.reportError(
          new GraphQLError(
            `There can be only one variable named "$${variableName}".`,
            [knownVariableNames[variableName], node.variable.name],
          ),
        );
      } else {
        knownVariableNames[variableName] = node.variable.name;
      }
    },
  };
}
