import { SYMBOL_TO_STRING_TAG } from '../polyfills/symbols.ts';

import Maybe from '../tsutils/Maybe.ts';

import inspect from '../jsutils/inspect.ts';
import keyMap from '../jsutils/keyMap.ts';
import mapValue from '../jsutils/mapValue.ts';
import toObjMap from '../jsutils/toObjMap.ts';
import { Path } from '../jsutils/Path.ts';
import devAssert from '../jsutils/devAssert.ts';
import keyValMap from '../jsutils/keyValMap.ts';
import instanceOf from '../jsutils/instanceOf.ts';
import didYouMean from '../jsutils/didYouMean.ts';
import isObjectLike from '../jsutils/isObjectLike.ts';
import identityFunc from '../jsutils/identityFunc.ts';
import defineInspect from '../jsutils/defineInspect.ts';
import suggestionList from '../jsutils/suggestionList.ts';
import { PromiseOrValue } from '../jsutils/PromiseOrValue.ts';
import {
ObjMap,
ReadOnlyObjMap,
ReadOnlyObjMapLike,
} from '../jsutils/ObjMap.ts';

import { Kind } from '../language/kinds.ts';
import { print } from '../language/printer.ts';
import {
ScalarTypeDefinitionNode,
ObjectTypeDefinitionNode,
FieldDefinitionNode,
InputValueDefinitionNode,
InterfaceTypeDefinitionNode,
UnionTypeDefinitionNode,
EnumTypeDefinitionNode,
EnumValueDefinitionNode,
InputObjectTypeDefinitionNode,
ScalarTypeExtensionNode,
ObjectTypeExtensionNode,
InterfaceTypeExtensionNode,
UnionTypeExtensionNode,
EnumTypeExtensionNode,
InputObjectTypeExtensionNode,
OperationDefinitionNode,
FieldNode,
FragmentDefinitionNode,
ValueNode,
} from '../language/ast.ts';

import { GraphQLError } from '../error/GraphQLError.ts';

import { valueFromASTUntyped } from '../utilities/valueFromASTUntyped.ts';

import { GraphQLSchema } from './schema.ts';


/**
 * List Modifier
 *
 * A list is a kind of type marker, a wrapping type which points to another
 * type. Lists are often created within the context of defining the fields
 * of an object type.
 *
 * Example:
 *
 *     const PersonType = new GraphQLObjectType({
 *       name: 'Person',
 *       fields: () => ({
 *         parents: { type: new GraphQLList(Person) },
 *         children: { type: new GraphQLList(Person) },
 *       })
 *     })
 *
 */
interface GraphQLList<T extends GraphQLType> {
  readonly ofType: T;
  toString: () => string;
  toJSON: () => string;
  inspect: () => string;
}

interface _GraphQLList<T extends GraphQLType> {
  (type: T): GraphQLList<T>;
  new (type: T): GraphQLList<T>;
}

/**
 * Non-Null Modifier
 *
 * A non-null is a kind of type marker, a wrapping type which points to another
 * type. Non-null types enforce that their values are never null and can ensure
 * an error is raised if this ever occurs during a request. It is useful for
 * fields which you can make a strong guarantee on non-nullability, for example
 * usually the id field of a database row will never be null.
 *
 * Example:
 *
 *     const RowType = new GraphQLObjectType({
 *       name: 'Row',
 *       fields: () => ({
 *         id: { type: new GraphQLNonNull(GraphQLString) },
 *       })
 *     })
 *
 * Note: the enforcement of non-nullability occurs within the executor.
 */
interface GraphQLNonNull<T extends GraphQLNullableType> {
  readonly ofType: T;
  toString: () => string;
  toJSON: () => string;
  inspect: () => string;
}

interface _GraphQLNonNull<T extends GraphQLNullableType> {
  (type: T): GraphQLNonNull<T>;
  new (type: T): GraphQLNonNull<T>;
}

// Predicates & Assertions

/**
 * These are all of the possible kinds of types.
 */
export type GraphQLType =
| GraphQLScalarType
| GraphQLObjectType
| GraphQLInterfaceType
| GraphQLUnionType
| GraphQLEnumType
| GraphQLInputObjectType
| GraphQLList<any>
| GraphQLNonNull<any>;

export function isType(type: any): type is GraphQLType {
  return (
    isScalarType(type) ||
    isObjectType(type) ||
    isInterfaceType(type) ||
    isUnionType(type) ||
    isEnumType(type) ||
    isInputObjectType(type) ||
    isListType(type) ||
    isNonNullType(type)
  );
}

export function assertType(type: any): GraphQLType {
  if (!isType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL type.`);
  }
  return type;
}

export function isScalarType(type: any): type is GraphQLScalarType {
  return instanceOf(type, GraphQLScalarType);
}

export function assertScalarType(type: any): GraphQLScalarType {
  if (!isScalarType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL Scalar type.`);
  }
  return type;
}

export function isObjectType(type: any): type is GraphQLObjectType {
  return instanceOf(type, GraphQLObjectType);
}

export function assertObjectType(type: any): GraphQLObjectType {
  if (!isObjectType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL Object type.`);
  }
  return type;
}

export function isInterfaceType(type: any): type is GraphQLInterfaceType {
  return instanceOf(type, GraphQLInterfaceType);
}

export function assertInterfaceType(type: any): GraphQLInterfaceType {
  if (!isInterfaceType(type)) {
    throw new Error(
      `Expected ${inspect(type)} to be a GraphQL Interface type.`,
    );
  }
  return type;
}

export function isUnionType(type: any): type is GraphQLUnionType {
  return instanceOf(type, GraphQLUnionType);
}

export function assertUnionType(type: any): GraphQLUnionType {
  if (!isUnionType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL Union type.`);
  }
  return type;
}

export function isEnumType(type: any): type is GraphQLEnumType {
  return instanceOf(type, GraphQLEnumType);
}

