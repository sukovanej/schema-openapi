import * as S from '@fp-ts/schema/Schema';

export type AnySchema = S.Schema<any>;

export type OpenAPISpec<S = AnySchema> = {
  openapi: '3.0.3';
  info: OpenAPISpecInfo;
  paths: OpenAPISpecPaths<S>;
};

export type OpenAPISpecInfo = {
  title: string;
  version: string;
  description?: string;
  license?: OpenAPISpecLicense;
};

export type OpenAPISpecLicense = {
  name: string;
  url?: string;
};

export type OpenAPISpecPaths<S = AnySchema> = Record<
  string,
  OpenAPISpecPathItem<S>
>;

export const methodNames = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

export const isMethodName = (i: unknown): i is OpenAPISpecMethodName =>
  methodNames.includes(i as OpenAPISpecMethodName);

export type OpenAPISpecMethodName = (typeof methodNames)[number];

export type OpenAPISpecPathItem<S = AnySchema> = {
  [K in OpenAPISpecMethodName]?: OpenAPISpecOperation<S>;
} & {
  summary?: string;
  description?: string;
};

export type OpenAPISpecStatusCode = '200' | '201';

export type OpenAPISpecResponses<S = AnySchema> = {
  [K in OpenAPISpecStatusCode]?: OpenApiSpecResponse<S>;
};

export type OpenApiSpecContentType = 'application/json' | 'application/xml';

export type OpenApiSpecContent<S = AnySchema> = {
  [K in OpenApiSpecContentType]?: OpenApiSpecMediaType<S>;
};

export type OpenApiSpecResponse<S = AnySchema> = {
  content: OpenApiSpecContent<S>;
};

export type OpenApiSpecMediaType<S = AnySchema> = {
  schema: S;
  example?: object;
  description?: string;
};

export type OpenAPISpecRequestBody<S = AnySchema> = {
  content: OpenApiSpecContent<S>;
};

export type OpenAPISpecOperation<S = AnySchema> = {
  requestBody?: OpenAPISpecRequestBody<S>;
  responses?: OpenAPISpecResponses<S>;
  description?: string;
  summary?: string;
};

// Open API schema

export type OpenAPISchemaNullType = {
  type: 'null';
};

export type OpenAPISchemaStringType = {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  nullable?: boolean;
};

export type OpenAPISchemaNumberType = {
  type: 'number' | 'integer';
  minimum?: number;
  exclusiveMinimum?: boolean;
  maximum?: number;
  exclusiveMaximum?: boolean;
  nullable?: boolean;
};

export type OpenAPISchemaBooleanType = {
  type: 'boolean';
  nullable?: boolean;
};

export type OpenAPISchemaConstType = {
  const: string | number | boolean;
  nullable?: boolean;
};

export type OpenAPISchemaArrayType = {
  type: 'array';
  items?: OpenAPISchemaType | Array<OpenAPISchemaType>;
  minItems?: number;
  maxItems?: number;
  additionalItems?: OpenAPISchemaType;
  nullable?: boolean;
};

export type OpenAPISchemaEnumType = {
  enum: Array<string | number>;
  nullable?: boolean;
};

export type OpenAPISchemaOneOfType = {
  oneOf: ReadonlyArray<OpenAPISchemaType>;
  nullable?: boolean;
};

export type OpenAPISchemaAllOfType = {
  allOf: Array<OpenAPISchemaType>;
  nullable?: boolean;
};

export type OpenAPISchemaObjectType = {
  type: 'object';
  required?: Array<string>;
  properties?: { [x: string]: OpenAPISchemaType };
  additionalProperties?: boolean | OpenAPISchemaType;
  nullable?: boolean;
};

type OpenAPISchemaAnyType = {};

export type OpenAPISchemaType = {
  description?: string;
} & (
  | OpenAPISchemaNullType
  | OpenAPISchemaStringType
  | OpenAPISchemaNumberType
  | OpenAPISchemaBooleanType
  | OpenAPISchemaConstType
  | OpenAPISchemaArrayType
  | OpenAPISchemaEnumType
  | OpenAPISchemaOneOfType
  | OpenAPISchemaAllOfType
  | OpenAPISchemaObjectType
  | OpenAPISchemaAnyType
);
