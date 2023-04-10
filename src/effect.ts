import express from 'express';
import { AddressInfo } from 'net';
import swaggerUi from 'swagger-ui-express';

import { flow } from '@effect/data/Function';
import { pipe } from '@effect/data/Function';
import type * as Effect from '@effect/io/Effect';
import type { Layer } from '@effect/io/Layer';
import * as S from '@effect/schema/Schema';

import * as OpenApi from './openapi';
import { OpenAPISpec, OpenAPISpecMethodName } from './types';
import { OpenAPISchemaType } from './types';

type EffectModule = typeof Effect;

type InputHandler<Query, Params, Body, Response, R> = (
  input: Input<Query, Params, Body>
) => Effect.Effect<R, AnyHandlerError, Response>;

type FinalHandler<R> = (
  req: express.Request,
  res: express.Response
) => Effect.Effect<R, AnyHandlerError, void>;

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
  handler: FinalHandler<R>;

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
  handler: InputHandler<Query, Params, Body, Response, R>,
  responseSchema: S.Schema<Response>,
  querySchema: S.Schema<Query>,
  paramsSchema: S.Schema<Params>,
  bodySchema: S.Schema<Body>,
  effect: EffectModule
): Handler<Query, Params, Body, Response, R> => ({
  handler: _toEndpoint(
    method,
    path,
    handler,
    querySchema,
    paramsSchema,
    bodySchema,
    responseSchema,
    effect
  ),
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

const _addHandler =
  <R1>(handler: AnyHandler<R1>) =>
  <R>(self: Api<R>): Api<R1 | R> => ({
    ...self,
    handlers: [...self.handlers, handler],
  });

export const get =
  <Response, R1>(
    path: string,
    responseSchema: S.Schema<Response>,
    handler: InputHandler<unknown, unknown, unknown, Response, R1>
  ) =>
  <R>(self: Api<R>): Api<R | R1> =>
    pipe(
      self,
      _addHandler(
        makeHandler(
          'get',
          path,
          handler,
          responseSchema,
          S.unknown,
          S.unknown,
          S.unknown,
          self.effect
        )
      )
    );

export const getQuery =
  <Query, Response, R1>(
    path: string,
    querySchema: S.Schema<Query>,
    responseSchema: S.Schema<Response>,
    handler: InputHandler<Query, unknown, unknown, Response, R1>
  ) =>
  <R>(self: Api<R>): Api<R | R1> =>
    pipe(
      self,
      _addHandler(
        makeHandler(
          'get',
          path,
          handler,
          responseSchema,
          querySchema,
          S.unknown,
          S.unknown,
          self.effect
        )
      )
    );

export const post =
  <Response, R1>(
    path: string,
    responseSchema: S.Schema<Response>,
    handler: InputHandler<unknown, unknown, unknown, Response, R1>
  ) =>
  <R>(self: Api<R>): Api<R | R1> =>
    pipe(
      self,
      _addHandler(
        makeHandler(
          'post',
          path,
          handler,
          responseSchema,
          S.unknown,
          S.unknown,
          S.unknown,
          self.effect
        )
      )
    );

export const postBody =
  <Body, Response, R1>(
    path: string,
    bodySchema: S.Schema<Body>,
    responseSchema: S.Schema<Response>,
    handler: InputHandler<unknown, unknown, Body, Response, R1>
  ) =>
  <R>(self: Api<R>): Api<R | R1> =>
    pipe(
      self,
      _addHandler(
        makeHandler(
          'post',
          path,
          handler,
          responseSchema,
          S.unknown,
          S.unknown,
          bodySchema,
          self.effect
        )
      )
    );

export const provideLayer =
  <R0, R>(layer: Layer<R0, AnyHandlerError, R>) =>
  (api: Api<R>): Api<R0> => ({
    ...api,
    handlers: api.handlers.map((handler) => ({
      ...handler,
      handler: (req, res) =>
        pipe(handler.handler(req, res), api.effect.provideLayer(layer)),
    })),
  });

export const notFoundError = <E>(error?: E) =>
  ({ _tag: 'NotFoundError', error } as const);

export type NotFoundError = ReturnType<typeof notFoundError>;

export const serverError = <E>(error?: E) =>
  ({ _tag: 'ServerError', error } as const);

export type ServerError = ReturnType<typeof serverError>;

type AnyHandler<R = never> = Handler<any, any, any, any, R>;

type Error = { _tag: string; error: unknown };

const invalidQueryError = <E>(error: E) =>
  ({ _tag: 'InvalidQueryError' as const, error } satisfies Error);

const invalidParamsError = <E>(error: E) =>
  ({ _tag: 'InvalidParamsError' as const, error } satisfies Error);

const invalidBodyError = <E>(error: E) =>
  ({ _tag: 'InvalidBodyError' as const, error } satisfies Error);

const invalidResponseError = <E>(error: E) =>
  ({ _tag: 'InvalidResponseError' as const, error } satisfies Error);

const unexpectedServerError = <E>(error: E) =>
  ({ _tag: 'UnexpectedServerError' as const, error } satisfies Error);

const handleApiFailure = (
  method: OpenAPISpecMethodName,
  path: string,
  error: Error,
  statusCode: number,
  res: express.Response,
  Effect: EffectModule
) =>
  pipe(
    Effect.logWarning(`${method} ${path} failed`),
    Effect.logAnnotate('errorTag', error._tag),
    Effect.logAnnotate('error', JSON.stringify(error.error, undefined)),
    Effect.flatMap(() =>
      Effect.try(() =>
        res.status(statusCode).send({
          error: error._tag,
          details: JSON.stringify(error.error, undefined),
        })
      )
    ),
    Effect.ignoreLogged
  );

const _toEndpoint = <Query, Params, Body, Response, R>(
  method: OpenAPISpecMethodName,
  path: string,
  handler: InputHandler<Query, Params, Body, Response, R>,
  querySchema: S.Schema<Query>,
  paramsSchema: S.Schema<Params>,
  bodySchema: S.Schema<Body>,
  responseSchema: S.Schema<Response>,
  Effect: EffectModule
): FinalHandler<R> => {
  const parseQuery = S.parseEffect(querySchema);
  const parseParams = S.parseEffect(paramsSchema);
  const parseBody = S.parseEffect(bodySchema);
  const encodeResponse = S.parseEffect(responseSchema);

  return (req: express.Request, res: express.Response) =>
    pipe(
      Effect.Do(),
      Effect.bind('query', () =>
        pipe(parseQuery(req.query), Effect.mapError(invalidQueryError))
      ),
      Effect.bind('params', () =>
        pipe(parseParams(req.params), Effect.mapError(invalidParamsError))
      ),
      Effect.bind('body', () =>
        pipe(parseBody(req.body), Effect.mapError(invalidBodyError))
      ),
      Effect.flatMap(handler),
      Effect.flatMap(
        flow(encodeResponse, Effect.mapError(invalidResponseError))
      ),
      Effect.flatMap((response) =>
        pipe(
          Effect.try(() => {
            res.status(200).send(response);
          }),
          Effect.mapError(unexpectedServerError)
        )
      ),
      Effect.catchTags({
        InvalidBodyError: (error) =>
          handleApiFailure(method, path, error, 400, res, Effect),
        InvalidQueryError: (error) =>
          handleApiFailure(method, path, error, 400, res, Effect),
        InvalidParamsError: (error) =>
          handleApiFailure(method, path, error, 400, res, Effect),
        InvalidResponseError: (error) =>
          handleApiFailure(method, path, error, 500, res, Effect),
        UnexpectedServerError: (error) =>
          handleApiFailure(method, path, error, 500, res, Effect),
        NotFoundError: (error) =>
          handleApiFailure(method, path, error, 404, res, Effect),
        ServerError: (error) =>
          handleApiFailure(method, path, error, 500, res, Effect),
      })
    );
};

const _handlerToRoute = (handler: AnyHandler<never>, Effect: EffectModule) =>
  express
    .Router()
    [handler.method](handler.path, (req, res) =>
      Effect.runPromise(handler.handler(req, res))
    );

const _createSpec = (self: Api<never>): OpenAPISpec<OpenAPISchemaType> => {
  return self.handlers.reduce(
    (
      spec,
      { path, method, responseSchema, querySchema, bodySchema, paramsSchema }
    ) => {
      const operationSpec = [];

      if (responseSchema !== S.unknown) {
        operationSpec.push(
          OpenApi.jsonResponse(200, responseSchema, 'Response')
        );
      }

      if (paramsSchema !== S.unknown) {
        operationSpec.push(
          OpenApi.parameter('Path parameter', 'path', paramsSchema)
        );
      }

      if (querySchema !== S.unknown) {
        operationSpec.push(
          OpenApi.parameter('Query parameter', 'query', querySchema)
        );
      }

      if (bodySchema !== S.unknown) {
        operationSpec.push(OpenApi.jsonRequest(bodySchema));
      }

      return OpenApi.path(
        path,
        OpenApi.operation(method, ...operationSpec)
      )(spec);
    },
    self.openApiSpec
  );
};

export const toExpress = (self: Api<never>): express.Express => {
  const app = express();
  app.use(express.json());

  for (const handler of self.handlers) {
    app.use(_handlerToRoute(handler, self.effect));
  }

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(_createSpec(self)));

  return app;
};

export const listen = (port: number) => (self: Api<never>) => {
  const server = toExpress(self);

  return self.effect.tryPromise(
    () =>
      new Promise<AddressInfo>((resolve, reject) => {
        const listeningServer = server.listen(port);
        listeningServer.on('listening', () =>
          resolve(listeningServer.address() as AddressInfo)
        );
        listeningServer.on('error', reject);
      })
  );
};