export function assertEnumType(type: any): GraphQLEnumType {
  if (!isEnumType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL Enum type.`);
  }
  return type;
}

export function isInputObjectType(type: any): type is GraphQLInputObjectType {
  return instanceOf(type, GraphQLInputObjectType);
}

export function assertInputObjectType(type: any): GraphQLInputObjectType {
  if (!isInputObjectType(type)) {
    throw new Error(
      `Expected ${inspect(type)} to be a GraphQL Input Object type.`,
    );
  }
  return type;
}

export function isListType(type: any): type is GraphQLList<any> {
  return instanceOf(type, GraphQLList);
}

export function assertListType(type: any): GraphQLList<any> {
  if (!isListType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL List type.`);
  }
  return type;
}

export function isNonNullType(type: any): type is GraphQLNonNull<any> {
  return instanceOf(type, GraphQLNonNull);
}

export function assertNonNullType(type: any): GraphQLNonNull<any> {
  if (!isNonNullType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL Non-Null type.`);
  }
  return type;
}

/**
 * These types may be used as input types for arguments and directives.
 */
export type GraphQLInputType =
  | GraphQLScalarType
  | GraphQLEnumType
  | GraphQLInputObjectType
  | GraphQLList<GraphQLInputType>
  | GraphQLNonNull<
      | GraphQLScalarType
      | GraphQLEnumType
      | GraphQLInputObjectType
      | GraphQLList<GraphQLInputType>
    >;

    export function isInputType(type: any): type is GraphQLInputType {
    return (
    isScalarType(type) ||
    isEnumType(type) ||
    isInputObjectType(type) ||
    (isWrappingType(type) && isInputType(type.ofType))
  );
}

export function assertInputType(type: any): GraphQLInputType {
  if (!isInputType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL input type.`);
  }
  return type;
}

/**
 * These types may be used as output types as the result of fields.
 */
export type GraphQLOutputType =
  | GraphQLScalarType
  | GraphQLObjectType
  | GraphQLInterfaceType
  | GraphQLUnionType
  | GraphQLEnumType
  | GraphQLList<GraphQLOutputType>
  | GraphQLNonNull<
      | GraphQLScalarType
      | GraphQLObjectType
      | GraphQLInterfaceType
      | GraphQLUnionType
      | GraphQLEnumType
      | GraphQLList<GraphQLOutputType>
    >;

export function isOutputType(type: any): type is GraphQLOutputType {
    return (
    isScalarType(type) ||
    isObjectType(type) ||
    isInterfaceType(type) ||
    isUnionType(type) ||
    isEnumType(type) ||
    (isWrappingType(type) && isOutputType(type.ofType))
  );
}

export function assertOutputType(type: any): GraphQLOutputType {
  if (!isOutputType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL output type.`);
  }
  return type;
}

/**
 * These types may describe types which may be leaf values.
 */
export type GraphQLLeafType = GraphQLScalarType | GraphQLEnumType;

export function isLeafType(type: any): type is GraphQLLeafType {
  return isScalarType(type) || isEnumType(type);
}

export function assertLeafType(type: any): GraphQLLeafType {
  if (!isLeafType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL leaf type.`);
  }
  return type;
}

/**
 * These types may describe the parent context of a selection set.
 */
export type GraphQLCompositeType =
  | GraphQLObjectType
  | GraphQLInterfaceType
  | GraphQLUnionType;

export function isCompositeType(type: any): type is GraphQLCompositeType {
  return isObjectType(type) || isInterfaceType(type) || isUnionType(type);
}

export function assertCompositeType(type: any): GraphQLCompositeType {
  if (!isCompositeType(type)) {
    throw new Error(
      `Expected ${inspect(type)} to be a GraphQL composite type.`,
    );
  }
  return type;
}

/**
 * These types may describe the parent context of a selection set.
 */
export type GraphQLAbstractType = GraphQLInterfaceType | GraphQLUnionType;

export function isAbstractType(type: any): type is GraphQLAbstractType {
  return isInterfaceType(type) || isUnionType(type);
}

export function assertAbstractType(type: any): GraphQLAbstractType {
  if (!isAbstractType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL abstract type.`);
  }
  return type;
}

/**
 * List Type Wrapper
 *
 * A list is a wrapping type which points to another type.
 * Lists are often created within the context of defining the fields of
 * an object type.
 *
 * Example:
 *
 *     const PersonType = new GraphQLObjectType({
 *       name: 'Person',
 *       fields: () => ({
 *         parents: { type: GraphQLList(PersonType) },
 *         children: { type: GraphQLList(PersonType) },
 *       })
 *     })
 *
 */
// FIXME: workaround to fix issue with Babel parser
/* ::
declare class GraphQLList<+T: GraphQLType> {
  +ofType: T;
  static <T>(ofType: T): GraphQLList<T>;
  // Note: constructors cannot be used for covariant types. Drop the "new".
  constructor(ofType: GraphQLType): void;
}
*/

export const GraphQLList = function <T extends GraphQLType>(ofType: T) {
  if (this instanceof GraphQLList) {
    this.ofType = assertType(ofType);
  } else {
    return new GraphQLList(ofType);
  }
}

// Need to cast through any to alter the prototype.
GraphQLList.prototype.toString = function toString() {
  return '[' + String(this.ofType) + ']';
};

GraphQLList.prototype.toJSON = function toJSON() {
  return this.toString();
};

Object.defineProperty(GraphQLList.prototype, SYMBOL_TO_STRING_TAG, {
  get() {
    return 'GraphQLList';
  },
});

// Print a simplified form when appearing in `inspect` and `util.inspect`.
defineInspect(GraphQLList);

/**
 * Non-Null Type Wrapper
 *
 * A non-null is a wrapping type which points to another type.
 * Non-null types enforce that their values are never null and can ensure
 * an error is raised if this ever occurs during a request. It is useful for
 * fields which you can make a strong guarantee on non-nullability, for example
 * usually the id field of a database row will never be null.
 *
 * Example:
 *
 *     const RowType = new GraphQLObjectType({
 *       name: 'Row',
 *       fields: () => ({
 *         id: { type: GraphQLNonNull(GraphQLString) },
 *       })
 *     })
 *
 * Note: the enforcement of non-nullability occurs within the executor.
 */
// FIXME: workaround to fix issue with Babel parser
/* ::
declare class GraphQLNonNull<+T: GraphQLNullableType> {
  +ofType: T;
  static <T>(ofType: T): GraphQLNonNull<T>;
  // Note: constructors cannot be used for covariant types. Drop the "new".
  constructor(ofType: GraphQLType): void;
}
*/

export function GraphQLNonNull(ofType) {
  if (this instanceof GraphQLNonNull) {
    this.ofType = assertNullableType(ofType);
  } else {
    return new GraphQLNonNull(ofType);
  }
}

// Need to cast through any to alter the prototype.
GraphQLNonNull.prototype.toString = function toString() {
  return String(this.ofType) + '!';
};

GraphQLNonNull.prototype.toJSON = function toJSON() {
  return this.toString();
};

Object.defineProperty(GraphQLNonNull.prototype, SYMBOL_TO_STRING_TAG, {
  get() {
    return 'GraphQLNonNull';
  },
});

// Print a simplified form when appearing in `inspect` and `util.inspect`.
defineInspect(GraphQLNonNull);

/**
 * These types wrap and modify other types
 */

export type GraphQLWrappingType = GraphQLList<any> | GraphQLNonNull<any>;

export function isWrappingType(type: any): type is GraphQLWrappingType {
  return isListType(type) || isNonNullType(type);
}

export function assertWrappingType(type: any): GraphQLWrappingType {
  if (!isWrappingType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL wrapping type.`);
  }
  return type;
}

