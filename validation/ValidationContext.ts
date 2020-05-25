import { ObjMap } from '../jsutils/ObjMap.ts';

import { GraphQLError } from '../error/GraphQLError.ts';

import { Kind } from '../language/kinds.ts';
import { ASTVisitor, visit } from '../language/visitor.ts';
import {
DocumentNode,
OperationDefinitionNode,
VariableNode,
SelectionSetNode,
FragmentSpreadNode,
FragmentDefinitionNode,
} from '../language/ast.ts';

import { GraphQLSchema } from '../type/schema.ts';
import { GraphQLDirective } from '../type/directives.ts';
import {
GraphQLInputType,
GraphQLOutputType,
GraphQLCompositeType,
GraphQLField,
GraphQLArgument,
} from '../type/definition.ts';

import { TypeInfo, visitWithTypeInfo } from '../utilities/TypeInfo.ts';
import Maybe from '../tsutils/Maybe.ts';

type NodeWithSelectionSet = OperationDefinitionNode | FragmentDefinitionNode;
type VariableUsage = {
  node: VariableNode;
  type: Maybe<GraphQLInputType>;
  defaultValue: Maybe<any>;
};

/**
 * An instance of this class is passed as the "this" context to all validators,
 * allowing access to commonly useful contextual information from within a
 * validation rule.
 */
export class ASTValidationContext {
  _ast: DocumentNode;
  _onError: (err: GraphQLError) => void;
  _fragments: Maybe<ObjMap<FragmentDefinitionNode>>;
  _fragmentSpreads: Map<SelectionSetNode, FragmentSpreadNode[]>;
  _recursivelyReferencedFragments: Map<
    OperationDefinitionNode,
    FragmentDefinitionNode[]
  >;

  constructor(ast: DocumentNode, onError: (err: GraphQLError) => void) {
    this._ast = ast;
    this._fragments = undefined;
    this._fragmentSpreads = new Map();
    this._recursivelyReferencedFragments = new Map();
    this._onError = onError;
  }

  reportError(error: GraphQLError): void {
    this._onError(error);
  }

  getDocument(): DocumentNode {
    return this._ast;
  }

  getFragment(name: string): Maybe<FragmentDefinitionNode> {
    let fragments = this._fragments;
    if (!fragments) {
      this._fragments = fragments = this.getDocument().definitions.reduce(
        (frags, statement) => {
          if (statement.kind === Kind.FRAGMENT_DEFINITION) {
            frags[statement.name.value] = statement;
          }
          return frags;
        },
        Object.create(null),
      ) as ObjMap<FragmentDefinitionNode>;
    }
    return fragments[name];
  }

  getFragmentSpreads(
    node: SelectionSetNode,
  ): FragmentSpreadNode[] {
    let spreads = this._fragmentSpreads.get(node);
    if (!spreads) {
      spreads = [];
      const setsToVisit: SelectionSetNode[] = [node];
      while (setsToVisit.length !== 0) {
        const set = setsToVisit.pop() as SelectionSetNode;
        for (const selection of set.selections) {
          if (selection.kind === Kind.FRAGMENT_SPREAD) {
            spreads.push(selection);
          } else if (selection.selectionSet) {
            setsToVisit.push(selection.selectionSet);
          }
        }
      }
      this._fragmentSpreads.set(node, spreads);
    }
    return spreads;
  }

  getRecursivelyReferencedFragments(
    operation: OperationDefinitionNode,
  ): FragmentDefinitionNode[] {
    let fragments = this._recursivelyReferencedFragments.get(operation);
    if (!fragments) {
      fragments = [];
      const collectedNames = Object.create(null);
      const nodesToVisit: SelectionSetNode[] = [operation.selectionSet];
      while (nodesToVisit.length !== 0) {
        const node = nodesToVisit.pop() as SelectionSetNode;
        for (const spread of this.getFragmentSpreads(node)) {
          const fragName = spread.name.value;
          if (collectedNames[fragName] !== true) {
            collectedNames[fragName] = true;
            const fragment = this.getFragment(fragName);
            if (fragment) {
              fragments.push(fragment);
              nodesToVisit.push(fragment.selectionSet);
            }
          }
        }
      }
      this._recursivelyReferencedFragments.set(operation, fragments);
    }

    return fragments;
  }
}

export class SDLValidationContext extends ASTValidationContext {
  _schema: Maybe<GraphQLSchema>;

  constructor(
    ast: DocumentNode,
    schema: Maybe<GraphQLSchema>,
    onError: (err: GraphQLError) => void,
  ) {
    super(ast, onError);
    this._schema = schema;
  }

  getSchema(): Maybe<GraphQLSchema> {
    return this._schema;
  }
}

export type SDLValidationRule = (context: SDLValidationContext) => ASTVisitor;

export class ValidationContext extends ASTValidationContext {
  _schema: GraphQLSchema;
  _typeInfo: Maybe<TypeInfo>;
  _variableUsages: Map<NodeWithSelectionSet, VariableUsage[]>;
  _recursiveVariableUsages: Map<
    OperationDefinitionNode,
    VariableUsage[]
  >;

  constructor(
    schema: GraphQLSchema,
    ast: DocumentNode,
    typeInfo: Maybe<TypeInfo>,
    onError: (err: GraphQLError) => void,
  ) {
    super(ast, onError);
    this._schema = schema;
    this._typeInfo = typeInfo;
    this._variableUsages = new Map();
    this._recursiveVariableUsages = new Map();
  }

  getSchema(): GraphQLSchema {
    return this._schema;
  }

  getVariableUsages(node: NodeWithSelectionSet): VariableUsage[] {
    let usages = this._variableUsages.get(node);
    if (!usages) {
      const newUsages: {node: VariableNode, type: Maybe<GraphQLInputType>, defaultValue: any}[] = [];
      const typeInfo = new TypeInfo(this._schema);
      visit(
        node,
        visitWithTypeInfo(typeInfo, {
          VariableDefinition: () => false,
          Variable(variable) {
            newUsages.push({
              node: variable,
              type: typeInfo.getInputType(),
              defaultValue: typeInfo.getDefaultValue(),
            });
          },
        }),
      );
      usages = newUsages;
      this._variableUsages.set(node, usages);
    }
    return usages;
  }

  getRecursiveVariableUsages(
    operation: OperationDefinitionNode,
  ): VariableUsage[] {
    let usages = this._recursiveVariableUsages.get(operation);
    if (!usages) {
      usages = this.getVariableUsages(operation);
      for (const frag of this.getRecursivelyReferencedFragments(operation)) {
        usages = usages.concat(this.getVariableUsages(frag));
      }
      this._recursiveVariableUsages.set(operation, usages);
    }
    return usages;
  }

  getType(): Maybe<GraphQLOutputType> {
    return this._typeInfo?.getType();
  }

  getParentType(): Maybe<GraphQLCompositeType> {
    return this._typeInfo?.getParentType();
  }

  getInputType(): Maybe<GraphQLInputType> {
    return this._typeInfo?.getInputType();
  }

  getParentInputType(): Maybe<GraphQLInputType> {
    return this._typeInfo?.getParentInputType();
  }

  getFieldDef(): Maybe<GraphQLField<any, any>> {
    return this._typeInfo?.getFieldDef();
  }

  getDirective(): Maybe<GraphQLDirective> {
    return this._typeInfo?.getDirective();
  }

  getArgument(): Maybe<GraphQLArgument> {
    return this._typeInfo?.getArgument();
  }
}

export type ValidationRule = (context: ValidationContext) => ASTVisitor;
