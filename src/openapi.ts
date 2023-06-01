import { openAPISchemaFor } from 'schema-openapi/compiler';
import * as I from 'schema-openapi/internal';

import type {
  AnySchema,
  OpenAPISchemaType,
  OpenAPISpec,
  OpenAPISpecInfo,
  OpenAPISpecMethodName,
  OpenAPISpecOperation,
  OpenAPISpecParameter,
  OpenAPISpecPathItem,
  OpenAPISpecRequestBody,
  OpenAPISpecServer,
  OpenAPISpecServerVariable,
  OpenAPISpecStatusCode,
  OpenApiSpecContent,
  OpenApiSpecResponse,
} from './types';

/**
 * Initialize OpenAPI schema.
 *
 * *Available setters*: `info`
 *
 * @param {string} title - title in the info section
 * @param {string} version - version in the info section
 *
 *
 */
export const openAPI = (
  title: string,
  version: string,
  ...setters: I.Setter<OpenAPISpec<OpenAPISchemaType>>[]
): OpenAPISpec<OpenAPISchemaType> =>
  I.runSetters(
    {
      openapi: '3.0.3',
      info: { title, version },
      paths: {},
    },
    setters
  );

/**
 * Set `info` section.
 *
 * *Available setters*: `description`, `license`
 */
export const info =
  (
    ...setters: I.Setter<OpenAPISpecInfo>[]
  ): I.Setter<OpenAPISpec<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    info: I.runSetters(spec.info, setters),
  });

/**
 * Set `license` in the `info` section.
 *
 * *Setter of*: `license`
 */
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

/**
 * Set the `server` section.
 *
 * *Setter of*: `openAPI`
 * *Available setters*: `description`, `variable`
 */
export const server =
  (
    url: string,
    ...setters: I.Setter<OpenAPISpecServer>[]
  ): I.Setter<OpenAPISpec<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    servers: [...(spec.servers ?? []), I.runSetters({ url }, setters)],
  });

/**
 * Add variable to a server section.
 *
 * *Setter of*: `server`
 * *Available setters*: `description`, `enum`
 *
 * @param {string} name - name of the variable
 * @param {string} defaultValue - default value of the variable
 */
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

/**
 * Add possible values for a server variable.
 *
 * *Setter of*: `variable`
 *
 * @param {...string} values -
 */
const _enum =
  (...values: string[]): I.Setter<OpenAPISpecServerVariable> =>
  (variable) => ({
    ...variable,
    enum: [...(variable.enum ?? []), ...values],
  });

export { _enum as enum };

/**
 * Add a path to the specification.
 *
 * *Available setters*: `operation`
 * *Setter of*: `openAPI`
 *
 * @param {string} path - endpoint path
 */
export const path =
  (
    path: string,
    ...setters: I.Setter<OpenAPISpecPathItem<OpenAPISchemaType>>[]
  ): I.Setter<OpenAPISpec<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    paths: {
      ...spec.paths,
      [path]: { ...spec.paths[path], ...I.runSetters({}, setters) },
    },
  });

/**
 * Set operation. Method name can be one of `get`, `put`, `post`, `delete`,
 * `options`, `head`, `patch`, `trace`.
 *
 * *Available setters*: `parameter`, `jsonResponse`, `jsonRequest`
 * *Setter of*: `path`
 *
 * @param {OpenAPISpecMethodName} methodName - "get" | "put" ...
 */
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

/**
 * Operation parameter. One of `query`, `header`, `path`, `cookie`.
 *
 * *Available setters*: `parameter`, `jsonResponse`, `jsonRequest`
 * *Setter of*: `path`
 *
 * @param {string} name - name of the parameter
 * @param {'query' | 'header' | 'path' | 'cookie'} inValue - in
 * @param {Schema} schema - Schema for the parameter
 */
export const parameter =
  (
    name: string,
    inValue: OpenAPISpecParameter['in'],
    schema: AnySchema,
    ...setters: I.Setter<OpenAPISpecParameter<OpenAPISchemaType>>[]
  ): I.Setter<{ parameters?: OpenAPISpecParameter<OpenAPISchemaType>[] }> =>
  (spec) => ({
    ...spec,
    parameters: [
      ...(spec.parameters ?? []),
      I.runSetters(
        { name, in: inValue, schema: openAPISchemaFor(schema) },
        setters
      ),
    ],
  });

/**
 * Allow an empty value for the parameter.
 *
 * *Setter of*: `parameter`
 */
export const allowEmptyValue: I.Setter<OpenAPISpecParameter> = (parameter) => ({
  ...parameter,
  allowEmptyValue: true,
});

/**
 * Make the parameter required.
 *
 * *Setter of*: `parameter`, `jsonRequest`
 */
export const required: I.Setter<OpenAPISpecParameter> = (parameter) => ({
  ...parameter,
  required: true,
});

/**
 * Allow an empty value for the parameter.
 *
 * *Setter of*: `parameter`
 */
export const deprecated: I.Setter<{ deprecated?: boolean }> = (parameter) => ({
  ...parameter,
  deprecated: true,
});

/**
 * Set JSON request.
 *
 * *Avaialble setter*: `description`, `required`
 * *Setter of*: `operation`
 *
 * @param {Schema} content - schema for the request body
 */
export const jsonRequest =
  (
    content: AnySchema,
    ...setters: I.Setter<OpenAPISpecRequestBody<OpenAPISchemaType>>[]
  ): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    requestBody: I.runSetters(
      {
        ...spec.requestBody,
        content: modifyContentJsonSchema(spec.requestBody?.content, content),
      },
      setters
    ),
  });

/**
 * Set JSON response for a HTTP status code.
 *
 * *Avaialble setter*: `description`
 * *Setter of*: `operation`
 *
 * @param {OpenAPISpecStatusCode} statusCode - HTTP status code
 * @param {Schema} contentSchema - schema for the request body
 * @param {string} description - desciprition of the response
 */
export const jsonResponse =
  (
    statusCode: OpenAPISpecStatusCode,
    contentSchema: AnySchema,
    description: string,
    ...setters: I.Setter<OpenApiSpecResponse<OpenAPISchemaType>>[]
  ): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    responses: {
      ...spec.responses,
      [statusCode]: I.runSetters(
        {
          ...spec.responses?.[statusCode],
          content: modifyContentJsonSchema(
            spec.requestBody?.content,
            contentSchema
          ),
          description,
        },
        setters
      ),
    },
  });

/**
 * Adds operation tags.
 *
 * *Setter of*: `operation`
 *
 * @param {...string} tags - one of more tag values
 */
export const tags =
  (
    tag: string,
    ...tags: string[]
  ): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    tags: [...(spec.tags ?? []), tag, ...tags],
  });

/**
 * Set operationId.
 *
 * @param {string} operationId
 */
export const operationId =
  (operationId: string): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
  (spec) => ({ ...spec, operationId });

/**
 * Set description.
 *
 * @param {string} description - text of the description
 */
export const description =
  (description: string): I.Setter<{ description?: string }> =>
  (spec) => ({ ...spec, description });

/**
 * Set description.
 *
 * @param {string} summary - text of the summary
 */
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
