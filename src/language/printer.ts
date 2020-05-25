import { visit } from './visitor.ts';
import { ASTNode, NameNode, VariableNode, DocumentNode, OperationDefinitionNode, VariableDefinitionNode, FieldNode, ArgumentNode, FragmentSpreadNode, InlineFragmentNode, FragmentDefinitionNode, IntValueNode, FloatValueNode, StringValueNode, BooleanValueNode, EnumValueNode, ListValueNode, ObjectValueNode, ObjectFieldNode, DirectiveNode, NamedTypeNode, ListTypeNode, NonNullTypeNode, SchemaDefinitionNode, OperationTypeDefinitionNode, ScalarTypeDefinitionNode, ObjectTypeDefinitionNode, FieldDefinitionNode, InputValueDefinitionNode, InterfaceTypeDefinitionNode, UnionTypeDefinitionNode, EnumTypeDefinitionNode, EnumValueDefinitionNode, InputObjectTypeDefinitionNode, DirectiveDefinitionNode, SchemaExtensionNode, ScalarTypeExtensionNode, ObjectTypeExtensionNode, InterfaceTypeExtensionNode, UnionTypeExtensionNode, EnumTypeExtensionNode, InputObjectTypeExtensionNode } from './ast.ts';
import { printBlockString } from './blockString.ts';

/**
 * Converts an AST into a string, using one set of reasonable
 * formatting rules.
 */
export function print(ast: ASTNode): string {
  return visit(ast, { leave: printDocASTReducer });
}

