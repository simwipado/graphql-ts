import defineInspect from "../utilities/defineInspect.ts";

import { Source } from "./source.ts";
import { TokenKindEnum } from "./tokenKind.ts";

/**
 * Contains a range of UTF-8 character offsets and token references that
 * identify the region of the source from which the AST derived.
 */
export class Location {
  /**
   * The character offset at which this Node begins.
   */
  start: number;

  /**
   * The character offset at which this Node ends.
   */
  end: number;

  /**
   * The Token at which this Node begins.
   */
  startToken: Token;

  /**
   * The Token at which this Node ends.
   */
  endToken: Token;

  /**
   * The Source document the AST represents.
   */
  source: Source;

  constructor(startToken: Token, endToken: Token, source: Source) {
    this.start = startToken.start;
    this.end = endToken.end;
    this.startToken = startToken;
    this.endToken = endToken;
    this.source = source;
  }

  toJSON(): { start: number; end: number } {
    return { start: this.start, end: this.end };
  }
}

// Print a simplified form when appearing in `inspect` and `util.inspect`.
defineInspect(Location);

/**
 * Represents a range of characters represented by a lexical token
 * within a Source.
 */
export class Token {
  /**
   * The kind of Token.
   */
  kind: TokenKindEnum;

  /**
   * The character offset at which this Node begins.
   */
  start: number;

  /**
   * The character offset at which this Node ends.
   */
  end: number;

  /**
   * The 1-indexed line number on which this Token appears.
   */
  line: number;

  /**
   * The 1-indexed column number at which this Token begins.
   */
  column: number;

  /**
   * For non-punctuation tokens, represents the interpreted value of the token.
   */
  value: string | undefined;

  /**
   * Tokens exist as nodes in a double-linked-list amongst all tokens
   * including ignored tokens. <SOF> is always the first node and <EOF>
   * the last.
   */
  prev: Token | null;
  next: Token | null;

  constructor(
    kind: TokenKindEnum,
    start: number,
    end: number,
    line: number,
    column: number,
    prev: Token | null,
    value?: string,
  ) {
    this.kind = kind;
    this.start = start;
    this.end = end;
    this.line = line;
    this.column = column;
    this.value = value;
    this.prev = prev;
    this.next = null;
  }

  toJSON(): {
    kind: TokenKindEnum;
    value: string | undefined;
    line: number;
    column: number;
  } {
    return {
      kind: this.kind,
      value: this.value,
      line: this.line,
      column: this.column,
    };
  }
}

// Print a simplified form when appearing in `inspect` and `util.inspect`.
defineInspect(Token);

/**
 * @internal
 */
export function isNode(maybeNode: any): maybeNode is ASTNode {
  return maybeNode != null && typeof maybeNode.kind === "string";
}

/**
 * The list of all possible AST node types.
 */
export type ASTNode =
  | NameNode
  | DocumentNode
  | OperationDefinitionNode
  | VariableDefinitionNode
  | VariableNode
  | SelectionSetNode
  | FieldNode
  | ArgumentNode
  | FragmentSpreadNode
  | InlineFragmentNode
  | FragmentDefinitionNode
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ListValueNode
  | ObjectValueNode
  | ObjectFieldNode
  | DirectiveNode
  | NamedTypeNode
  | ListTypeNode
  | NonNullTypeNode
  | SchemaDefinitionNode
  | OperationTypeDefinitionNode
  | ScalarTypeDefinitionNode
  | ObjectTypeDefinitionNode
  | FieldDefinitionNode
  | InputValueDefinitionNode
  | InterfaceTypeDefinitionNode
  | UnionTypeDefinitionNode
  | EnumTypeDefinitionNode
  | EnumValueDefinitionNode
  | InputObjectTypeDefinitionNode
  | DirectiveDefinitionNode
  | SchemaExtensionNode
  | ScalarTypeExtensionNode
  | ObjectTypeExtensionNode
  | InterfaceTypeExtensionNode
  | UnionTypeExtensionNode
  | EnumTypeExtensionNode
  | InputObjectTypeExtensionNode;

