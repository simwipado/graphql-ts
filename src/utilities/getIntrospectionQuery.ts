import { DirectiveLocationEnum } from '../language/directiveLocation.ts';
import Maybe from '../tsutils/Maybe.ts';

export interface IntrospectionOptions {
  // Whether to include descriptions in the introspection result.
  // Default: true
  descriptions?: boolean;

  // Whether to include `specifiedByUrl` in the introspection result.
  // Default: false
  specifiedByUrl?: boolean;

  // Whether to include `isRepeatable` flag on directives.
  // Default: false
  directiveIsRepeatable?: boolean;

  // Whether to include `description` field on schema.
  // Default: false
  schemaDescription?: boolean;
}

export function getIntrospectionQuery(options?: IntrospectionOptions): string {
  const optionsWithDefault = {
    descriptions: true,
    specifiedByUrl: false,
    directiveIsRepeatable: false,
    schemaDescription: false,
    ...options,
  };

  const descriptions = optionsWithDefault.descriptions ? 'description' : '';
  const specifiedByUrl = optionsWithDefault.specifiedByUrl
    ? 'specifiedByUrl'
    : '';
  const directiveIsRepeatable = optionsWithDefault.directiveIsRepeatable
    ? 'isRepeatable'
    : '';
  const schemaDescription = optionsWithDefault.schemaDescription
    ? descriptions
    : '';

  return `
    query IntrospectionQuery {
      __schema {
        ${schemaDescription}
        queryType { name }
        mutationType { name }
        subscriptionType { name }
        types {
          ...FullType
        }
        directives {
          name
          ${descriptions}
          ${directiveIsRepeatable}
          locations
          args {
            ...InputValue
          }
        }
      }
    }

    fragment FullType on __Type {
      kind
      name
      ${descriptions}
      ${specifiedByUrl}
      fields(includeDeprecated: true) {
        name
        ${descriptions}
        args {
          ...InputValue
        }
      {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
      inputFields {
        ...InputValue
      }
      interfaces {
        ...TypeRef
      }
      enumValues(includeDeprecated: true) {
        name
        ${descriptions}
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        ...TypeRef
      }
    }

    fragment InputValue on __InputValue {
      name
      ${descriptions}
    { ...TypeRef }
      defaultValue
    }

    fragment TypeRef on __Type {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
}

export interface IntrospectionQuery {
  __schema: IntrospectionSchema;
}

export interface IntrospectionSchema {
  queryType: IntrospectionNamedTypeRef<IntrospectionObjectType>;
  mutationType: Maybe<
    IntrospectionNamedTypeRef<IntrospectionObjectType>
  >;
  subscriptionType: Maybe<
    IntrospectionNamedTypeRef<IntrospectionObjectType>
  >;
  types: IntrospectionType[];
  directives: IntrospectionDirective[];
}

export type IntrospectionType =
  | IntrospectionScalarType
  | IntrospectionObjectType
  | IntrospectionInterfaceType
  | IntrospectionUnionType
  | IntrospectionEnumType
  | IntrospectionInputObjectType;

export type IntrospectionOutputType =
  | IntrospectionScalarType
  | IntrospectionObjectType
  | IntrospectionInterfaceType
  | IntrospectionUnionType
  | IntrospectionEnumType;

export type IntrospectionInputType =
  | IntrospectionScalarType
  | IntrospectionEnumType
  | IntrospectionInputObjectType;

export interface IntrospectionScalarType {
  kind: 'SCALAR';
  name: string;
  description?: Maybe<string>;
  specifiedByUrl?: Maybe<string>;
}

export interface IntrospectionObjectType {
  kind: 'OBJECT';
  name: string;
  description?: Maybe<string>;
  fields: IntrospectionField[];
  interfaces: ReadonlyArray<
    IntrospectionNamedTypeRef<IntrospectionInterfaceType>
  >;
}

export interface IntrospectionInterfaceType {
  kind: 'INTERFACE';
  name: string;
  description?: Maybe<string>;
  fields: IntrospectionField[];
  interfaces: ReadonlyArray<
    IntrospectionNamedTypeRef<IntrospectionInterfaceType>
  >;
  possibleTypes: ReadonlyArray<
    IntrospectionNamedTypeRef<IntrospectionObjectType>
  >;
}

export interface IntrospectionUnionType {
  kind: 'UNION';
  name: string;
  description?: Maybe<string>;
  possibleTypes: ReadonlyArray<
    IntrospectionNamedTypeRef<IntrospectionObjectType>
  >;
}

export interface IntrospectionEnumType {
  kind: 'ENUM';
  name: string;
  description?: Maybe<string>;
  enumValues: IntrospectionEnumValue[];
}

export interface IntrospectionInputObjectType {
  kind: 'INPUT_OBJECT';
  name: string;
  description?: Maybe<string>;
  inputFields: IntrospectionInputValue[];
}

export interface IntrospectionListTypeRef<
  T extends IntrospectionTypeRef = IntrospectionTypeRef
> {
  kind: 'LIST';
  ofType: T;
}

export interface IntrospectionNonNullTypeRef<
  T extends IntrospectionTypeRef = IntrospectionTypeRef
> {
  kind: 'NON_NULL';
  ofType: T;
}

export type IntrospectionTypeRef =
  | IntrospectionNamedTypeRef
  | IntrospectionListTypeRef<any>
  | IntrospectionNonNullTypeRef<
      IntrospectionNamedTypeRef | IntrospectionListTypeRef<any>
    >;

export type IntrospectionOutputTypeRef =
  | IntrospectionNamedTypeRef<IntrospectionOutputType>
  | IntrospectionListTypeRef<any>
  | IntrospectionNonNullTypeRef<
      | IntrospectionNamedTypeRef<IntrospectionOutputType>
      | IntrospectionListTypeRef<any>
    >;

export type IntrospectionInputTypeRef =
  | IntrospectionNamedTypeRef<IntrospectionInputType>
  | IntrospectionListTypeRef<any>
  | IntrospectionNonNullTypeRef<
      | IntrospectionNamedTypeRef<IntrospectionInputType>
      | IntrospectionListTypeRef<any>
    >;

export interface IntrospectionNamedTypeRef<
  T extends IntrospectionType = IntrospectionType
> {
  kind: T['kind'];
  name: string;
}

export interface IntrospectionField {
  name: string;
  description?: Maybe<string>;
  args: IntrospectionInputValue[];
  type: IntrospectionOutputTypeRef;
  isDeprecated: boolean;
  deprecationReason?: Maybe<string>;
}

export interface IntrospectionInputValue {
  name: string;
  description?: Maybe<string>;
  type: IntrospectionInputTypeRef;
  defaultValue?: Maybe<string>;
}

export interface IntrospectionEnumValue {
  name: string;
  description?: Maybe<string>;
  isDeprecated: boolean;
  deprecationReason?: Maybe<string>;
}

export interface IntrospectionDirective {
  name: string;
  description?: Maybe<string>;
  isRepeatable?: boolean;
  locations: DirectiveLocationEnum[];
  args: IntrospectionInputValue[];
}
