import * as Effect from '@effect/io/Effect';
import * as S from '@effect/schema/Schema';
import { OpenAPISpec, OpenAPISpecMethodName } from './types';
import { OpenAPISchemaType } from './types';
import * as OpenApi from './openapi';

export interface Api<R> {
  openApiSpec: OpenAPISpec<OpenAPISchemaType>;
  handlers: readonly Handler<unknown, unknown, unknown, unknown, R, unknown>[];
}

export interface Input<Query, Params, Body> {
  query: Query;
  params: Params;
  body: Body;
}

export type BodyInput<Body> = Input<never, never, Body>;
export type QueryInput<Query> = Input<Query, never, never>;

export interface Handler<Query, Params, Body, Response, R, E> {
  handler: (input: Input<Query, Params, Body>) => Effect.Effect<R, E, Response>;

  querySchema: S.Schema<Query>;
  paramsSchema: S.Schema<Params>;
  bodySchema: S.Schema<Body>;
  responseSchema: S.Schema<Response>;

  method: OpenAPISpecMethodName;
  path: string;
}

const makeHandler = <Query, Params, Body, Response, R, E>(
  method: OpenAPISpecMethodName,
  path: string,
  handler: (input: Input<Query, Params, Body>) => Effect.Effect<R, E, Response>,
  responseSchema: S.Schema<Response>,
  querySchema: S.Schema<Query>,
  paramsSchema: S.Schema<Params>,
  bodySchema: S.Schema<Body>
): Handler<Query, Params, Body, Response, R, E> => ({
  handler,
  querySchema,
  paramsSchema,
  bodySchema,
  responseSchema,
  method,
  path,
});

export const make = (title: string, version: string): Api<never> => ({
  openApiSpec: OpenApi.openAPI(title, version),
  handlers: [],
});

export const handle =
  <R2>(handler: Handler<any, any, any, any, R2, any>) =>
  <R1>(self: Api<R1>): Api<R1 | R2> => ({
    ...self,
    handlers: [...self.handlers, handler],
  });

export const get = <Response, R, E>(
  path: string,
  responseSchema: S.Schema<Response>,
  handler: (
    input: Input<unknown, unknown, unknown>
  ) => Effect.Effect<R, E, Response>
): Handler<unknown, unknown, unknown, Response, R, E> =>
  makeHandler(
    'get',
    path,
    handler,
    responseSchema,
    S.unknown,
    S.unknown,
    S.unknown
  );

export const getQuery = <Query, Response, R, E>(
  path: string,
  querySchema: S.Schema<Query>,
  responseSchema: S.Schema<Response>,
  handler: (
    input: Input<Query, unknown, unknown>
  ) => Effect.Effect<R, E, Response>
): Handler<Query, unknown, unknown, Response, R, E> =>
  makeHandler(
    'get',
    path,
    handler,
    responseSchema,
    querySchema,
    S.unknown,
    S.unknown
  );

export const post = <Response, R, E>(
  path: string,
  responseSchema: S.Schema<Response>,
  handler: (
    input: Input<unknown, unknown, unknown>
  ) => Effect.Effect<R, E, Response>
): Handler<unknown, unknown, unknown, Response, R, E> =>
  makeHandler(
    'post',
    path,
    handler,
    responseSchema,
    S.unknown,
    S.unknown,
    S.unknown
  );

export const postBody = <Body, Response, R, E>(
  path: string,
  bodySchema: S.Schema<Body>,
  responseSchema: S.Schema<Response>,
  handler: (
    input: Input<unknown, unknown, Body>
  ) => Effect.Effect<R, E, Response>
): Handler<unknown, unknown, Body, Response, R, E> =>
  makeHandler(
    'post',
    path,
    handler,
    responseSchema,
    S.unknown,
    S.unknown,
    bodySchema
  );
