
import inspect from '../jsutils/inspect.ts';
import invariant from '../jsutils/invariant.ts';
import keyValMap from '../jsutils/keyValMap.ts';
import { ObjMap } from '../jsutils/ObjMap.ts';

import { GraphQLSchema } from '../type/schema.ts';
import { GraphQLDirective } from '../type/directives.ts';
import { isIntrospectionType } from '../type/introspection.ts';
import {
GraphQLNamedType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  isListType,
  isNonNullType,
  isScalarType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isEnumType,
  isInputObjectType,
  GraphQLInputType,
  GraphQLInputFieldMap,
} from '../type/definition.ts';

/**
 * Sort GraphQLSchema.
 *
 * This function returns a sorted copy of the given GraphQLSchema.
 */
export function lexicographicSortSchema(schema: GraphQLSchema): GraphQLSchema {
  const schemaConfig = schema.toConfig();
  const typeMap = keyValMap(
    sortByName(schemaConfig.types),
    (type) => type.name,
    sortNamedType,
  );

  return new GraphQLSchema({
    ...schemaConfig,
    types: Object.values(typeMap),
    directives: sortByName(schemaConfig.directives).map(sortDirective),
    query: replaceMaybeType(schemaConfig.query),
    mutation: replaceMaybeType(schemaConfig.mutation),
    subscription: replaceMaybeType(schemaConfig.subscription),
  });

  function replaceType(type: GraphQLInputType) {
    if (isListType(type)) {
      return new GraphQLList(replaceType(type.ofType));
    } else if (isNonNullType(type)) {
      return new GraphQLNonNull(replaceType(type.ofType));
    }
    return replaceNamedType(type);
  }

  function replaceNamedType<T extends GraphQLNamedType>(type: T): T {
    return typeMap[type.name]
  }

  function replaceMaybeType(maybeType: GraphQLObjectType | undefined) {
    return maybeType && replaceNamedType(maybeType);
  }

  function sortDirective(directive) {
    const config = directive.toConfig();
    return new GraphQLDirective({
      ...config,
      locations: sortBy(config.locations, (x) => x),
      args: sortArgs(config.args),
    });
  }

  function sortArgs(args: GraphQLInputFieldMap) {
    return sortObjMap(args, (arg) => ({
      ...arg,
      type: replaceType(arg.type),
    }));
  }

  function sortFields(fieldsMap: GraphQLInputFieldMap) {
    return sortObjMap(fieldsMap, (field) => ({
      ...field,
      type: replaceType(field.type),
      args: sortArgs(field.args),
    }));
  }

  function sortInputFields(fieldsMap: GraphQLInputFieldMap) {
    return sortObjMap(fieldsMap, (field) => ({
      ...field,
      type: replaceType(field.type),
    }));
  }

  function sortTypes<T extends GraphQLNamedType>(arr: T[]): T[] {
    return sortByName(arr).map(replaceNamedType);
  }

  function sortNamedType(type: GraphQLNamedType) {
    if (isScalarType(type) || isIntrospectionType(type)) {
      return type;
    }
    if (isObjectType(type)) {
      const config = type.toConfig();
      return new GraphQLObjectType({
        ...config,
        interfaces: () => sortTypes(config.interfaces),
        fields: () => sortFields(config.fields),
      });
    }
    if (isInterfaceType(type)) {
      const config = type.toConfig();
      return new GraphQLInterfaceType({
        ...config,
        interfaces: () => sortTypes(config.interfaces),
        fields: () => sortFields(config.fields),
      });
    }
    if (isUnionType(type)) {
      const config = type.toConfig();
      return new GraphQLUnionType({
        ...config,
        types: () => sortTypes(config.types),
      });
    }
    if (isEnumType(type)) {
      const config = type.toConfig();
      return new GraphQLEnumType({
        ...config,
        values: sortObjMap(config.values),
      });
    }
    if (isInputObjectType(type)) {
      const config = type.toConfig();
      return new GraphQLInputObjectType({
        ...config,
        fields: () => sortInputFields(config.fields),
      });
    }

    // Not reachable. All possible types have been considered.
    invariant(false, 'Unexpected type: ' + inspect(type));
  }
}

function sortObjMap<T, R>(map: ObjMap<T>, sortValueFn?: (arg: T) => R): ObjMap<R> {
  const sortedMap = Object.create(null);
  const sortedKeys = sortBy(Object.keys(map), (x) => x);
  for (const key of sortedKeys) {
    const value = map[key];
    sortedMap[key] = sortValueFn ? sortValueFn(value) : value;
  }
  return sortedMap;
}

function sortByName<T extends { name: string }>(
  array: T[],
): T[] {
  return sortBy(array, (obj) => obj.name);
}

function sortBy<T>(
  array: T[],
  mapToKey: (arg: T) => string,
): T[] {
  return array.slice().sort((obj1, obj2) => {
    const key1 = mapToKey(obj1);
    const key2 = mapToKey(obj2);
    return key1.localeCompare(key2);
  });
}
