import inspect from '../../utilities/inspect.ts';

import { GraphQLError } from '../../error/GraphQLError.ts';

import { FieldNode } from '../../language/ast.ts';
import { ASTVisitor } from '../../language/visitor.ts';

import { getNamedType, isLeafType } from '../../type/definition.ts';

import { ValidationContext } from '../ValidationContext.ts';

/**
 * Scalar leafs
 *
 * A GraphQL document is valid only if all leaf fields (fields without
 * sub selections) are of scalar or enum types.
 */
export function ScalarLeafsRule(context: ValidationContext): ASTVisitor {
  return {
    Field(node: FieldNode) {
      const type = context.getType();
      const selectionSet = node.selectionSet;
      if (type) {
        if (isLeafType(getNamedType(type))) {
          if (selectionSet) {
            const fieldName = node.name.value;
            const typeStr = inspect(type);
            context.reportError(
              new GraphQLError(
                `Field "${fieldName}" must not have a selection since type "${typeStr}" has no subfields.`,
                selectionSet,
              ),
            );
          }
        } else if (!selectionSet) {
          const fieldName = node.name.value;
          const typeStr = inspect(type);
          context.reportError(
            new GraphQLError(
              `Field "${fieldName}" of type "${typeStr}" must have a selection of subfields. Did you mean "${fieldName} { ... }"?`,
              node,
            ),
          );
        }
      }
    },
  };
}