/**
 * Utility type listing all nodes indexed by their kind.
 */
export interface ASTKindToNode {
  Name: NameNode;
  Document: DocumentNode;
  OperationDefinition: OperationDefinitionNode;
  VariableDefinition: VariableDefinitionNode;
  Variable: VariableNode;
  SelectionSet: SelectionSetNode;
  Field: FieldNode;
  Argument: ArgumentNode;
  FragmentSpread: FragmentSpreadNode;
  InlineFragment: InlineFragmentNode;
  FragmentDefinition: FragmentDefinitionNode;
  IntValue: IntValueNode;
  FloatValue: FloatValueNode;
  StringValue: StringValueNode;
  BooleanValue: BooleanValueNode;
  NullValue: NullValueNode;
  EnumValue: EnumValueNode;
  ListValue: ListValueNode;
  ObjectValue: ObjectValueNode;
  ObjectField: ObjectFieldNode;
  Directive: DirectiveNode;
  NamedType: NamedTypeNode;
  ListType: ListTypeNode;
  NonNullType: NonNullTypeNode;
  SchemaDefinition: SchemaDefinitionNode;
  OperationTypeDefinition: OperationTypeDefinitionNode;
  ScalarTypeDefinition: ScalarTypeDefinitionNode;
  ObjectTypeDefinition: ObjectTypeDefinitionNode;
  FieldDefinition: FieldDefinitionNode;
  InputValueDefinition: InputValueDefinitionNode;
  InterfaceTypeDefinition: InterfaceTypeDefinitionNode;
  UnionTypeDefinition: UnionTypeDefinitionNode;
  EnumTypeDefinition: EnumTypeDefinitionNode;
  EnumValueDefinition: EnumValueDefinitionNode;
  InputObjectTypeDefinition: InputObjectTypeDefinitionNode;
  DirectiveDefinition: DirectiveDefinitionNode;
  SchemaExtension: SchemaExtensionNode;
  ScalarTypeExtension: ScalarTypeExtensionNode;
  ObjectTypeExtension: ObjectTypeExtensionNode;
  InterfaceTypeExtension: InterfaceTypeExtensionNode;
  UnionTypeExtension: UnionTypeExtensionNode;
  EnumTypeExtension: EnumTypeExtensionNode;
  InputObjectTypeExtension: InputObjectTypeExtensionNode;
}

// Name

export interface NameNode {
  kind: "Name";
  loc?: Location;
  value: string;
}

// Document

export interface DocumentNode {
  kind: "Document";
  loc?: Location;
  definitions: DefinitionNode[];
}

export type DefinitionNode =
  | ExecutableDefinitionNode
  | TypeSystemDefinitionNode
  | TypeSystemExtensionNode;

export type ExecutableDefinitionNode =
  | OperationDefinitionNode
  | FragmentDefinitionNode;

export interface OperationDefinitionNode {
  kind: "OperationDefinition";
  loc?: Location;
  operation: OperationTypeNode;
  name?: NameNode;
  variableDefinitions: VariableDefinitionNode[];
  directives: DirectiveNode[];
  selectionSet: SelectionSetNode;
}

export type OperationTypeNode = "query" | "mutation" | "subscription";

export interface VariableDefinitionNode {
  kind: "VariableDefinition";
  loc?: Location;
  variable: VariableNode;
  type: TypeNode;
  defaultValue: ValueNode;
  directives: DirectiveNode[];
}

export interface VariableNode {
  kind: "Variable";
  loc?: Location;
  name: NameNode;
}

export interface SelectionSetNode {
  kind: "SelectionSet";
  loc?: Location;
  selections: SelectionNode[];
}

export type SelectionNode = FieldNode | FragmentSpreadNode | InlineFragmentNode;

export interface FieldNode {
  kind: "Field";
  loc?: Location;
  alias?: NameNode;
  name: NameNode;
  arguments: ArgumentNode[];
  directives: DirectiveNode[];
  selectionSet: SelectionSetNode;
}