/**
 * These types can all accept null as a value.
 */
export type GraphQLNullableType =
  | GraphQLScalarType
  | GraphQLObjectType
  | GraphQLInterfaceType
  | GraphQLUnionType
  | GraphQLEnumType
  | GraphQLInputObjectType
  | GraphQLList<any>;

export function isNullableType(type: any): type is GraphQLWrappingType {
  return isType(type) && !isNonNullType(type);
}

export function assertNullableType(type: any): GraphQLNullableType {
  if (!isNullableType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL nullable type.`);
  }
  return type;
}

export function getNullableType(type: undefined | null): undefined;
export function getNullableType<T extends GraphQLNullableType>(type: T): T;
export function getNullableType<T extends GraphQLNullableType>(
  type: GraphQLNonNull<T>,
): T;
export function getNullableType(type: any) {
  if (type) {
    return isNonNullType(type) ? type.ofType : type;
  }
}

/**
 * These named types do not include modifiers like List or NonNull.
 */
export type GraphQLNamedType =
  | GraphQLScalarType
  | GraphQLObjectType
  | GraphQLInterfaceType
  | GraphQLUnionType
  | GraphQLEnumType
  | GraphQLInputObjectType;

export function isNamedType(type: any): type is GraphQLNamedType {
  return (
    isScalarType(type) ||
    isObjectType(type) ||
    isInterfaceType(type) ||
    isUnionType(type) ||
    isEnumType(type) ||
    isInputObjectType(type)
  );
}

export function assertNamedType(type: any): GraphQLNamedType {
  if (!isNamedType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL named type.`);
  }
  return type;
}

export function getNamedType(type: undefined | null | GraphQLType) {
  if (type) {
    let unwrappedType = type;
    while (isWrappingType(unwrappedType)) {
      unwrappedType = unwrappedType.ofType;
    }
    return unwrappedType;
  }
}

/**
 * Used while defining GraphQL types to allow for circular references in
 * otherwise immutable type definitions.
 */
export type Thunk<T> = (() => T) | T;

function resolveThunk<T>(thunk: Thunk<T>): T {
  return typeof thunk === 'function' ? (thunk as Function)() : thunk;
}

function undefineIfEmpty<T>(arr: Maybe<ReadonlyArray<T>>): Maybe<ReadonlyArray<T>> {
  return arr && arr.length > 0 ? arr : undefined;
}

/**
 * Scalar Type Definition
 *
 * The leaf values of any request and input values to arguments are
 * Scalars (or Enums) and are defined with a name and a series of functions
 * used to parse input from ast or variables and to ensure validity.
 *
 * If a type's serialize function does not return a value (i.e. it returns
 * `undefined`) then an error will be raised and a `null` value will be returned
 * in the response. If the serialize function returns `null`, then no error will
 * be included in the response.
 *
 * Example:
 *
 *     const OddType = new GraphQLScalarType({
 *       name: 'Odd',
 *       serialize(value) {
 *         if (value % 2 === 1) {
 *           return value;
 *         }
 *       }
 *     });
 *
 */
export class GraphQLScalarType {
  name: string;
  description: Maybe<string>;
  specifiedByUrl: Maybe<string>;
  serialize: GraphQLScalarSerializer<any>;
  parseValue: GraphQLScalarValueParser<any>;
  parseLiteral: GraphQLScalarLiteralParser<any>;
  extensions: Maybe<ReadOnlyObjMap<any>>;
  astNode: Maybe<ScalarTypeDefinitionNode>;
  extensionASTNodes: Maybe<ReadonlyArray<ScalarTypeExtensionNode>>;

  constructor(config: Readonly<GraphQLScalarTypeConfig<any, any>>) {
    const parseValue = config.parseValue ?? identityFunc;
    this.name = config.name;
    this.description = config.description;
    this.specifiedByUrl = config.specifiedByUrl;
    this.serialize = config.serialize ?? identityFunc;
    this.parseValue = parseValue;
    this.parseLiteral =
      config.parseLiteral ?? ((node) => parseValue(valueFromASTUntyped(node)));
    this.extensions = config.extensions && toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = undefineIfEmpty(config.extensionASTNodes);

    devAssert(typeof config.name === 'string', 'Must provide name.');

    devAssert(
      config.specifiedByUrl == null ||
        typeof config.specifiedByUrl === 'string',
      `${this.name} must provide "specifiedByUrl" as a string, ` +
        `but got: ${inspect(config.specifiedByUrl)}.`,
    );

    devAssert(
      config.serialize == null || typeof config.serialize === 'function',
      `${this.name} must provide "serialize" function. If this custom Scalar is also used as an input type, ensure "parseValue" and "parseLiteral" functions are also provided.`,
    );

    if (config.parseLiteral) {
      devAssert(
        typeof config.parseValue === 'function' &&
          typeof config.parseLiteral === 'function',
        `${this.name} must provide both "parseValue" and "parseLiteral" functions.`,
      );
    }
  }

