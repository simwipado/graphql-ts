import inspect from "../../utilities/inspect.ts";
import invariant from "../../utilities/invariant.ts";
import didYouMean from "../../utilities/didYouMean.ts";
import suggestionList from "../../utilities/suggestionList.ts";

import { GraphQLError } from "../../error/GraphQLError.ts";

import { Kind } from "../../language/kinds.ts";
import { ASTVisitor } from "../../language/visitor.ts";
import { isTypeDefinitionNode } from "../../language/predicates.ts";

import {
  isScalarType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isEnumType,
  isInputObjectType,
} from "../../type/definition.ts";

import { SDLValidationContext } from "../ValidationContext.ts";
import {
  ScalarTypeExtensionNode,
  ObjectTypeExtensionNode,
  InterfaceTypeExtensionNode,
  UnionTypeExtensionNode,
  EnumTypeExtensionNode,
  InputObjectTypeExtensionNode,
} from "../../language/ast.ts";

/**
 * Possible type extension
 *
 * A type extension is only valid if the type is defined and has the same kind.
 */
export function PossibleTypeExtensionsRule(
  context: SDLValidationContext,
): ASTVisitor {
  const schema = context.getSchema();
  const definedTypes = Object.create(null);

  for (const def of context.getDocument().definitions) {
    if (isTypeDefinitionNode(def)) {
      definedTypes[def.name.value] = def;
    }
  }

  return {
    ScalarTypeExtension: checkExtension,
    ObjectTypeExtension: checkExtension,
    InterfaceTypeExtension: checkExtension,
    UnionTypeExtension: checkExtension,
    EnumTypeExtension: checkExtension,
    InputObjectTypeExtension: checkExtension,
  };

  function checkExtension(
    node:
      | ScalarTypeExtensionNode
      | ObjectTypeExtensionNode
      | InterfaceTypeExtensionNode
      | UnionTypeExtensionNode
      | EnumTypeExtensionNode
      | InputObjectTypeExtensionNode,
  ) {
    const typeName = node.name.value;
    const defNode = definedTypes[typeName];
    const existingType = schema?.getType(typeName);

    let expectedKind;
    if (defNode) {
      expectedKind = (defKindToExtKind as any)[defNode.kind];
    } else if (existingType) {
      expectedKind = typeToExtKind(existingType);
    }

    if (expectedKind) {
      if (expectedKind !== node.kind) {
        const kindStr = extensionKindToTypeName(node.kind);
        context.reportError(
          new GraphQLError(
            `Cannot extend non-${kindStr} type "${typeName}".`,
            defNode ? [defNode, node] : node,
          ),
        );
      }
    } else {
      let allTypeNames = Object.keys(definedTypes);
      if (schema) {
        allTypeNames = allTypeNames.concat(Object.keys(schema.getTypeMap()));
      }

      const suggestedTypes = suggestionList(typeName, allTypeNames);
      context.reportError(
        new GraphQLError(
          `Cannot extend type "${typeName}" because it is not defined.` +
            didYouMean(suggestedTypes),
          node.name,
        ),
      );
    }
  }
}

const defKindToExtKind = {
  [Kind.SCALAR_TYPE_DEFINITION]: Kind.SCALAR_TYPE_EXTENSION,
  [Kind.OBJECT_TYPE_DEFINITION]: Kind.OBJECT_TYPE_EXTENSION,
  [Kind.INTERFACE_TYPE_DEFINITION]: Kind.INTERFACE_TYPE_EXTENSION,
  [Kind.UNION_TYPE_DEFINITION]: Kind.UNION_TYPE_EXTENSION,
  [Kind.ENUM_TYPE_DEFINITION]: Kind.ENUM_TYPE_EXTENSION,
  [Kind.INPUT_OBJECT_TYPE_DEFINITION]: Kind.INPUT_OBJECT_TYPE_EXTENSION,
} as const;

function typeToExtKind(type: any) {
  if (isScalarType(type)) {
    return Kind.SCALAR_TYPE_EXTENSION;
  }
  if (isObjectType(type)) {
    return Kind.OBJECT_TYPE_EXTENSION;
  }
  if (isInterfaceType(type)) {
    return Kind.INTERFACE_TYPE_EXTENSION;
  }
  if (isUnionType(type)) {
    return Kind.UNION_TYPE_EXTENSION;
  }
  if (isEnumType(type)) {
    return Kind.ENUM_TYPE_EXTENSION;
  }
  if (isInputObjectType(type)) {
    return Kind.INPUT_OBJECT_TYPE_EXTENSION;
  }

  // Not reachable. All possible types have been considered.
  invariant(false, "Unexpected type: " + inspect(type));
}

function extensionKindToTypeName(kind: any) {
  switch (kind) {
    case Kind.SCALAR_TYPE_EXTENSION:
      return "scalar";
    case Kind.OBJECT_TYPE_EXTENSION:
      return "object";
    case Kind.INTERFACE_TYPE_EXTENSION:
      return "interface";
    case Kind.UNION_TYPE_EXTENSION:
      return "union";
    case Kind.ENUM_TYPE_EXTENSION:
      return "enum";
    case Kind.INPUT_OBJECT_TYPE_EXTENSION:
      return "input object";
  }

  // Not reachable. All possible types have been considered.
  invariant(false, "Unexpected kind: " + inspect(kind));
}
