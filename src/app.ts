import * as S from '@fp-ts/schema/Schema';
import * as OA from './openapi';
import * as I from './internal';
import {
  OpenAPISchemaType,
  OpenAPISpec,
  OpenAPISpecMethodName,
  OpenAPISpecOperation,
  OpenAPISpecStatusCode,
} from './types';

type Response<S> = { statusCode: OpenAPISpecStatusCode; body: S.Schema<S> };

type Schemas<B = any, R = any> = {
  body?: S.Schema<B>;
  responses: readonly Response<R>[];
};

export type Path = {
  path: string;
  schemas: Schemas;
  methodName: OpenAPISpecMethodName;
  func: HandlerFunc;
};

type HandlerFuncResponse<R> = {
  statusCode: OpenAPISpecStatusCode;
  body: R;
};

type HandlerFunc<B = any, R = any> = (body: B) => HandlerFuncResponse<R> | void;

export type OpenAPIApp = {
  spec: OpenAPISpec<OpenAPISchemaType>;
  paths: readonly Path[];
};

export const openAPIApp = (
  spec: OpenAPISpec<OpenAPISchemaType>
): OpenAPIApp => ({
  spec,
  paths: [],
});

export const get = <A, R>(
  path: string,
  schemas: Schemas<A, R>,
  func: HandlerFunc
) => createPath('get', path, schemas, func);

export const post = <A, R>(
  path: string,
  schemas: Schemas<A, R>,
  func: HandlerFunc<A, R>
) => createPath('post', path, schemas, func);

const createPath =
  <B, R>(
    methodName: OpenAPISpecMethodName,
    path: string,
    schemas: Schemas<B, R>,
    func: HandlerFunc<B, R>
  ): I.Setter<OpenAPIApp> =>
  (app) => {
    const setters: Array<I.Setter<OpenAPISpecOperation<OpenAPISchemaType>>> =
      [];

    if (schemas.body) {
      setters.push(OA.jsonRequest(schemas.body));
    }

    schemas.responses.forEach((response) => {
      const setter = OA.jsonResponse(
        response.statusCode,
        response.body,
        `${response.statusCode} response`
      );
      setters.push(setter);
    });

    const spec = OA.path(path, OA.operation(methodName, ...setters));

    const newPath = {
      func,
      path,
      methodName,
      schemas,
    } satisfies Path;

    return { ...app, spec: spec(app.spec), paths: [...app.paths, newPath] };
  };
