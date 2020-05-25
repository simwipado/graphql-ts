import inspect from '../jsutils/inspect.ts';
import toObjMap from '../jsutils/toObjMap.ts';
import devAssert from '../jsutils/devAssert.ts';
import instanceOf from '../jsutils/instanceOf.ts';
import isObjectLike from '../jsutils/isObjectLike.ts';
import defineInspect from '../jsutils/defineInspect.ts';

import { DirectiveDefinitionNode } from '../language/ast.ts';
import {
  DirectiveLocation,
DirectiveLocationEnum,
} from '../language/directiveLocation.ts';

import { GraphQLString, GraphQLBoolean } from './scalars.ts';
import {
GraphQLFieldConfigArgumentMap,
GraphQLArgument,
  argsToArgsConfig,
  GraphQLNonNull,
} from './definition.ts';
import Maybe from '../tsutils/Maybe.ts';

/**
 * Test if the given value is a GraphQL directive.
 */
export function isDirective(directive: any): directive is GraphQLDirective {
  return instanceOf(directive, GraphQLDirective);
}

export function assertDirective(directive: any): GraphQLDirective {
  if (!isDirective(directive)) {
    throw new Error(
      `Expected ${inspect(directive)} to be a GraphQL directive.`,
    );
  }
  return directive;
}

/**
 * Directives are used by the GraphQL runtime as a way of modifying execution
 * behavior. Type system creators will usually not create these directly.
 */
export class GraphQLDirective {
  name: string;
  description: Maybe<string>;
  locations: DirectiveLocationEnum[];
  isRepeatable: boolean;
  args: GraphQLArgument[];
  extensions: Maybe<Readonly<Record<string, any>>>;
  astNode: Maybe<DirectiveDefinitionNode>;

  constructor(config: Readonly<GraphQLDirectiveConfig>) {
    this.name = config.name;
    this.description = config.description;
    this.locations = config.locations;
    this.isRepeatable = config.isRepeatable ?? false;
    this.extensions = config.extensions && toObjMap(config.extensions);
    this.astNode = config.astNode;

    devAssert(config.name, 'Directive must be named.');
    devAssert(
      Array.isArray(config.locations),
      `@${config.name} locations must be an Array.`,
    );

    const args = config.args ?? {};
    devAssert(
      isObjectLike(args) && !Array.isArray(args),
      `@${config.name} args must be an object with argument names as keys.`,
    );

    this.args = Object.entries(args).map(([argName, argConfig]: [string, any]) => ({
      name: argName,
      description: argConfig.description,
      type: argConfig.type,
      defaultValue: argConfig.defaultValue,
      extensions: argConfig.extensions && toObjMap(argConfig.extensions),
      astNode: argConfig.astNode,
    }));
  }

  toConfig(): GraphQLDirectiveConfig & {
    args: GraphQLFieldConfigArgumentMap;
    isRepeatable: boolean;
    extensions: Maybe<Readonly<Record<string, any>>>;
  } {
    return {
      name: this.name,
      description: this.description,
      locations: this.locations,
      args: argsToArgsConfig(this.args),
      isRepeatable: this.isRepeatable,
      extensions: this.extensions,
      astNode: this.astNode,
    };
  }

  toString(): string {
    return '@' + this.name;
  }

  toJSON(): string {
    return this.toString();
  }

  // $FlowFixMe Flow doesn't support computed properties yet
  get [Symbol.toStringTag]() {
    return 'GraphQLDirective';
  }
}

// Print a simplified form when appearing in `inspect` and `util.inspect`.
defineInspect(GraphQLDirective);

export interface GraphQLDirectiveConfig {
  name: string;
  description?: Maybe<string>;
  locations: DirectiveLocationEnum[];
  args?: Maybe<GraphQLFieldConfigArgumentMap>;
  isRepeatable?: Maybe<boolean>;
  extensions?: Maybe<Readonly<Record<string, any>>>;
  astNode?: Maybe<DirectiveDefinitionNode>;
}

/**
 * Used to conditionally include fields or fragments.
 */
export const GraphQLIncludeDirective = new GraphQLDirective({
  name: 'include',
  description:
    'Directs the executor to include this field or fragment only when the `if` argument is true.',
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FRAGMENT_SPREAD,
    DirectiveLocation.INLINE_FRAGMENT,
  ],
  args: {
    if: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Included when true.',
    },
  },
});

/**
 * Used to conditionally skip (exclude) fields or fragments.
 */
export const GraphQLSkipDirective = new GraphQLDirective({
  name: 'skip',
  description:
    'Directs the executor to skip this field or fragment when the `if` argument is true.',
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FRAGMENT_SPREAD,
    DirectiveLocation.INLINE_FRAGMENT,
  ],
  args: {
    if: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Skipped when true.',
    },
  },
});

/**
 * Constant string used for default reason for a deprecation.
 */
export const DEFAULT_DEPRECATION_REASON = 'No longer supported';

/**
 * Used to declare element of a GraphQL schema as deprecated.
 */
export const GraphQLDeprecatedDirective = new GraphQLDirective({
  name: 'deprecated',
  description: 'Marks an element of a GraphQL schema as no longer supported.',
  locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.ENUM_VALUE],
  args: {
    reason: {
      type: GraphQLString,
      description:
        'Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted using the Markdown syntax, as specified by [CommonMark](https://commonmark.org/).',
      defaultValue: DEFAULT_DEPRECATION_REASON,
    },
  },
});

/**
 * Used to provide a URL for specifying the behaviour of custom scalar definitions.
 */
export const GraphQLSpecifiedByDirective = new GraphQLDirective({
  name: 'specifiedBy',
  description: 'Exposes a URL that specifies the behaviour of this scalar.',
  locations: [DirectiveLocation.SCALAR],
  args: {
    url: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The URL that specifies the behaviour of this scalar.',
    },
  },
});

/**
 * The full list of specified directives.
 */
export const specifiedDirectives = [
  GraphQLIncludeDirective,
  GraphQLSkipDirective,
  GraphQLDeprecatedDirective,
  GraphQLSpecifiedByDirective,
] as const

export function isSpecifiedDirective(
  directive: GraphQLDirective,
): boolean {
  return specifiedDirectives.some(({ name }) => name === directive.name);
}
