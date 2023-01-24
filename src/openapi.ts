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
  OpenAPISpecPathItem,
  OpenAPISpecPaths,
  OpenAPISpecRequestBody,
  OpenApiSpecResponse,
  OpenAPISpecResponses,
  OpenAPISpecStatusCode,
} from './types';

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
  (setInfo: (info: OpenAPISpecInfo) => OpenAPISpecInfo) =>
  (spec: OpenAPISpec<OpenAPISchemaType>): OpenAPISpec<OpenAPISchemaType> => ({
    ...spec,
    info: setInfo(spec.info),
  });

export const license =
  (name: string, url: string | undefined = undefined) =>
  (spec: OpenAPISpec<OpenAPISchemaType>): OpenAPISpec<OpenAPISchemaType> => ({
    ...spec,
    info: {
      ...spec.info,
      license: {
        url,
        name,
      },
    },
  });

export const addPath =
  (
    path: string,
    setPathItem: (
      spec: OpenAPISpecPathItem<OpenAPISchemaType>
    ) => OpenAPISpecPathItem<OpenAPISchemaType>
  ) =>
  (spec: OpenAPISpec<OpenAPISchemaType>): OpenAPISpec<OpenAPISchemaType> => ({
    ...spec,
    paths: { ...spec.paths, [path]: setPathItem({}) },
  });

export const addOperation =
  (
    methodName: OpenAPISpecMethodName,
    setOperation: (
      spec: OpenAPISpecOperation<OpenAPISchemaType>
    ) => OpenAPISpecOperation<OpenAPISchemaType>
  ) =>
  (
    pathItem: OpenAPISpecPathItem<OpenAPISchemaType>
  ): OpenAPISpecPathItem<OpenAPISchemaType> => ({
    ...pathItem,
    [methodName]: {
      ...pathItem[methodName],
      ...setOperation({}),
    },
  });

export const setJsonRequestBody =
  (schema: AnySchema, description?: string) =>
  (
    spec: OpenAPISpecOperation<OpenAPISchemaType>
  ): OpenAPISpecOperation<OpenAPISchemaType> => ({
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

export const setJsonResponse =
  (
    statusCode: OpenAPISpecStatusCode,
    schema: AnySchema,
    description?: string
  ) =>
  (
    spec: OpenAPISpecOperation<OpenAPISchemaType>
  ): OpenAPISpecOperation<OpenAPISchemaType> => ({
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

export const setDescription =
  (description: string) =>
  <A extends { description?: string }>(spec: A): A => ({
    ...spec,
    description,
  });

export const setSummary =
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
