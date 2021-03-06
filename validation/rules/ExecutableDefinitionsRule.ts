import { GraphQLError } from "../../error/GraphQLError.ts";

import { Kind } from "../../language/kinds.ts";
import { ASTVisitor } from "../../language/visitor.ts";
import { isExecutableDefinitionNode } from "../../language/predicates.ts";

import { ASTValidationContext } from "../ValidationContext.ts";

/**
 * Executable definitions
 *
 * A GraphQL document is only valid for execution if all definitions are either
 * operation or fragment definitions.
 */
export function ExecutableDefinitionsRule(
  context: ASTValidationContext,
): ASTVisitor {
  return {
    Document(node) {
      for (const definition of node.definitions) {
        if (!isExecutableDefinitionNode(definition)) {
          const defName = definition.kind === Kind.SCHEMA_DEFINITION ||
            definition.kind === Kind.SCHEMA_EXTENSION
            ? "schema"
            : '"' + definition.name.value + '"';
          context.reportError(
            new GraphQLError(
              `The ${defName} definition is not executable.`,
              definition,
            ),
          );
        }
      }
      return false;
    },
  };
}