  toConfig(): GraphQLScalarTypeConfig<any, any> & {
    specifiedByUrl: Maybe<string>;
    serialize: GraphQLScalarSerializer<any>;
    parseValue: GraphQLScalarValueParser<any>;
    parseLiteral: GraphQLScalarLiteralParser<any>;
    extensions: Maybe<Readonly<Record<string, any>>>;
    extensionASTNodes: ReadonlyArray<ScalarTypeExtensionNode>;
  } {
    return {
      name: this.name,
      description: this.description,
      specifiedByUrl: this.specifiedByUrl,
      serialize: this.serialize,
      parseValue: this.parseValue,
      parseLiteral: this.parseLiteral,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes ?? [],
    };
  }

  toString(): string {
    return this.name;
  }

  toJSON(): string {
    return this.toString();
  }

  // $FlowFixMe Flow doesn't support computed properties yet
  get [SYMBOL_TO_STRING_TAG]() {
    return 'GraphQLScalarType';
  }
}

// Print a simplified form when appearing in `inspect` and `util.inspect`.
defineInspect(GraphQLScalarType);

export type GraphQLScalarSerializer<TExternal> = (
  outputValue: any,
) => Maybe<TExternal>;

export type GraphQLScalarValueParser<TInternal> = (
  inputValue: any,
) => Maybe<TInternal>;

export type GraphQLScalarLiteralParser<TInternal> = (
  valueNode: ValueNode,
  variables: Maybe<ObjMap<any>>,
) => Maybe<TInternal>;

export type GraphQLScalarTypeConfig<TInternal, TExternal> = {
  name: string;
  description?: Maybe<string>;
  specifiedByUrl?: Maybe<string>;
  // Serializes an internal value to include in a response.
  serialize: GraphQLScalarSerializer<TExternal>;
  // Parses an externally provided value to use as an input.
  parseValue?: GraphQLScalarValueParser<TInternal>;
  // Parses an externally provided literal value to use as an input.
  parseLiteral?: GraphQLScalarLiteralParser<TInternal>;
  extensions?: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<ScalarTypeDefinitionNode>;
  extensionASTNodes?: Maybe<ReadonlyArray<ScalarTypeExtensionNode>>;
};

/**
 * Object Type Definition
 *
 * Almost all of the GraphQL types you define will be object types. Object types
 * have a name, but most importantly describe their fields.
 *
 * Example:
 *
 *     const AddressType = new GraphQLObjectType({
 *       name: 'Address',
 *       fields: {
 *         street: { type: GraphQLString },
 *         number: { type: GraphQLInt },
 *         formatted: {
 *           type: GraphQLString,
 *           resolve(obj) {
 *             return obj.number + ' ' + obj.street
 *           }
 *         }
 *       }
 *     });
 *
 * When two types need to refer to each other, or a type needs to refer to
 * itself in a field, you can use a function expression (aka a closure or a
 * thunk) to supply the fields lazily.
 *
 * Example:
 *
 *     const PersonType = new GraphQLObjectType({
 *       name: 'Person',
 *       fields: () => ({
 *         name: { type: GraphQLString },
 *         bestFriend: { type: PersonType },
 *       })
 *     });
 *
 */
export class GraphQLObjectType {
  name: string;
  description: Maybe<string>;
  isTypeOf: Maybe<GraphQLIsTypeOfFn<any, any>>;
  extensions: Maybe<ReadOnlyObjMap<any>>;
  astNode: Maybe<ObjectTypeDefinitionNode>;
  extensionASTNodes: Maybe<ReadonlyArray<ObjectTypeExtensionNode>>;

  _fields: Thunk<GraphQLFieldMap<any, any>>;
  _interfaces: Thunk<Array<GraphQLInterfaceType>>;

  constructor(config: Readonly<GraphQLObjectTypeConfig<any, any>>) {
    this.name = config.name;
    this.description = config.description;
    this.isTypeOf = config.isTypeOf;
    this.extensions = config.extensions && toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = undefineIfEmpty(config.extensionASTNodes);

    this._fields = defineFieldMap.bind(undefined, config);
    this._interfaces = defineInterfaces.bind(undefined, config);
    devAssert(typeof config.name === 'string', 'Must provide name.');
    devAssert(
      config.isTypeOf == null || typeof config.isTypeOf === 'function',
      `${this.name} must provide "isTypeOf" as a function, ` +
        `but got: ${inspect(config.isTypeOf)}.`,
    );
  }

  getFields(): GraphQLFieldMap<any, any> {
    if (typeof this._fields === 'function') {
      this._fields = this._fields();
    }
    return this._fields;
  }

  getInterfaces(): Array<GraphQLInterfaceType> {
    if (typeof this._interfaces === 'function') {
      this._interfaces = this._interfaces();
    }
    return this._interfaces;
  }

  toConfig(): GraphQLObjectTypeConfig<any, any> & {
    interfaces: Array<GraphQLInterfaceType>;
    fields: GraphQLFieldConfigMap<any, any>;
    extensions: Maybe<Readonly<Record<string, any>>>;
    extensionASTNodes: ReadonlyArray<ObjectTypeExtensionNode>;
  } {
    return {
      name: this.name,
      description: this.description,
      interfaces: this.getInterfaces(),
      fields: fieldsToFieldsConfig(this.getFields()),
      isTypeOf: this.isTypeOf,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes || [],
    };
  }

  toString(): string {
    return this.name;
  }

  toJSON(): string {
    return this.toString();
  }

  // $FlowFixMe Flow doesn't support computed properties yet
  get [SYMBOL_TO_STRING_TAG]() {
    return 'GraphQLObjectType';
  }
}

// Print a simplified form when appearing in `inspect` and `util.inspect`.
defineInspect(GraphQLObjectType);

function defineInterfaces(
  config: Readonly<
    | GraphQLObjectTypeConfig<any, any>
    | GraphQLInterfaceTypeConfig<any, any>
  >,
): Array<GraphQLInterfaceType> {
  const interfaces = resolveThunk(config.interfaces) ?? [];
  devAssert(
    Array.isArray(interfaces),
    `${config.name} interfaces must be an Array or a function which returns an Array.`,
  );
  return interfaces;
}