export interface ArgumentNode {
  kind: "Argument";
  loc?: Location;
  name: NameNode;
  value: ValueNode;
}

// Fragments

export interface FragmentSpreadNode {
  kind: "FragmentSpread";
  loc?: Location;
  name: NameNode;
  directives: DirectiveNode[];
}

export interface InlineFragmentNode {
  kind: "InlineFragment";
  loc?: Location;
  typeCondition: NamedTypeNode;
  directives: DirectiveNode[];
  selectionSet: SelectionSetNode;
}

export interface FragmentDefinitionNode {
  kind: "FragmentDefinition";
  loc?: Location;
  name: NameNode;
  // Note: fragment variable definitions are experimental and may be changed
  // or removed in the future.
  variableDefinitions: VariableDefinitionNode[];
  typeCondition: NamedTypeNode;
  directives: DirectiveNode[];
  selectionSet: SelectionSetNode;
}

// Values

export type ValueNode =
  | VariableNode
  | IntValueNode
  | FloatValueNode
  | StringValueNode
  | BooleanValueNode
  | NullValueNode
  | EnumValueNode
  | ListValueNode
  | ObjectValueNode;

export interface IntValueNode {
  kind: "IntValue";
  loc?: Location;
  value: string;
}

export interface FloatValueNode {
  kind: "FloatValue";
  loc?: Location;
  value: string;
}

export interface StringValueNode {
  kind: "StringValue";
  loc?: Location;
  value: string;
  block?: boolean;
}

export interface BooleanValueNode {
  kind: "BooleanValue";
  loc?: Location;
  value: boolean;
}

export interface NullValueNode {
  kind: "NullValue";
  loc?: Location;
}

export interface EnumValueNode {
  kind: "EnumValue";
  loc?: Location;
  value: string;
}

export interface ListValueNode {
  kind: "ListValue";
  loc?: Location;
  values: ValueNode[];
}

export interface ObjectValueNode {
  kind: "ObjectValue";
  loc?: Location;
  fields: ObjectFieldNode[];
}

export interface ObjectFieldNode {
  kind: "ObjectField";
  loc?: Location;
  name: NameNode;
  value: ValueNode;
}

// Directives

export interface DirectiveNode {
  kind: "Directive";
  loc?: Location;
  name: NameNode;
  arguments: ArgumentNode[];
}

// Type Reference

export type TypeNode = NamedTypeNode | ListTypeNode | NonNullTypeNode;

export interface NamedTypeNode {
  kind: "NamedType";
  loc?: Location;
  name: NameNode;
}

export interface ListTypeNode {
  kind: "ListType";
  loc?: Location;
  type: TypeNode;
}

export interface NonNullTypeNode {
  kind: "NonNullType";
  loc?: Location;
  type: NamedTypeNode | ListTypeNode;
}

// Type System Definition

export type TypeSystemDefinitionNode =
  | SchemaDefinitionNode
  | TypeDefinitionNode
  | DirectiveDefinitionNode;

export interface SchemaDefinitionNode {
  kind: "SchemaDefinition";
  loc?: Location;
  description?: StringValueNode;
  directives: DirectiveNode[];
  operationTypes: OperationTypeDefinitionNode[];
}

export interface OperationTypeDefinitionNode {
  kind: "OperationTypeDefinition";
  loc?: Location;
  operation: OperationTypeNode;
  type: NamedTypeNode;
}

// Type Definition

export type TypeDefinitionNode =
  | ScalarTypeDefinitionNode
  | ObjectTypeDefinitionNode
  | InterfaceTypeDefinitionNode
  | UnionTypeDefinitionNode
  | EnumTypeDefinitionNode
  | InputObjectTypeDefinitionNode;

export interface ScalarTypeDefinitionNode {
  kind: "ScalarTypeDefinition";
  loc?: Location;
  description?: StringValueNode;
  name: NameNode;
  directives: DirectiveNode[];
}

