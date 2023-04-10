import express from 'express';
import * as S from '@effect/schema/Schema';
import * as OpenApi from './openapi';
import { OpenAPISpec } from './types';
import { OpenAPISchemaType } from './types';
import * as Effect from '@effect/io/Effect';
import * as EffectApi from './effect';
import { flow, pipe } from '@effect/data/Function';
import swaggerUi from 'swagger-ui-express';

type AnyHandler = EffectApi.Handler<
  unknown,
  unknown,
  unknown,
  unknown,
  never,
  unknown
>;

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
  handler: AnyHandler,
  error: Error,
  statusCode: number,
  res: express.Response
) =>
  pipe(
    Effect.logWarning(`${handler.method} ${handler.path} failed`),
    Effect.logAnnotate('errorTag', error._tag),
    Effect.logAnnotate('error', JSON.stringify(error.error, undefined)),
    Effect.flatMap(() =>
      Effect.sync(() =>
        res.status(statusCode).send({
          error: error._tag,
          details: JSON.stringify(error.error, undefined),
        })
      )
    )
  );

const runEndpoint = (handler: AnyHandler) => {
  const parseQuery = S.parseEffect(handler.querySchema);
  const parseParams = S.parseEffect(handler.paramsSchema);
  const parseBody = S.parseEffect(handler.bodySchema);
  const encodeResponse = S.parseEffect(handler.responseSchema);

  return (req: express.Request, res: express.Response) => {
    return pipe(
      Effect.Do(),
      Effect.tap(() => Effect.logDebug(`Accessed ${handler.path}`)),
      Effect.bind('query', () =>
        pipe(parseQuery(req.query), Effect.mapError(invalidQueryError))
      ),
      Effect.bind('params', () =>
        pipe(parseParams(req.params), Effect.mapError(invalidParamsError))
      ),
      Effect.bind('body', () =>
        pipe(parseBody(req.body), Effect.mapError(invalidBodyError))
      ),
      Effect.flatMap((input) =>
        pipe(handler.handler(input), Effect.mapError(unexpectedServerError))
      ),
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
        InvalidBodyError: (error) => handleApiFailure(handler, error, 400, res),
        InvalidQueryError: (error) =>
          handleApiFailure(handler, error, 400, res),
        InvalidParamsError: (error) =>
          handleApiFailure(handler, error, 400, res),
        InvalidResponseError: (error) =>
          handleApiFailure(handler, error, 500, res),
        UnexpectedServerError: (error) =>
          handleApiFailure(handler, error, 500, res),
      }),
      Effect.runPromise
    );
  };
};

const _handlerToRoute = (handler: AnyHandler) =>
  express.Router()[handler.method](handler.path, runEndpoint(handler));

const _createSpec = (
  self: EffectApi.Api<never>
): OpenAPISpec<OpenAPISchemaType> => {
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

export const make = (self: EffectApi.Api<never>): express.Express => {
  const app = express();
  app.use(express.json());

  for (const handler of self.handlers) {
    app.use(_handlerToRoute(handler));
  }

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(_createSpec(self)));

  return app;
};