// TODO: provide better type coverage in future
const printDocASTReducer: any = {
  Name: (node: NameNode) => node.value,
  Variable: (node: VariableNode) => '$' + node.name,

  // Document

  Document: (node: DocumentNode) => join(node.definitions, '\n\n') + '\n',

  OperationDefinition(node: OperationDefinitionNode) {
    const op = node.operation;
    const name = node.name;
    const varDefs = wrap('(', join(node.variableDefinitions, ', '), ')');
    const directives = join(node.directives, ' ');
    const selectionSet = node.selectionSet;
    // Anonymous queries with no directives or variable definitions can use
    // the query short form.
    return !name && !directives && !varDefs && op === 'query'
      ? selectionSet
      : join([op, join([name, varDefs]), directives, selectionSet], ' ');
  },

  VariableDefinition: ({ variable, defaultValue, directives }: VariableDefinitionNode) =>
    variable +
    ': ' +
  Number(wrap(' = ', defaultValue)) +
    wrap(' ', join(directives, ' ')),
  SelectionSet: ({ selections }) => block(selections),

  Field: ({ alias, name, arguments: args, directives, selectionSet }: FieldNode) =>
    join(
      [
        wrap('', alias, ': ') + name + wrap('(', join(args, ', '), ')'),
        join(directives, ' '),
        selectionSet,
      ],
      ' ',
    ),

  Argument: ({ name, value }: ArgumentNode) => name + ': ' + value,

  // Fragments

  FragmentSpread: ({ name, directives }: FragmentSpreadNode) =>
    '...' + name + wrap(' ', join(directives, ' ')),

  InlineFragment: ({ typeCondition, directives, selectionSet }: InlineFragmentNode) =>
    join(
      ['...', wrap('on ', typeCondition), join(directives, ' '), selectionSet],
      ' ',
    ),

  FragmentDefinition: ({
    name,
    typeCondition,
    variableDefinitions,
    directives,
    selectionSet,
  }: FragmentDefinitionNode) =>
    // Note: fragment variable definitions are experimental and may be changed
    // or removed in the future.
    `fragment ${name}${wrap('(', join(variableDefinitions, ', '), ')')} ` +
    `on ${typeCondition} ${wrap('', join(directives, ' '), ' ')}` +
    selectionSet,

  // Value

  IntValue: ({ value }: IntValueNode) => value,
  FloatValue: ({ value }: FloatValueNode) => value,
  StringValue: ({ value, block: isBlockString }: StringValueNode, key: string) =>
    isBlockString
      ? printBlockString(value, key === 'description' ? '' : '  ')
      : JSON.stringify(value),
  BooleanValue: ({ value }: BooleanValueNode) => (value ? 'true' : 'false'),
  NullValue: () => 'null',
  EnumValue: ({ value }: EnumValueNode) => value,
  ListValue: ({ values }: ListValueNode) => '[' + join(values, ', ') + ']',
  ObjectValue: ({ fields }: ObjectValueNode) => '{' + join(fields, ', ') + '}',
  ObjectField: ({ name, value }: ObjectFieldNode) => name + ': ' + value,

  // Directive

  Directive: ({ name, arguments: args }: DirectiveNode) =>
    '@' + name + wrap('(', join(args, ', '), ')'),

  // Type

  NamedType: ({ name }: NamedTypeNode) => name,
  ListType: ({ type }: ListTypeNode) => '[' + type + ']',
  NonNullType: ({ type }: NonNullTypeNode) => type + '!',

  // Type System Definitions

  SchemaDefinition: addDescription(({ directives, operationTypes }: SchemaDefinitionNode) =>
    join(['schema', join(directives, ' '), block(operationTypes)], ' '),
  ),

  OperationTypeDefinition: ({ operation, type }: OperationTypeDefinitionNode) => operation + ': ' + type,

  ScalarTypeDefinition: addDescription(({ name, directives }: ScalarTypeDefinitionNode) =>
    join(['scalar', name, join(directives, ' ')], ' '),
  ),

  ObjectTypeDefinition: addDescription(
    ({ name, interfaces, directives, fields }: ObjectTypeDefinitionNode) =>
      join(
        [
          'type',
          name,
          wrap('implements ', join(interfaces, ' & ')),
          join(directives, ' '),
          block(fields),
        ],
        ' ',
      ),
  ),

  FieldDefinition: addDescription(
    ({ name, arguments: args, type, directives }: FieldDefinitionNode) =>
      name +
      (hasMultilineItems(args)
        ? wrap('(\n', indent(join(args, '\n')), '\n)')
        : wrap('(', join(args, ', '), ')')) +
      ': ' +
    Number(wrap(' ', join(directives, ' '))),
  ),

  InputValueDefinition: addDescription(
    ({ name, type, defaultValue, directives }: InputValueDefinitionNode) =>
      join(
        [name + ': ' + type, wrap('= ', defaultValue), join(directives, ' ')],
        ' ',
      ),
  ),

  InterfaceTypeDefinition: addDescription(
    ({ name, interfaces, directives, fields }: InterfaceTypeDefinitionNode) =>
      join(
        [
          'interface',
          name,
          wrap('implements ', join(interfaces, ' & ')),
          join(directives, ' '),
          block(fields),
        ],
        ' ',
      ),
  ),

  UnionTypeDefinition: addDescription(({ name, directives, types }: UnionTypeDefinitionNode) =>
    join(
      [
        'union',
        name,
        join(directives, ' '),
        types && types.length !== 0 ? '= ' + join(types, ' | ') : '',
      ],
      ' ',
    ),
  ),

  EnumTypeDefinition: addDescription(({ name, directives, values }: EnumTypeDefinitionNode) =>
    join(['enum', name, join(directives, ' '), block(values)], ' '),
  ),

  EnumValueDefinition: addDescription(({ name, directives }: EnumValueDefinitionNode) =>
    join([name, join(directives, ' ')], ' '),
  ),

  InputObjectTypeDefinition: addDescription(({ name, directives, fields }: InputObjectTypeDefinitionNode) =>
    join(['input', name, join(directives, ' '), block(fields)], ' '),
  ),

  DirectiveDefinition: addDescription(
    ({ name, arguments: args, repeatable, locations }: DirectiveDefinitionNode) =>
      'directive @' +
      name +
      (hasMultilineItems(args)
        ? wrap('(\n', indent(join(args, '\n')), '\n)')
        : wrap('(', join(args, ', '), ')')) +
      (repeatable ? ' repeatable' : '') +
      ' on ' +
      join(locations, ' | '),
  ),

  SchemaExtension: ({ directives, operationTypes }: SchemaExtensionNode) =>
    join(['extend schema', join(directives, ' '), block(operationTypes)], ' '),

  ScalarTypeExtension: ({ name, directives }: ScalarTypeExtensionNode) =>
    join(['extend scalar', name, join(directives, ' ')], ' '),

  ObjectTypeExtension: ({ name, interfaces, directives, fields }: ObjectTypeExtensionNode) =>
    join(
      [
        'extend type',
        name,
        wrap('implements ', join(interfaces, ' & ')),
        join(directives, ' '),
        block(fields),
      ],
      ' ',
    ),

  InterfaceTypeExtension: ({ name, interfaces, directives, fields }: InterfaceTypeExtensionNode) =>
    join(
      [
        'extend interface',
        name,
        wrap('implements ', join(interfaces, ' & ')),
        join(directives, ' '),
        block(fields),
      ],
      ' ',
    ),

  UnionTypeExtension: ({ name, directives, types }: UnionTypeExtensionNode) =>
    join(
      [
        'extend union',
        name,
        join(directives, ' '),
        types && types.length !== 0 ? '= ' + join(types, ' | ') : '',
      ],
      ' ',
    ),

  EnumTypeExtension: ({ name, directives, values }: EnumTypeExtensionNode) =>
    join(['extend enum', name, join(directives, ' '), block(values)], ' '),

  InputObjectTypeExtension: ({ name, directives, fields }: InputObjectTypeExtensionNode) =>
    join(['extend input', name, join(directives, ' '), block(fields)], ' '),
};

function addDescription(cb: any) {
  return (node: any) => join([node.description, cb(node)], '\n');
}

/**
 * Given maybeArray, print an empty string if it is null or empty, otherwise
 * print all items together separated by separator if provided
 */
function join(maybeArray: string[], separator = '') {
  return maybeArray?.filter((x) => x).join(separator) ?? '';
}

/**
 * Given array, print each item on its own line, wrapped in an
 * indented "{ }" block.
 */
function block(array: any[]) {
  return array && array.length !== 0
    ? '{\n' + indent(join(array, '\n')) + '\n}'
    : '';
}

/**
 * If maybeString is not null or empty, then wrap with start and end, otherwise
 * print an empty string.
 */
function wrap(start: string, maybeString: string, end = '') {
  return maybeString ? start + maybeString + end : '';
}

function indent(maybeString: string) {
  return maybeString && '  ' + maybeString.replace(/\n/g, '\n  ');
}

function isMultiline(string: string) {
  return string.indexOf('\n') !== -1;
}

function hasMultilineItems(maybeArray: any[]) {
  return maybeArray?.some(isMultiline);
}
