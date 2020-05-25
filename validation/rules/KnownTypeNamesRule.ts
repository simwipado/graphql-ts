import didYouMean from '../../utilities/didYouMean.ts';
import suggestionList from '../../utilities/suggestionList.ts';

import { GraphQLError } from '../../error/GraphQLError.ts';

import { ASTNode } from '../../language/ast.ts';
import { ASTVisitor } from '../../language/visitor.ts';
import {
  isTypeDefinitionNode,
  isTypeSystemDefinitionNode,
  isTypeSystemExtensionNode,
} from '../../language/predicates.ts';

import { specifiedScalarTypes } from '../../type/scalars.ts';

import {
  ValidationContext,
  SDLValidationContext,
} from '../ValidationContext.ts';

/**
 * Known type names
 *
 * A GraphQL document is only valid if referenced types (specifically
 * variable definitions and fragment conditions) are defined by the type schema.
 */
export function KnownTypeNamesRule(
  context: ValidationContext | SDLValidationContext,
): ASTVisitor {
  const schema = context.getSchema();
  const existingTypesMap = schema ? schema.getTypeMap() : Object.create(null);

  const definedTypes = Object.create(null);
  for (const def of context.getDocument().definitions) {
    if (isTypeDefinitionNode(def)) {
      definedTypes[def.name.value] = true;
    }
  }

  const typeNames = Object.keys(existingTypesMap).concat(
    Object.keys(definedTypes),
  );

  return {
    NamedType(node, _1, parent, _2, ancestors) {
      const typeName = node.name.value;
      if (!existingTypesMap[typeName] && !definedTypes[typeName]) {
        const definitionNode = ancestors[2] ?? parent;
        const isSDL = definitionNode != null && isSDLNode(definitionNode);
        if (isSDL && isSpecifiedScalarName(typeName)) {
          return;
        }

        const suggestedTypes = suggestionList(
          typeName,
          isSDL ? specifiedScalarsNames.concat(typeNames) : typeNames,
        );
        context.reportError(
          new GraphQLError(
            `Unknown type "${typeName}".` + didYouMean(suggestedTypes),
            node,
          ),
        );
      }
    },
  };
}

const specifiedScalarsNames = specifiedScalarTypes.map((type) => type.name);
function isSpecifiedScalarName(typeName: string) {
  return specifiedScalarsNames.indexOf(typeName) !== -1;
}

function isSDLNode(value: ASTNode | ASTNode[]): boolean {
  return (
    !(Array.isArray(value)) &&
    (isTypeSystemDefinitionNode(value) || isTypeSystemExtensionNode(value))
  );
}
