import isPromise from './jsutils/isPromise.ts';
import { PromiseOrValue } from './jsutils/PromiseOrValue.ts';

import { parse } from './language/parser.ts';
import { Source } from './language/source.ts';

import { validate } from './validation/validate.ts';

import { validateSchema } from './type/validate.ts';
import { GraphQLSchema } from './type/schema.ts';
import {
GraphQLFieldResolver,
GraphQLTypeResolver,
} from './type/definition.ts';

import { ExecutionResult, execute } from './execution/execute.ts';
import Maybe from './tsutils/Maybe.ts';

/**
 * This is the primary entry point function for fulfilling GraphQL operations
 * by parsing, validating, and executing a GraphQL document along side a
 * GraphQL schema.
 *
 * More sophisticated GraphQL servers, such as those which persist queries,
 * may wish to separate the validation and execution phases to a static time
 * tooling step, and a server runtime step.
 *
 * Accepts either an object with named arguments, or individual arguments:
 *
 * schema:
 *    The GraphQL type system to use when validating and executing a query.
 * source:
 *    A GraphQL language formatted string representing the requested operation.
 * rootValue:
 *    The value provided as the first argument to resolver functions on the top
 *    level type (e.g. the query object type).
 * contextValue:
 *    The context value is provided as an argument to resolver functions after
 *    field arguments. It is used to pass shared information useful at any point
 *    during executing this query, for example the currently logged in user and
 *    connections to databases or other services.
 * variableValues:
 *    A mapping of variable name to runtime value to use for all variables
 *    defined in the requestString.
 * operationName:
 *    The name of the operation to use if requestString contains multiple
 *    possible operations. Can be omitted if requestString contains only
 *    one operation.
 * fieldResolver:
 *    A resolver function to use when one is not provided by the schema.
 *    If not provided, the default field resolver is used (which looks for a
 *    value or method on the source value with the field's name).
 * typeResolver:
 *    A type resolver function to use when none is provided by the schema.
 *    If not provided, the default type resolver is used (which looks for a
 *    `__typename` field or alternatively calls the `isTypeOf` method).
 */
export type GraphQLArgs = {
  schema: GraphQLSchema;
  source: string | Source;
  rootValue?: any;
  contextValue?: any;
  variableValues?: Maybe<{ [key: string]: any }>;
  operationName?: Maybe<string>;
  fieldResolver?: Maybe<GraphQLFieldResolver<any, any>>;
  typeResolver?: Maybe<GraphQLTypeResolver<any, any>>;
}

export function graphql(args: GraphQLArgs): Promise<ExecutionResult>;
export function graphql(
  argsOrSchema: GraphQLSchema,
  source: Source | string,
  rootValue?: any,
  contextValue?: any,
  variableValues?: { [key: string]: any },
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
  typeResolver?: GraphQLTypeResolver<any, any>,
): Promise<ExecutionResult>;
export function graphql(
  argsOrSchema: GraphQLSchema | GraphQLArgs,
  source?: Source | string,
  rootValue?: any,
  contextValue?: any,
  variableValues?: { [key: string]: any },
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
  typeResolver?: GraphQLTypeResolver<any, any>,
): Promise<ExecutionResult> {
  /* eslint-enable no-redeclare */
  // Always return a Promise for a consistent API.
  return new Promise((resolve) =>
    resolve(
      // Extract arguments from object args if provided.
      'schema' in argsOrSchema
        ? graphqlImpl(argsOrSchema)
        : graphqlImpl({
            schema: argsOrSchema,
            source: source as string | Source,
            rootValue,
            contextValue,
            variableValues,
            operationName,
            fieldResolver,
            typeResolver,
          }),
    ),
  );
}

/**
 * The graphqlSync function also fulfills GraphQL operations by parsing,
 * validating, and executing a GraphQL document along side a GraphQL schema.
 * However, it guarantees to complete synchronously (or throw an error) assuming
 * that all field resolvers are also synchronous.
 */
export function graphqlSync(args: GraphQLArgs): ExecutionResult;
export function graphqlSync(
  schema: GraphQLSchema,
  source: Source | string,
  rootValue?: any,
  contextValue?: any,
  variableValues?: { [key: string]: any },
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
  typeResolver?: GraphQLTypeResolver<any, any>,
): ExecutionResult;
export function graphqlSync(
  argsOrSchema: GraphQLSchema | GraphQLArgs,
  source?: Source | string,
  rootValue?: any,
  contextValue?: any,
  variableValues?: { [key: string]: any },
  operationName?: string,
  fieldResolver?: GraphQLFieldResolver<any, any>,
  typeResolver?: GraphQLTypeResolver<any, any>,
) {
  /* eslint-enable no-redeclare */
  // Extract arguments from object args if provided.
  const result =
    'schema' in argsOrSchema
      ? graphqlImpl(argsOrSchema)
      : graphqlImpl({
          schema: argsOrSchema,
          source: source as Source | string,
          rootValue,
          contextValue,
          variableValues,
          operationName,
          fieldResolver,
          typeResolver,
        });

  // Assert that the execution was synchronous.
  if (isPromise(result)) {
    throw new Error('GraphQL execution failed to complete synchronously.');
  }

  return result;
}

function graphqlImpl(args: GraphQLArgs): PromiseOrValue<ExecutionResult> {
  const {
    schema,
    source,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    typeResolver,
  } = args;

  // Validate Schema
  const schemaValidationErrors = validateSchema(schema);
  if (schemaValidationErrors.length > 0) {
    return { errors: schemaValidationErrors };
  }

  // Parse
  let document;
  try {
    document = parse(source);
  } catch (syntaxError) {
    return { errors: [syntaxError] };
  }

  // Validate
  const validationErrors = validate(schema, document);
  if (validationErrors.length > 0) {
    return { errors: validationErrors };
  }

  // Execute
  return execute({
    schema,
    document,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    typeResolver,
  });
}
