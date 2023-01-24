import { openAPISchemaFor } from './compiler';
import {
  AnySchema,
  isMethodName,
  OpenAPISchemaType,
  OpenAPISpec,
  OpenApiSpecContent,
  OpenApiSpecContentType,
  OpenAPISpecInfo,
  OpenAPISpecMethodName,
  OpenAPISpecOperation,
  OpenAPISpecParameter,
  OpenAPISpecPathItem,
  OpenAPISpecPaths,
  OpenAPISpecRequestBody,
  OpenApiSpecResponse,
  OpenAPISpecResponses,
  OpenAPISpecServer,
  OpenAPISpecServerVariable,
  OpenAPISpecStatusCode,
} from './types';
import * as I from './internal';

export const createOpenAPI = (spec: OpenAPISpec) => {
  const paths = createPaths(spec.paths);

  return { ...spec, paths };
};

const createPaths = (pathItems: OpenAPISpecPaths) =>
  Object.keys(pathItems).reduce(
    (acc, pathItem) => ({
      ...acc,
      [pathItem]: createPathItem(pathItems[pathItem]),
    }),
    {}
  ) as { [K in keyof OpenAPISpecPaths]: ReturnType<typeof createPathItem> };

const createPathItem = (pathItem: OpenAPISpecPathItem) => {
  return (Object.keys(pathItem) as (keyof OpenAPISpecPathItem)[]).reduce(
    (acc, key) => ({
      ...acc,
      [key]: isMethodName(key)
        ? createOperation(pathItem[key]!)
        : pathItem[key],
    }),
    {}
  ) as {
    [K in keyof OpenAPISpecPathItem]: K extends OpenAPISpecMethodName
      ? ReturnType<typeof createOperation>
      : (typeof pathItem)[K];
  };
};

const createOperation = (operation: OpenAPISpecOperation) => {
  let responses = undefined;
  let requestBody = undefined;

  if ('responses' in operation && operation.responses !== undefined) {
    responses = createResponses(operation.responses);
  }

  if ('requestBody' in operation && operation.requestBody !== undefined) {
    requestBody = createRequestBody(operation.requestBody);
  }

  const responsesObj = responses && { responses };
  const requestBodyObj = requestBody && { requestBody };

  return { ...operation, ...responsesObj, ...requestBodyObj };
};

const createRequestBody = (requestBody: OpenAPISpecRequestBody) => ({
  ...requestBody,
  content: createContentMap(requestBody.content),
});

const createResponses = (responses: OpenAPISpecResponses) =>
  (Object.keys(responses) as (keyof OpenAPISpecResponses)[]).reduce(
    (acc, statusCode) => ({
      ...acc,
      [statusCode]: createResponse(responses[statusCode]!),
    }),
    {}
  );

const createResponse = (requestBody: OpenApiSpecResponse) => ({
  ...requestBody,
  content: createContentMap(requestBody.content),
});

const createContentMap = (content: OpenApiSpecContent) =>
  (Object.keys(content) as OpenApiSpecContentType[]).reduce(
    (acc, mediaType) => ({
      ...acc,
      [mediaType]: {
        ...content[mediaType],
        schema: openAPISchemaFor(content[mediaType]!.schema),
      },
    }),
    {}
  );

// Pipeable API

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

export const deprecated = <A extends { deprecated?: boolean }>(
  parameter: A
): A => ({
  ...parameter,
  deprecated,
});

export const required: I.Setter<OpenAPISpecParameter> = (parameter) => ({
  ...parameter,
  required: true,
});

export const jsonRequest =
  (
    schema: AnySchema,
    description?: string
  ): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    requestBody: {
      ...spec.requestBody,
      content: modifyContentJsonSchema(
        spec.requestBody?.content,
        schema,
        description
      ),
    },
  });

export const jsonResponse =
  (
    statusCode: OpenAPISpecStatusCode,
    schema: AnySchema,
    description?: string
  ): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
  (spec) => ({
    ...spec,
    responses: {
      ...spec.responses,
      [statusCode]: {
        ...(spec.responses && spec.responses[statusCode]),
        content: modifyContentJsonSchema(
          spec.requestBody?.content,
          schema,
          description
        ),
      },
    },
  });

export const description =
  (description: string) =>
  <A extends { description?: string }>(spec: A): A => ({
    ...spec,
    description,
  });

export const summary =
  (summary: string) =>
  <A extends { summary?: string }>(spec: A): A => ({ ...spec, summary });

// internals

const modifyContentJsonSchema = (
  content: OpenApiSpecContent<OpenAPISchemaType> | undefined,
  schema: AnySchema,
  description: string | undefined
): OpenApiSpecContent<OpenAPISchemaType> => ({
  'application/json': {
    ...(content && content['application/json']),
    schema: {
      ...openAPISchemaFor(schema),
      ...(description && { description }),
    },
  },
});
