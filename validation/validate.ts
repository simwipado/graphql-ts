import devAssert from '../utilities/devAssert.ts';

import { GraphQLError } from '../error/GraphQLError.ts';

import { DocumentNode } from '../language/ast.ts';
import { visit, visitInParallel } from '../language/visitor.ts';

import { GraphQLSchema } from '../type/schema.ts';
import { assertValidSchema } from '../type/validate.ts';

import { TypeInfo, visitWithTypeInfo } from '../utilities/TypeInfo.ts';

import {
SDLValidationRule,
ValidationRule,
  SDLValidationContext,
  ValidationContext,
} from './ValidationContext.ts';
import { specifiedRules, specifiedSDLRules } from './specifiedRules.ts';

/**
 * Implements the "Validation" section of the spec.
 *
 * Validation runs synchronously, returning an array of encountered errors, or
 * an empty array if no errors were encountered and the document is valid.
 *
 * A list of specific validation rules may be provided. If not provided, the
 * default list of rules defined by the GraphQL specification will be used.
 *
 * Each validation rules is a function which returns a visitor
 * (see the language/visitor API). Visitor methods are expected to return
 * GraphQLErrors, or Arrays of GraphQLErrors when invalid.
 *
 * Optionally a custom TypeInfo instance may be provided. If not provided, one
 * will be created from the provided schema.
 */
export function validate(
  schema: GraphQLSchema,
  documentAST: DocumentNode,
  rules: readonly ValidationRule[] = specifiedRules,
  typeInfo: TypeInfo = new TypeInfo(schema),
  options?: { maxErrors?: number }
): GraphQLError[] {
  devAssert(documentAST, 'Must provide document.');
  // If the schema used for validation is invalid, throw an error.
  assertValidSchema(schema);

  const abortObj = {} as const;
  const errors: GraphQLError[] = [];
  const context = new ValidationContext(
    schema,
    documentAST,
    typeInfo,
    (error) => {
      if (options?.maxErrors != null && errors.length >= options.maxErrors) {
        errors.push(
          new GraphQLError(
            'Too many validation errors, error limit reached. Validation aborted.',
          ),
        );
        throw abortObj;
      }
      errors.push(error);
    },
  );

  // This uses a specialized visitor which runs multiple visitors in parallel,
  // while maintaining the visitor skip and break API.
  const visitor = visitInParallel(rules.map((rule) => rule(context)));

  // Visit the whole document with each instance of all provided rules.
  try {
    visit(documentAST, visitWithTypeInfo(typeInfo, visitor));
  } catch (e) {
    if (e !== abortObj) {
      throw e;
    }
  }
  return errors;
}

/**
 * @internal
 */
export function validateSDL(
  documentAST: DocumentNode,
  schemaToExtend?: GraphQLSchema,
  rules: readonly SDLValidationRule[] = specifiedSDLRules,
): GraphQLError[] {
  const errors: GraphQLError[] = [];
  const context = new SDLValidationContext(
    documentAST,
    schemaToExtend,
    (error) => {
      errors.push(error);
    },
  );

  const visitors = rules.map((rule) => rule(context));
  visit(documentAST, visitInParallel(visitors));
  return errors;
}

/**
 * Utility function which asserts a SDL document is valid by throwing an error
 * if it is invalid.
 *
 * @internal
 */
export function assertValidSDL(documentAST: DocumentNode): void {
  const errors = validateSDL(documentAST);
  if (errors.length !== 0) {
    throw new Error(errors.map((error) => error.message).join('\n\n'));
  }
}

/**
 * Utility function which asserts a SDL document is valid by throwing an error
 * if it is invalid.
 *
 * @internal
 */
export function assertValidSDLExtension(
  documentAST: DocumentNode,
  schema: GraphQLSchema,
): void {
  const errors = validateSDL(documentAST, schema);
  if (errors.length !== 0) {
    throw new Error(errors.map((error) => error.message).join('\n\n'));
  }
}
