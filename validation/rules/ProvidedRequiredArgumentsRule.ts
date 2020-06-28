import inspect from "../../utilities/inspect.ts";
import keyMap from "../../utilities/keyMap.ts";

import { GraphQLError } from "../../error/GraphQLError.ts";

import { Kind } from "../../language/kinds.ts";
import { print } from "../../language/printer.ts";
import { ASTVisitor } from "../../language/visitor.ts";

import { specifiedDirectives } from "../../type/directives.ts";
import {
  isType,
  isRequiredArgument,
  GraphQLArgument,
} from "../../type/definition.ts";

import {
  ValidationContext,
  SDLValidationContext,
} from "../ValidationContext.ts";
import { InputValueDefinitionNode } from "../../language/ast.ts";

/**
 * Provided required arguments
 *
 * A field or directive is only valid if all required (non-null without a
 * default value) field arguments have been provided.
 */
export function ProvidedRequiredArgumentsRule(
  context: ValidationContext,
): ASTVisitor {
  return {
    ...ProvidedRequiredArgumentsOnDirectivesRule(context),
    Field: {
      // Validate on leave to allow for deeper errors to appear first.
      leave(fieldNode) {
        const fieldDef = context.getFieldDef();
        if (!fieldDef) {
          return false;
        }

        // istanbul ignore next (See https://github.com/graphql/graphql-js/issues/2203)
        const argNodes = fieldNode.arguments ?? [];
        const argNodeMap = keyMap(argNodes, (arg) => arg.name.value);
        for (const argDef of fieldDef.args) {
          const argNode = argNodeMap[argDef.name];
          if (!argNode && isRequiredArgument(argDef)) {
            const argTypeStr = inspect(argDef.type);
            context.reportError(
              new GraphQLError(
                `Field "${fieldDef.name}" argument "${argDef.name}" of type "${argTypeStr}" is required, but it was not provided.`,
                fieldNode,
              ),
            );
          }
        }
      },
    },
  };
}

/**
 * @internal
 */
export function ProvidedRequiredArgumentsOnDirectivesRule(
  context: ValidationContext | SDLValidationContext,
): ASTVisitor {
  const requiredArgsMap = Object.create(null);

  const schema = context.getSchema();
  const definedDirectives = schema
    ? schema.getDirectives()
    : specifiedDirectives;
  for (const directive of definedDirectives) {
    requiredArgsMap[directive.name] = keyMap(
      directive.args.filter(isRequiredArgument),
      (arg: GraphQLArgument) => arg.name,
    );
  }

  const astDefinitions = context.getDocument().definitions;
  for (const def of astDefinitions) {
    if (def.kind === Kind.DIRECTIVE_DEFINITION) {
      // istanbul ignore next (See https://github.com/graphql/graphql-js/issues/2203)
      const argNodes = def.arguments ?? [];

      requiredArgsMap[def.name.value] = keyMap(
        argNodes.filter(isRequiredArgumentNode),
        (arg) => arg.name.value,
      );
    }
  }

  return {
    Directive: {
      // Validate on leave to allow for deeper errors to appear first.
      leave(directiveNode) {
        const directiveName = directiveNode.name.value;
        const requiredArgs = requiredArgsMap[directiveName];
        if (requiredArgs) {
          // istanbul ignore next (See https://github.com/graphql/graphql-js/issues/2203)
          const argNodes = directiveNode.arguments ?? [];
          const argNodeMap = keyMap(argNodes, (arg) => arg.name.value);
          for (const argName of Object.keys(requiredArgs)) {
            if (!argNodeMap[argName]) {
              const argType = requiredArgs[argName].type;
              const argTypeStr = isType(argType)
                ? inspect(argType)
                : print(argType);

              context.reportError(
                new GraphQLError(
                  `Directive "@${directiveName}" argument "${argName}" of type "${argTypeStr}" is required, but it was not provided.`,
                  directiveNode,
                ),
              );
            }
          }
        }
      },
    },
  };
}

function isRequiredArgumentNode(arg: InputValueDefinitionNode) {
  return arg.type.kind === Kind.NON_NULL_TYPE && arg.defaultValue == null;
}