function defineFieldMap<TSource, TContext>(
  config: Readonly<
    | GraphQLObjectTypeConfig<TSource, TContext>
    | GraphQLInterfaceTypeConfig<TSource, TContext>
  >,
): GraphQLFieldMap<TSource, TContext> {
  const fieldMap = resolveThunk(config.fields);
  devAssert(
    isPlainObj(fieldMap),
    `${config.name} fields must be an object with field names as keys or a function which returns such an object.`,
  );

  return mapValue(fieldMap, (fieldConfig: GraphQLFieldConfig<any, any>, fieldName) => {
    devAssert(
      isPlainObj(fieldConfig),
      `${config.name}.${fieldName} field config must be an object.`,
    );
    devAssert(
      !('isDeprecated' in fieldConfig),
      `${config.name}.${fieldName} should provide "deprecationReason" instead of "isDeprecated".`,
    );
    devAssert(
      fieldConfig.resolve == null || typeof fieldConfig.resolve === 'function',
      `${config.name}.${fieldName} field resolver must be a function if ` +
        `provided, but got: ${inspect(fieldConfig.resolve)}.`,
    );

    const argsConfig = fieldConfig.args ?? {};
    devAssert(
      isPlainObj(argsConfig),
      `${config.name}.${fieldName} args must be an object with argument names as keys.`,
    );

    const args = Object.entries(argsConfig).map(([argName, argConfig]) => ({
      name: argName,
      description: argConfig.description,
      type: argConfig.type,
      defaultValue: argConfig.defaultValue,
      extensions: argConfig.extensions && toObjMap(argConfig.extensions),
      astNode: argConfig.astNode,
    }));

    return {
      name: fieldName,
      description: fieldConfig.description,
      type: fieldConfig.type,
      args,
      resolve: fieldConfig.resolve,
      subscribe: fieldConfig.subscribe,
      isDeprecated: fieldConfig.deprecationReason != null,
      deprecationReason: fieldConfig.deprecationReason,
      extensions: fieldConfig.extensions && toObjMap(fieldConfig.extensions),
      astNode: fieldConfig.astNode,
    };
  });
}

function isPlainObj(obj: any) {
  return isObjectLike(obj) && !Array.isArray(obj);
}

function fieldsToFieldsConfig(fields: ObjMap<GraphQLField<any, any>>) {
  return mapValue(fields, (field) => ({
    description: field.description,
    type: field.type,
    args: argsToArgsConfig(field.args),
    resolve: field.resolve,
    subscribe: field.subscribe,
    deprecationReason: field.deprecationReason,
    extensions: field.extensions,
    astNode: field.astNode,
  }));
}

/**
 * @internal
 */
export function argsToArgsConfig(
  args: ReadonlyArray<GraphQLArgument>,
): GraphQLFieldConfigArgumentMap {
  return keyValMap(
    args,
    (arg) => arg.name,
    (arg) => ({
      description: arg.description,
      type: arg.type,
      defaultValue: arg.defaultValue,
      extensions: arg.extensions,
      astNode: arg.astNode,
    }),
  );
}

export type GraphQLIsTypeOfFn<TSource, TContext> = (
  source: TSource,
  context: TContext,
  info: GraphQLResolveInfo,
) => PromiseOrValue<boolean>;

export type GraphQLTypeResolver<TSource, TContext> = (
  value: TSource,
  context: TContext,
  info: GraphQLResolveInfo,
  abstractType: GraphQLAbstractType,
) => PromiseOrValue<Maybe<GraphQLObjectType<TSource, TContext> | string>>;

export interface GraphQLObjectTypeConfig<TSource, TContext> {
  name: string;
  description?: Maybe<string>;
  interfaces?: Thunk<Maybe<Array<GraphQLInterfaceType>>>;
  fields: Thunk<GraphQLFieldConfigMap<TSource, TContext>>;
  isTypeOf?: Maybe<GraphQLIsTypeOfFn<TSource, TContext>>;
  extensions?: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<ObjectTypeDefinitionNode>;
  extensionASTNodes?: Maybe<ReadonlyArray<ObjectTypeExtensionNode>>;
}

export interface GraphQLResolveInfo {
  readonly fieldName: string;
  readonly fieldNodes: ReadonlyArray<FieldNode>;
  readonly returnType: GraphQLOutputType;
  readonly parentType: GraphQLObjectType;
  readonly path: Path;
  readonly schema: GraphQLSchema;
  readonly fragments: { [key: string]: FragmentDefinitionNode };
  readonly rootValue: any;
  readonly operation: OperationDefinitionNode;
  readonly variableValues: { [variableName: string]: any };
}

export interface GraphQLFieldConfig<
  TSource,
  TContext,
  TArgs = { [argName: string]: any }
> {
  description?: Maybe<string>;
  type: GraphQLOutputType;
  args?: GraphQLFieldConfigArgumentMap;
  resolve?: GraphQLFieldResolver<TSource, TContext, TArgs>;
  subscribe?: GraphQLFieldResolver<TSource, TContext, TArgs>;
  deprecationReason?: Maybe<string>;
  extensions?: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<FieldDefinitionNode>;
}

export type GraphQLFieldResolver<
  TSource,
  TContext,
  TArgs = { [argName: string]: any }
