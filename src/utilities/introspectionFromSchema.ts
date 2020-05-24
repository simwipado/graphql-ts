import invariant from '../jsutils/invariant.ts';
import isPromise from '../jsutils/isPromise.ts';

import { parse } from '../language/parser.ts';
import { execute } from '../execution/execute.ts';
import { GraphQLSchema } from '../type/schema.ts';

import {
IntrospectionQuery,
IntrospectionOptions,
  getIntrospectionQuery,
} from './getIntrospectionQuery.ts';

/**
 * Build an IntrospectionQuery from a GraphQLSchema
 *
 * IntrospectionQuery is useful for utilities that care about type and field
 * relationships, but do not need to traverse through those relationships.
 *
 * This is the inverse of buildClientSchema. The primary use case is outside
 * of the server context, for instance when doing schema comparisons.
 */
export function introspectionFromSchema(
  schema: GraphQLSchema,
  options?: IntrospectionOptions,
): IntrospectionQuery {
  const optionsWithDefaults = {
    directiveIsRepeatable: true,
    schemaDescription: true,
    ...options,
  };

  const document = parse(getIntrospectionQuery(optionsWithDefaults));
  const result = execute({ schema, document });
  invariant(!isPromise(result) && !result.errors && result.data);
  return result.data;
}
