import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import { Layer } from '@effect/io/Layer';
import * as S from '@effect/schema/Schema';

import * as OpenApi from './openapi';
import { OpenAPISpec, OpenAPISpecMethodName } from './types';
import { OpenAPISchemaType } from './types';

export interface Api<R> {
  openApiSpec: OpenAPISpec<OpenAPISchemaType>;
  handlers: readonly Handler<unknown, unknown, unknown, unknown, R>[];
  effect: typeof Effect;
}

export interface Input<Query, Params, Body> {
  query: Query;
  params: Params;
  body: Body;
}

export type BodyInput<Body> = Input<unknown, unknown, Body>;
export type QueryInput<Query> = Input<Query, unknown, unknown>;

export type AnyHandlerError = NotFoundError | ServerError;

export interface Handler<Query, Params, Body, Response, R> {
  handler: (
    input: Input<Query, Params, Body>
  ) => Effect.Effect<R, AnyHandlerError, Response>;

  querySchema: S.Schema<Query>;
  paramsSchema: S.Schema<Params>;
  bodySchema: S.Schema<Body>;
  responseSchema: S.Schema<Response>;

  method: OpenAPISpecMethodName;
  path: string;
}

const makeHandler = <Query, Params, Body, Response, R>(
  method: OpenAPISpecMethodName,
  path: string,
  handler: (
    input: Input<Query, Params, Body>
  ) => Effect.Effect<R, AnyHandlerError, Response>,
  responseSchema: S.Schema<Response>,
  querySchema: S.Schema<Query>,
  paramsSchema: S.Schema<Params>,
  bodySchema: S.Schema<Body>
): Handler<Query, Params, Body, Response, R> => ({
  handler,
  querySchema,
  paramsSchema,
  bodySchema,
  responseSchema,
  method,
  path,
});

export const make = (
  title: string,
  version: string,
  effect: typeof Effect
): Api<never> => ({
  openApiSpec: OpenApi.openAPI(title, version),
  handlers: [],
  effect,
});

export const handle =
  <R2>(handler: Handler<any, any, any, any, R2>) =>
  <R1>(self: Api<R1>): Api<R1 | R2> => ({
    ...self,
    handlers: [...self.handlers, handler],
  });

export const get = <Response, R>(
  path: string,
  responseSchema: S.Schema<Response>,
  handler: (
    input: Input<unknown, unknown, unknown>
  ) => Effect.Effect<R, AnyHandlerError, Response>
): Handler<unknown, unknown, unknown, Response, R> =>
  makeHandler(
    'get',
    path,
    handler,
    responseSchema,
    S.unknown,
    S.unknown,
    S.unknown
  );

export const getQuery = <Query, Response, R>(
  path: string,
  querySchema: S.Schema<Query>,
  responseSchema: S.Schema<Response>,
  handler: (
    input: Input<Query, unknown, unknown>
  ) => Effect.Effect<R, AnyHandlerError, Response>
): Handler<Query, unknown, unknown, Response, R> =>
  makeHandler(
    'get',
    path,
    handler,
    responseSchema,
    querySchema,
    S.unknown,
    S.unknown
  );

export const post = <Response, R>(
  path: string,
  responseSchema: S.Schema<Response>,
  handler: (
    input: Input<unknown, unknown, unknown>
  ) => Effect.Effect<R, AnyHandlerError, Response>
): Handler<unknown, unknown, unknown, Response, R> =>
  makeHandler(
    'post',
    path,
    handler,
    responseSchema,
    S.unknown,
    S.unknown,
    S.unknown
  );

export const postBody = <Body, Response, R>(
  path: string,
  bodySchema: S.Schema<Body>,
  responseSchema: S.Schema<Response>,
  handler: (
    input: Input<unknown, unknown, Body>
  ) => Effect.Effect<R, AnyHandlerError, Response>
): Handler<unknown, unknown, Body, Response, R> =>
  makeHandler(
    'post',
    path,
    handler,
    responseSchema,
    S.unknown,
    S.unknown,
    bodySchema
  );

export const provideLayer =
  <R0, R>(layer: Layer<R0, AnyHandlerError, R>) =>
  (api: Api<R>): Api<R0> => ({
    ...api,
    handlers: api.handlers.map((handler) => ({
      ...handler,
      handler: (i) => pipe(handler.handler(i), api.effect.provideLayer(layer)),
    })),
  });

export const notFoundError = <E>(error?: E) =>
  ({ _tag: 'NotFoundError', error } as const);

export type NotFoundError = ReturnType<typeof notFoundError>;

export const serverError = <E>(error?: E) =>
  ({ _tag: 'ServerError', error } as const);

export type ServerError = ReturnType<typeof serverError>;
