import inspect from '../jsutils/inspect.ts';
import invariant from '../jsutils/invariant.ts';

import { Kind } from '../language/kinds.ts';
import {
NamedTypeNode,
ListTypeNode,
TypeNode,
} from '../language/ast.ts';

import { GraphQLSchema } from '../type/schema.ts';
import {
GraphQLNamedType,
  GraphQLList,
  GraphQLNonNull,
} from '../type/definition.ts';

/**
 * Given a Schema and an AST node describing a type, return a GraphQLType
 * definition which applies to that type. For example, if provided the parsed
 * AST node for `[User]`, a GraphQLList instance will be returned, containing
 * the type called "User" found in the schema. If a type called "User" is not
 * found in the schema, then undefined will be returned.
 */
/* eslint-disable no-redeclare */
export function typeFromAST(
  schema: GraphQLSchema,
  typeNode: NamedTypeNode,
): GraphQLNamedType | undefined;

export function typeFromAST(
  schema: GraphQLSchema,
  typeNode: ListTypeNode,
): GraphQLList<any> | undefined;

export function typeFromAST(
  schema: GraphQLSchema,
  typeNode: TypeNode,
): GraphQLNonNull<any> | undefined;
export function typeFromAST(
  schema: GraphQLSchema, 
  typeNode: NamedTypeNode | ListTypeNode | TypeNode) {
  /* eslint-enable no-redeclare */
  let innerType;
  if (typeNode.kind === Kind.LIST_TYPE) {
    innerType = typeFromAST(schema, typeNode.type);
    return innerType && new GraphQLList(innerType);
  }
  if (typeNode.kind === Kind.NON_NULL_TYPE) {
    innerType = typeFromAST(schema, typeNode.type);
    return innerType && new GraphQLNonNull(innerType);
  }
  if (typeNode.kind === Kind.NAMED_TYPE) {
    return schema.getType(typeNode.name.value);
  }

  // Not reachable. All possible type nodes have been considered.
  invariant(false, 'Unexpected type node: ' + inspect(typeNode));
}