export interface ObjectTypeDefinitionNode {
  kind: "ObjectTypeDefinition";
  loc?: Location;
  description?: StringValueNode;
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveNode[];
  fields: FieldDefinitionNode[];
}

export interface FieldDefinitionNode {
  kind: "FieldDefinition";
  loc?: Location;
  description?: StringValueNode;
  name: NameNode;
  arguments: InputValueDefinitionNode[];
  type: TypeNode;
  directives: DirectiveNode[];
}

export interface InputValueDefinitionNode {
  kind: "InputValueDefinition";
  loc?: Location;
  description?: StringValueNode;
  name: NameNode;
  type: TypeNode;
  defaultValue?: ValueNode;
  directives: DirectiveNode[];
}

export interface InterfaceTypeDefinitionNode {
  kind: "InterfaceTypeDefinition";
  loc?: Location;
  description?: StringValueNode;
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveNode[];
  fields: FieldDefinitionNode[];
}

export interface UnionTypeDefinitionNode {
  kind: "UnionTypeDefinition";
  loc?: Location;
  description?: StringValueNode;
  name: NameNode;
  directives: DirectiveNode[];
  types?: NamedTypeNode[];
}

export interface EnumTypeDefinitionNode {
  kind: "EnumTypeDefinition";
  loc?: Location;
  description?: StringValueNode;
  name: NameNode;
  directives: DirectiveNode[];
  values: EnumValueDefinitionNode[];
}

export interface EnumValueDefinitionNode {
  kind: "EnumValueDefinition";
  loc?: Location;
  description?: StringValueNode;
  name: NameNode;
  directives: DirectiveNode[];
}

export interface InputObjectTypeDefinitionNode {
  kind: "InputObjectTypeDefinition";
  loc?: Location;
  description?: StringValueNode;
  name: NameNode;
  directives: DirectiveNode[];
  fields: InputValueDefinitionNode[];
}

// Directive Definitions

export interface DirectiveDefinitionNode {
  kind: "DirectiveDefinition";
  loc?: Location;
  description?: StringValueNode;
  name: NameNode;
  arguments: InputValueDefinitionNode[];
  repeatable: boolean;
  locations: NameNode[];
}

// Type System Extensions

export type TypeSystemExtensionNode = SchemaExtensionNode | TypeExtensionNode;

export type SchemaExtensionNode = {
  kind: "SchemaExtension";
  loc?: Location;
  directives: DirectiveNode[];
  operationTypes: OperationTypeDefinitionNode[];
};

// Type Extensions

export type TypeExtensionNode =
  | ScalarTypeExtensionNode
  | ObjectTypeExtensionNode
  | InterfaceTypeExtensionNode
  | UnionTypeExtensionNode
  | EnumTypeExtensionNode
  | InputObjectTypeExtensionNode;

export interface ScalarTypeExtensionNode {
  kind: "ScalarTypeExtension";
  loc?: Location;
  name: NameNode;
  directives: DirectiveNode[];
}

export interface ObjectTypeExtensionNode {
  kind: "ObjectTypeExtension";
  loc?: Location;
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveNode[];
  fields: FieldDefinitionNode[];
}

export interface InterfaceTypeExtensionNode {
  kind: "InterfaceTypeExtension";
  loc?: Location;
  name: NameNode;
  interfaces: NamedTypeNode[];
  directives: DirectiveNode[];
  fields: FieldDefinitionNode[];
}

export interface UnionTypeExtensionNode {
  kind: "UnionTypeExtension";
  loc?: Location;
  name: NameNode;
  directives: DirectiveNode[];
  types: NamedTypeNode[];
}

export interface EnumTypeExtensionNode {
  kind: "EnumTypeExtension";
  loc?: Location;
  name: NameNode;
  directives: DirectiveNode[];
  values: EnumValueDefinitionNode[];
}

export interface InputObjectTypeExtensionNode {
  kind: "InputObjectTypeExtension";
  loc?: Location;
  name: NameNode;
  directives: DirectiveNode[];
  fields: InputValueDefinitionNode[];
}
