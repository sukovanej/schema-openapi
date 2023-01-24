import { openAPISchemaFor } from './compiler';
import {
  AnySchema,
  OpenAPISchemaType,
  OpenAPISpec,
  OpenApiSpecContent,
  OpenAPISpecInfo,
  OpenAPISpecMethodName,
  OpenAPISpecOperation,
  OpenAPISpecParameter,
  OpenAPISpecPathItem,
  OpenAPISpecRequestBody,
  OpenApiSpecResponse,
  OpenAPISpecServer,
  OpenAPISpecServerVariable,
  OpenAPISpecStatusCode,
} from './types';
import * as I from './internal';

export const openAPI = (
  title: string,
  version: string
): OpenAPISpec<OpenAPISchemaType> => ({
  openapi: '3.0.3',
  info: { title, version },
  paths: {},
});

export const info =
  (
    ...setters: I.Setter<OpenAPISpecInfo>[]
  ): I.Setter<OpenAPISpec<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    info: I.runSetters(spec.info, setters),
  });

export const license =
  (name: string, url?: string): I.Setter<OpenAPISpec<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    info: {
      ...spec.info,
      license: {
        url,
        name,
      },
    },
  });

export const server =
  (
    url: string,
    ...setters: I.Setter<OpenAPISpecServer>[]
  ): I.Setter<OpenAPISpec<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    servers: [...(spec.servers ?? []), I.runSetters({ url }, setters)],
  });

export const variable =
  (
    name: string,
    defaultValue: string,
    ...setters: I.Setter<OpenAPISpecServerVariable>[]
  ): I.Setter<OpenAPISpecServer> =>
  (server) => ({
    ...server,
    variables: {
      ...server.variables,
      [name]: I.runSetters({ default: defaultValue }, setters),
    },
  });

const _enum =
  (...values: string[]): I.Setter<OpenAPISpecServerVariable> =>
  (variable) => ({
    ...variable,
    enum: [...(variable.enum ?? []), ...values],
  });

export { _enum as enum };

export const path =
  (
    path: string,
    ...setters: I.Setter<OpenAPISpecPathItem<OpenAPISchemaType>>[]
  ): I.Setter<OpenAPISpec<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    paths: { ...spec.paths, [path]: I.runSetters({}, setters) },
  });

export const operation =
  (
    methodName: OpenAPISpecMethodName,
    ...setters: I.Setter<OpenAPISpecOperation<OpenAPISchemaType>>[]
  ): I.Setter<OpenAPISpecPathItem<OpenAPISchemaType>> =>
  (pathItem) => ({
    ...pathItem,
    [methodName]: {
      ...pathItem[methodName],
      ...I.runSetters({}, setters),
    },
  });

export const parameter =
  (
    name: string,
    inValue: OpenAPISpecParameter['in'],
    ...setters: I.Setter<OpenAPISpecParameter>[]
  ) =>
  <A extends { parameters?: OpenAPISpecParameter[] }>(spec: A): A => ({
    ...spec,
    parameters: [
      ...(spec.parameters ?? []),
      I.runSetters({ name, in: inValue }, setters),
    ],
  });

export const allowEmptyValue: I.Setter<OpenAPISpecParameter> = (parameter) => ({
  ...parameter,
  allowEmptyValue: true,
});

export const deprecated: I.Setter<{ deprecated?: boolean }> = (parameter) => ({
  ...parameter,
  deprecated: true,
});

export const required: I.Setter<{ required?: boolean }> = (parameter) => ({
  ...parameter,
  required: true,
});

export const jsonRequest =
  (
    schema: AnySchema,
    ...setters: I.Setter<OpenAPISpecRequestBody<OpenAPISchemaType>>[]
  ): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    requestBody: I.runSetters(
      {
        ...spec.requestBody,
        content: modifyContentJsonSchema(spec.requestBody?.content, schema),
      },
      setters
    ),
  });

export const jsonResponse =
  (
    statusCode: OpenAPISpecStatusCode,
    schema: AnySchema,
    ...setters: I.Setter<OpenApiSpecResponse<OpenAPISchemaType>>[]
  ): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    responses: {
      ...spec.responses,
      [statusCode]: I.runSetters(
        {
          ...spec.responses?.[statusCode],
          content: modifyContentJsonSchema(spec.requestBody?.content, schema),
        },
        setters
      ),
    },
  });

export const description =
  (description: string): I.Setter<{ description?: string }> =>
  (spec) => ({ ...spec, description });

export const summary =
  (summary: string): I.Setter<{ summary?: string }> =>
  (spec) => ({ ...spec, summary });

// internals

const modifyContentJsonSchema = (
  content: OpenApiSpecContent<OpenAPISchemaType> | undefined,
  schema: AnySchema
): OpenApiSpecContent<OpenAPISchemaType> => ({
  'application/json': {
    ...(content && content['application/json']),
    schema: {
      ...openAPISchemaFor(schema),
    },
  },
});
