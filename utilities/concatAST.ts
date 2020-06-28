import { DocumentNode } from "../language/ast.ts";

/**
 * Provided a collection of ASTs, presumably each from different files,
 * concatenate the ASTs together into batched AST, useful for validating many
 * GraphQL source files which together represent one conceptual application.
 */
export function concatAST(asts: DocumentNode[]): DocumentNode {
  return {
    kind: "Document",
    definitions: asts.flatMap((ast) => ast.definitions),
  };
}