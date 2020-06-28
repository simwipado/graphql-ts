import { GraphQLError } from "../../error/GraphQLError.ts";
import { ASTVisitor } from "../../language/visitor.ts";

import { ASTValidationContext } from "../ValidationContext.ts";
import { OperationDefinitionNode } from "../../language/ast.ts";
import { FragmentDefinitionNode } from "../../language/ast.ts";

/**
 * No unused fragments
 *
 * A GraphQL document is only valid if all fragment definitions are spread
 * within operations, or spread within other fragments spread within operations.
 */
export function NoUnusedFragmentsRule(
  context: ASTValidationContext,
): ASTVisitor {
  const operationDefs: OperationDefinitionNode[] = [];
  const fragmentDefs: FragmentDefinitionNode[] = [];

  return {
    OperationDefinition(node) {
      operationDefs.push(node);
      return false;
    },
    FragmentDefinition(node) {
      fragmentDefs.push(node);
      return false;
    },
    Document: {
      leave() {
        const fragmentNameUsed = Object.create(null);
        for (const operation of operationDefs) {
          for (
            const fragment of context.getRecursivelyReferencedFragments(
              operation,
            )
          ) {
            fragmentNameUsed[fragment.name.value] = true;
          }
        }

        for (const fragmentDef of fragmentDefs) {
          const fragName = fragmentDef.name.value;
          if (fragmentNameUsed[fragName] !== true) {
            context.reportError(
              new GraphQLError(
                `Fragment "${fragName}" is never used.`,
                fragmentDef,
              ),
            );
          }
        }
      },
    },
  };
}
