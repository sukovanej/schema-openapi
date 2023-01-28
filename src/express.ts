import express from 'express';
import swaggerUi from 'swagger-ui-express';
import * as P from '@fp-ts/schema/Parser';
import * as E from '@fp-ts/core/Either';
import { formatErrors } from '@fp-ts/schema/formatter/Tree';
import { OpenAPIApp, Path } from './app';

export const registerExpress = (
  expressApp: express.Express,
  app: OpenAPIApp
): express.Express => {
  expressApp.use(express.json());

  for (const path of app.paths) {
    registerExpressPath(expressApp, path);
  }

  expressApp.use('/docs', swaggerUi.serve, swaggerUi.setup(app.spec));

  return expressApp;
};

const registerExpressPath = (expressApp: express.Express, path: Path) => {
  switch (path.methodName) {
    case 'get':
      expressApp.get(path.path, createExpressHandler(path));
      break;
    case 'post':
      expressApp.post(path.path, createExpressHandler(path));
      break;
    default:
      throw new Error(`Not implemented for ${path.methodName}`);
  }
};

const createExpressHandler =
  (path: Path): express.Handler =>
  (req, res) => {
    let body = undefined;

    if (path.schemas.body !== undefined) {
      const maybeBody = P.decode(path.schemas.body)(req.body);

      if (E.isLeft(maybeBody)) {
        res.status(400).send({
          error: 'BadRequest',
          in: 'body',
          message: formatErrors(maybeBody.left),
        });
        return;
      }

      body = maybeBody.right;
    }

    const response = path.func(body);

    if (response === undefined) {
      res.status(204).send();
      return;
    }

    const responseSchema = path.schemas.responses[response.statusCode];

    if (responseSchema !== undefined) {
      const maybeResponse = P.encode(responseSchema)(response.body);

      if (E.isLeft(maybeResponse)) {
        res.status(500).send({ error: 'ServerInternal' });
        return;
      } else {
        res.status(response.statusCode).send(maybeResponse.right);
        return;
      }
    }

    res.status(response.statusCode).send(response.body);
  };