> = (
  source: TSource,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => any;

export type GraphQLFieldConfigArgumentMap = ObjMap<GraphQLArgumentConfig>;

export interface GraphQLArgumentConfig {
  description: Maybe<string>;
  type: GraphQLInputType;
  defaultValue?: any;
  extensions: Maybe<Readonly<Record<string, any>>>;
  astNode: Maybe<InputValueDefinitionNode>;
}

export type GraphQLFieldConfigMap<TSource, TContext> = ObjMap<
  GraphQLFieldConfig<TSource, TContext>
>;

export interface GraphQLField<
  TSource,
  TContext,
  TArgs = { [key: string]: any }
> {
  name: string;
  description: Maybe<string>;
  type: GraphQLOutputType;
  args: Array<GraphQLArgument>;
  resolve?: GraphQLFieldResolver<TSource, TContext, TArgs>;
  subscribe?: GraphQLFieldResolver<TSource, TContext, TArgs>;
  isDeprecated: boolean;
  deprecationReason: Maybe<string>;
  extensions: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<FieldDefinitionNode>;
}

export interface GraphQLArgument {
  name: string;
  description: Maybe<string>;
  type: GraphQLInputType;
  defaultValue: any;
  extensions: Maybe<Readonly<Record<string, any>>>;
  astNode: Maybe<InputValueDefinitionNode>;
}

export function isRequiredArgument(arg: GraphQLArgument): boolean {
  return isNonNullType(arg.type) && arg.defaultValue === undefined;
}

export type GraphQLFieldMap<TSource, TContext> = ObjMap<
  GraphQLField<TSource, TContext>
>;

/**
 * Interface Type Definition
 *
 * When a field can return one of a heterogeneous set of types, a Interface type
 * is used to describe what types are possible, what fields are in common across
 * all types, as well as a function to determine which type is actually used
 * when the field is resolved.
 *
 * Example:
 *
 *     const EntityType = new GraphQLInterfaceType({
 *       name: 'Entity',
 *       fields: {
 *         name: { type: GraphQLString }
 *       }
 *     });
 *
 */
export class GraphQLInterfaceType {
  name: string;
  description: Maybe<string>;
  resolveType: Maybe<GraphQLTypeResolver<any, any>>;
  extensions: Maybe<ReadOnlyObjMap<any>>;
  astNode: Maybe<InterfaceTypeDefinitionNode>;
  extensionASTNodes: Maybe<ReadonlyArray<InterfaceTypeExtensionNode>>;

  _fields: Thunk<GraphQLFieldMap<any, any>>;
  _interfaces: Thunk<Array<GraphQLInterfaceType>>;

  constructor(config: Readonly<GraphQLInterfaceTypeConfig<any, any>>) {
    this.name = config.name;
    this.description = config.description;
    this.resolveType = config.resolveType;
    this.extensions = config.extensions && toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = undefineIfEmpty(config.extensionASTNodes);

    this._fields = defineFieldMap.bind(undefined, config);
    this._interfaces = defineInterfaces.bind(undefined, config);
    devAssert(typeof config.name === 'string', 'Must provide name.');
    devAssert(
      config.resolveType == null || typeof config.resolveType === 'function',
      `${this.name} must provide "resolveType" as a function, ` +
        `but got: ${inspect(config.resolveType)}.`,
    );
  }

  getFields(): GraphQLFieldMap<any, any> {
    if (typeof this._fields === 'function') {
      this._fields = this._fields();
    }
    return this._fields;
  }

  getInterfaces(): Array<GraphQLInterfaceType> {
    if (typeof this._interfaces === 'function') {
      this._interfaces = this._interfaces();
    }
    return this._interfaces;
  }

  toConfig(): GraphQLInterfaceTypeConfig<any, any> & {
    interfaces: Array<GraphQLInterfaceType>;
    fields: GraphQLFieldConfigMap<any, any>;
    extensions: Maybe<Readonly<Record<string, any>>>;
    extensionASTNodes: ReadonlyArray<InterfaceTypeExtensionNode>;
  } {
    return {
      name: this.name,
      description: this.description,
      interfaces: this.getInterfaces(),
      fields: fieldsToFieldsConfig(this.getFields()),
      resolveType: this.resolveType,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes ?? [],
    };
  }

  toString(): string {
    return this.name;
  }

  toJSON(): string {
    return this.toString();
  }

  // $FlowFixMe Flow doesn't support computed properties yet
  get [SYMBOL_TO_STRING_TAG]() {
    return 'GraphQLInterfaceType';
  }
}

// Print a simplified form when appearing in `inspect` and `util.inspect`.
defineInspect(GraphQLInterfaceType);

export type GraphQLInterfaceTypeConfig<TSource, TContext> = {
  name: string;
  description?: Maybe<string>;
  interfaces?: Thunk<Maybe<Array<GraphQLInterfaceType>>>;
  fields: Thunk<GraphQLFieldConfigMap<TSource, TContext>>;
  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType?: Maybe<GraphQLTypeResolver<TSource, TContext>>;
  extensions?: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<InterfaceTypeDefinitionNode>;
  extensionASTNodes?: Maybe<ReadonlyArray<InterfaceTypeExtensionNode>>;
};

/**
 * Union Type Definition
 *
 * When a field can return one of a heterogeneous set of types, a Union type
 * is used to describe what types are possible as well as providing a function
 * to determine which type is actually used when the field is resolved.
 *
 * Example:
 *
 *     const PetType = new GraphQLUnionType({
 *       name: 'Pet',
 *       types: [ DogType, CatType ],
 *       resolveType(value) {
 *         if (value instanceof Dog) {
 *           return DogType;
 *         }
 *         if (value instanceof Cat) {
 *           return CatType;
 *         }
 *       }
 *     });
 *
 */
export class GraphQLUnionType {
  name: string;
  description: Maybe<string>;
  resolveType: Maybe<GraphQLTypeResolver<any, any>>;
  extensions: Maybe<ReadOnlyObjMap<any>>;
  astNode: Maybe<UnionTypeDefinitionNode>;
  extensionASTNodes: Maybe<ReadonlyArray<UnionTypeExtensionNode>>;

  _types: Thunk<Array<GraphQLObjectType>>;

  constructor(config: Readonly<GraphQLUnionTypeConfig<any, any>>) {
    this.name = config.name;
    this.description = config.description;
    this.resolveType = config.resolveType;
    this.extensions = config.extensions && toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = undefineIfEmpty(config.extensionASTNodes);

    this._types = defineTypes.bind(undefined, config);
    devAssert(typeof config.name === 'string', 'Must provide name.');
    devAssert(
      config.resolveType == null || typeof config.resolveType === 'function',
      `${this.name} must provide "resolveType" as a function, ` +
        `but got: ${inspect(config.resolveType)}.`,
    );
  }

  getTypes(): Array<GraphQLObjectType> {
    if (typeof this._types === 'function') {
      this._types = this._types();
    }
    return this._types;
  }

  toConfig(): GraphQLUnionTypeConfig<any, any> & {
    types: Array<GraphQLObjectType>;
    extensions: Maybe<Readonly<Record<string, any>>>;
    extensionASTNodes: ReadonlyArray<UnionTypeExtensionNode>;
  } {
    return {
      name: this.name,
      description: this.description,
      types: this.getTypes(),
      resolveType: this.resolveType,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes ?? [],
    };
  }

  toString(): string {
    return this.name;
  }

  toJSON(): string {
    return this.toString();
  }

  // $FlowFixMe Flow doesn't support computed properties yet
  get [SYMBOL_TO_STRING_TAG]() {
    return 'GraphQLUnionType';
  }
}

// Print a simplified form when appearing in `inspect` and `util.inspect`.
defineInspect(GraphQLUnionType);

function defineTypes(
  config: Readonly<GraphQLUnionTypeConfig<any, any>>,
): Array<GraphQLObjectType> {
  const types = resolveThunk(config.types);
  devAssert(
    Array.isArray(types),
    `Must provide Array of types or a function which returns such an array for Union ${config.name}.`,
  );
  return types;
}

export type GraphQLUnionTypeConfig<TSource, TContext> = {
  name: string;
  description?: Maybe<string>;
  types: Thunk<Array<GraphQLObjectType>>;
  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType?: Maybe<GraphQLTypeResolver<TSource, TContext>>;
  extensions?: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<UnionTypeDefinitionNode>;
  extensionASTNodes?: Maybe<ReadonlyArray<UnionTypeExtensionNode>>;
};

/**
 * Enum Type Definition
 *
 * Some leaf values of requests and input values are Enums. GraphQL serializes
 * Enum values as strings, however internally Enums can be represented by any
 * kind of type, often integers.
 *
 * Example:
 *
 *     const RGBType = new GraphQLEnumType({
 *       name: 'RGB',
 *       values: {
 *         RED: { value: 0 },
 *         GREEN: { value: 1 },
 *         BLUE: { value: 2 }
 *       }
 *     });
 *
 * Note: If a value is not provided in a definition, the name of the enum value
 * will be used as its internal value.
 */
export class GraphQLEnumType /* <T> */ {
  name: string;
  description: Maybe<string>;
  extensions: Maybe<ReadOnlyObjMap<any>>;
  astNode: Maybe<EnumTypeDefinitionNode>;
  extensionASTNodes: Maybe<ReadonlyArray<EnumTypeExtensionNode>>;

  _values: Array<GraphQLEnumValue /* <T> */>;
  _valueLookup: Map<any /* T */, GraphQLEnumValue>;
  _nameLookup: ObjMap<GraphQLEnumValue>;

  constructor(config: Readonly<GraphQLEnumTypeConfig /* <T> */>) {
    this.name = config.name;
    this.description = config.description;
    this.extensions = config.extensions && toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = undefineIfEmpty(config.extensionASTNodes);

    this._values = defineEnumValues(this.name, config.values);
    this._valueLookup = new Map(
      this._values.map((enumValue) => [enumValue.value, enumValue]),
    );
    this._nameLookup = keyMap(this._values, (value) => value.name);

    devAssert(typeof config.name === 'string', 'Must provide name.');
  }

  getValues(): Array<GraphQLEnumValue /* <T> */> {
    return this._values;
  }

  getValue(name: string): Maybe<GraphQLEnumValue> {
    return this._nameLookup[name];
  }

  serialize(outputValue: any /* T */): Maybe<string> {
    const enumValue = this._valueLookup.get(outputValue);
    if (enumValue === undefined) {
      throw new GraphQLError(
        `Enum "${this.name}" cannot represent value: ${inspect(outputValue)}`,
      );
    }
    return enumValue.name;
  }

  parseValue(inputValue: any): Maybe<any> /* T */ {
    if (typeof inputValue !== 'string') {
      const valueStr = inspect(inputValue);
      throw new GraphQLError(
        `Enum "${this.name}" cannot represent non-string value: ${valueStr}.` +
          didYouMeanEnumValue(this, valueStr),
      );
    }

    const enumValue = this.getValue(inputValue);
    if (enumValue == null) {
      throw new GraphQLError(
        `Value "${inputValue}" does not exist in "${this.name}" enum.` +
          didYouMeanEnumValue(this, inputValue),
      );
    }
    return enumValue.value;
  }

  parseLiteral(valueNode: ValueNode, _variables: Maybe<ObjMap<any>>): Maybe<any> /* T */ {
    // Note: variables will be resolved to a value before calling this function.
    if (valueNode.kind !== Kind.ENUM) {
      const valueStr = print(valueNode);
      throw new GraphQLError(
        `Enum "${this.name}" cannot represent non-enum value: ${valueStr}.` +
          didYouMeanEnumValue(this, valueStr),
        valueNode,
      );
    }

    const enumValue = this.getValue(valueNode.value);
    if (enumValue == null) {
      const valueStr = print(valueNode);
      throw new GraphQLError(
        `Value "${valueStr}" does not exist in "${this.name}" enum.` +
          didYouMeanEnumValue(this, valueStr),
        valueNode,
      );
    }
    return enumValue.value;
  }

  toConfig(): GraphQLEnumTypeConfig & {
    extensions: Maybe<Readonly<Record<string, any>>>;
    extensionASTNodes: ReadonlyArray<EnumTypeExtensionNode>;
  } {
    const values = keyValMap(
      this.getValues(),
      (value) => value.name,
      (value) => ({
        description: value.description,
        value: value.value,
        deprecationReason: value.deprecationReason,
        extensions: value.extensions,
        astNode: value.astNode,
      }),
    );

    return {
      name: this.name,
      description: this.description,
      values,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes ?? [],
    };
  }

  toString(): string {
    return this.name;
  }

  toJSON(): string {
    return this.toString();
  }

  // $FlowFixMe Flow doesn't support computed properties yet
  get [SYMBOL_TO_STRING_TAG]() {
    return 'GraphQLEnumType';
  }
}

// Print a simplified form when appearing in `inspect` and `util.inspect`.
defineInspect(GraphQLEnumType);

function didYouMeanEnumValue(
  enumType: GraphQLEnumType,
  unknownValueStr: string,
): string {
  const allNames = enumType.getValues().map((value) => value.name);
  const suggestedValues = suggestionList(unknownValueStr, allNames);

  return didYouMean('the enum value', suggestedValues);
}

function defineEnumValues(
  typeName: string,
  valueMap: GraphQLEnumValueConfigMap /* <T> */,
): Array<GraphQLEnumValue /* <T> */> {
  devAssert(
    isPlainObj(valueMap),
    `${typeName} values must be an object with value names as keys.`,
  );
  return Object.entries(valueMap).map(([valueName, valueConfig]: any[]) => {
    devAssert(
      isPlainObj(valueConfig),
      `${typeName}.${valueName} must refer to an object with a "value" key ` +
        `representing an internal value but got: ${inspect(valueConfig)}.`,
    );
    devAssert(
      !('isDeprecated' in valueConfig),
      `${typeName}.${valueName} should provide "deprecationReason" instead of "isDeprecated".`,
    );
    return {
      name: valueName,
      description: valueConfig.description,
      value: valueConfig.value !== undefined ? valueConfig.value : valueName,
      isDeprecated: valueConfig.deprecationReason != null,
      deprecationReason: valueConfig.deprecationReason,
      extensions: valueConfig.extensions && toObjMap(valueConfig.extensions),
      astNode: valueConfig.astNode,
    };
  });
}

export interface GraphQLEnumTypeConfig {
  name: string;
  description?: Maybe<string>;
  values: GraphQLEnumValueConfigMap;
  extensions?: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<EnumTypeDefinitionNode>;
  extensionASTNodes?: Maybe<ReadonlyArray<EnumTypeExtensionNode>>;
}

export type GraphQLEnumValueConfigMap = {
  [key: string]: GraphQLEnumValueConfig;
};

export interface GraphQLEnumValueConfig {
  description?: Maybe<string>;
  value?: any;
  deprecationReason?: Maybe<string>;
  extensions?: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<EnumValueDefinitionNode>;
}

export interface GraphQLEnumValue {
  name: string;
  description: Maybe<string>;
  value: any;
  isDeprecated: boolean;
  deprecationReason: Maybe<string>;
  extensions: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<EnumValueDefinitionNode>;
}

/**
 * Input Object Type Definition
 *
 * An input object defines a structured collection of fields which may be
 * supplied to a field argument.
 *
 * Using `NonNull` will ensure that a value must be provided by the query
 *
 * Example:
 *
 *     const GeoPoint = new GraphQLInputObjectType({
 *       name: 'GeoPoint',
 *       fields: {
 *         lat: { type: GraphQLNonNull(GraphQLFloat) },
 *         lon: { type: GraphQLNonNull(GraphQLFloat) },
 *         alt: { type: GraphQLFloat, defaultValue: 0 },
 *       }
 *     });
 *
 */
export class GraphQLInputObjectType {
  name: string;
  description: Maybe<string>;
  extensions: Maybe<ReadOnlyObjMap<any>>;
  astNode: Maybe<InputObjectTypeDefinitionNode>;
  extensionASTNodes: Maybe<ReadonlyArray<InputObjectTypeExtensionNode>>;

  _fields: Thunk<GraphQLInputFieldMap>;

  constructor(config: Readonly<GraphQLInputObjectTypeConfig>) {
    this.name = config.name;
    this.description = config.description;
    this.extensions = config.extensions && toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = undefineIfEmpty(config.extensionASTNodes);

    this._fields = defineInputFieldMap.bind(undefined, config);
    devAssert(typeof config.name === 'string', 'Must provide name.');
  }

  getFields(): GraphQLInputFieldMap {
    if (typeof this._fields === 'function') {
      this._fields = this._fields();
    }
    return this._fields;
  }

  toConfig(): GraphQLInputObjectTypeConfig & {
    fields: GraphQLInputFieldConfigMap;
    extensions: Maybe<Readonly<Record<string, any>>>;
    extensionASTNodes: ReadonlyArray<InputObjectTypeExtensionNode>;
  } {
    const fields = mapValue(this.getFields(), (field: GraphQLInputField) => ({
      description: field.description,
      type: field.type,
      defaultValue: field.defaultValue,
      extensions: field.extensions,
      astNode: field.astNode,
    }));

    return {
      name: this.name,
      description: this.description,
      fields,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes ?? [],
    };
  }

  toString(): string {
    return this.name;
  }

  toJSON(): string {
    return this.toString();
  }

  // $FlowFixMe Flow doesn't support computed properties yet
  get [SYMBOL_TO_STRING_TAG]() {
    return 'GraphQLInputObjectType';
  }
}

// Print a simplified form when appearing in `inspect` and `util.inspect`.
defineInspect(GraphQLInputObjectType);

function defineInputFieldMap(
  config: Readonly<GraphQLInputObjectTypeConfig>,
): GraphQLInputFieldMap {
  const fieldMap = resolveThunk(config.fields);
  devAssert(
    isPlainObj(fieldMap),
    `${config.name} fields must be an object with field names as keys or a function which returns such an object.`,
  );
  return mapValue(fieldMap, (fieldConfig: GraphQLInputFieldConfig, fieldName) => {
    devAssert(
      !('resolve' in fieldConfig),
      `${config.name}.${fieldName} field has a resolve property, but Input Types cannot define resolvers.`,
    );

    return {
      name: fieldName,
      description: fieldConfig.description,
      type: fieldConfig.type,
      defaultValue: fieldConfig.defaultValue,
      extensions: fieldConfig.extensions && toObjMap(fieldConfig.extensions),
      astNode: fieldConfig.astNode,
    };
  });
}

export interface GraphQLInputObjectTypeConfig {
  name: string;
  description?: Maybe<string>;
  fields: Thunk<GraphQLInputFieldConfigMap>;
  extensions?: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<InputObjectTypeDefinitionNode>;
  extensionASTNodes?: Maybe<ReadonlyArray<InputObjectTypeExtensionNode>>;
}

export interface GraphQLInputFieldConfig {
  description?: Maybe<string>;
  type: GraphQLInputType;
  defaultValue?: any;
  extensions?: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<InputValueDefinitionNode>;
}

export type GraphQLInputFieldConfigMap = {
  [key: string]: GraphQLInputFieldConfig;
};

export interface GraphQLInputField {
  name: string;
  description?: Maybe<string>;
  type: GraphQLInputType;
  defaultValue?: any;
  extensions: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<InputValueDefinitionNode>;
}

export function isRequiredInputField(
  field: GraphQLInputField,
): boolean {
  return isNonNullType(field.type) && field.defaultValue === undefined;
}

export type GraphQLInputFieldMap = ObjMap<GraphQLInputField>;
