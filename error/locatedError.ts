import { ASTNode } from '../language/ast.ts';

import { GraphQLError } from './GraphQLError.ts';

/**
 * Given an arbitrary Error, presumably thrown while attempting to execute a
 * GraphQL operation, produce a new GraphQLError aware of the location in the
 * document responsible for the original Error.
 */
export function locatedError(
  originalError: Error | GraphQLError,
  nodes: ASTNode | ASTNode[] | undefined | null,
  path?: (string | number)[]
): GraphQLError {
  // Note: this uses a brand-check to support GraphQL errors originating from
  // other contexts.
  if ('path' in originalError && Array.isArray(originalError.path)) {
    return originalError;
  }

  return new GraphQLError(
    originalError.message,
    (originalError as any).nodes ?? nodes,
    (originalError as any).source,
    (originalError as any).positions,
    path,
    originalError,
  );
}
