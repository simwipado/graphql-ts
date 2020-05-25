import devAssert from '../jsutils/devAssert.ts';

import { Kind } from '../language/kinds.ts';
import { Source } from '../language/source.ts';
import { DocumentNode } from '../language/ast.ts';
import { ParseOptions, parse } from '../language/parser.ts';

import { assertValidSDL } from '../validation/validate.ts';

import {
GraphQLSchemaValidationOptions,
  GraphQLSchema,
} from '../type/schema.ts';
import {
  GraphQLSkipDirective,
  GraphQLIncludeDirective,
  GraphQLDeprecatedDirective,
  GraphQLSpecifiedByDirective,
} from '../type/directives.ts';

import { extendSchemaImpl } from './extendSchema.ts';
import Maybe from '../tsutils/Maybe.ts';

export interface BuildSchemaOptions extends GraphQLSchemaValidationOptions {
  /**
   * Descriptions are defined as preceding string literals, however an older
   * experimental version of the SDL supported preceding comments as
   * descriptions. Set to true to enable this deprecated behavior.
   * This option is provided to ease adoption and will be removed in v16.
   *
   * Default: false
   */
  commentDescriptions: Maybe<boolean>;

  /**
   * Set to true to assume the SDL is valid.
   *
   * Default: false
   */
  assumeValidSDL: Maybe<boolean>;
};

/**
 * This takes the ast of a schema document produced by the parse function in
 * src/language/parser.js.
 *
 * If no schema definition is provided, then it will look for types named Query
 * and Mutation.
 *
 * Given that AST it constructs a GraphQLSchema. The resulting schema
 * has no resolve methods, so execution will use default resolvers.
 *
 * Accepts options as a second argument:
 *
 *    - commentDescriptions:
 *        Provide true to use preceding comments as the description.
 *
 */
export function buildASTSchema(
  documentAST: DocumentNode,
  options: BuildSchemaOptions
): GraphQLSchema {
  devAssert(
    documentAST != null && documentAST.kind === Kind.DOCUMENT,
    'Must provide valid Document AST.',
  );

  if (options?.assumeValid !== true && options?.assumeValidSDL !== true) {
    assertValidSDL(documentAST);
  }

  const config = extendSchemaImpl(emptySchemaConfig, documentAST, options);

  if (config.astNode == null) {
    for (const type of config.types) {
      switch (type.name) {
        // Note: While this could make early assertions to get the correctly
        // typed values below, that would throw immediately while type system
        // validation with validateSchema() will produce more actionable results.
        case 'Query':
          (config as any).query = type
          break;
        case 'Mutation':
          (config as any).mutation = type
          break;
        case 'Subscription':
          (config as any).subscription = type
          break;
      }
    }
  }

  const { directives } = config;
  // If specified directives were not explicitly declared, add them.
  if (!directives.some((directive) => directive.name === 'skip')) {
    directives.push(GraphQLSkipDirective);
  }

  if (!directives.some((directive) => directive.name === 'include')) {
    directives.push(GraphQLIncludeDirective);
  }

  if (!directives.some((directive) => directive.name === 'deprecated')) {
    directives.push(GraphQLDeprecatedDirective);
  }

  if (!directives.some((directive) => directive.name === 'specifiedBy')) {
    directives.push(GraphQLSpecifiedByDirective);
  }

  return new GraphQLSchema(config);
}

const emptySchemaConfig = new GraphQLSchema({ directives: [] }).toConfig();

/**
 * A helper function to build a GraphQLSchema directly from a source
 * document.
 */
export function buildSchema(
  source: string | Source,
  options: Maybe<BuildSchemaOptions & ParseOptions>
): GraphQLSchema {
  const document = parse(source, {
    noLocation: options?.noLocation,
    allowLegacySDLEmptyFields: options?.allowLegacySDLEmptyFields,
    allowLegacySDLImplementsInterfaces:
      options?.allowLegacySDLImplementsInterfaces,
    experimentalFragmentVariables: options?.experimentalFragmentVariables,
  });

  return buildASTSchema(document, {
    commentDescriptions: options?.commentDescriptions,
    assumeValidSDL: options?.assumeValidSDL,
    assumeValid: options?.assumeValid,
  });
}
