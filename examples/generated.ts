import * as OA from '../src';
import * as S from '@effect/schema/Schema';
import { pipe } from '@effect/data/Function';
import express from 'express';

const milanSchema = S.struct({
  penisLength: S.number,
  name: S.string,
});

const responseSchema = S.string;

const app = pipe(
  OA.openAPIApp(
    OA.openAPI(
      'My awesome pets API',
      '1.0.0',
      OA.server('http://localhost:4000')
    )
  ),
  OA.get(
    '/milan',
    { responses: [{ statusCode: 200, body: responseSchema }] },
    () => ({
      statusCode: 200,
      body: 'test',
    })
  ),
  OA.post(
    '/milan',
    {
      responses: [{ statusCode: 200, body: responseSchema }],
      body: milanSchema,
    },
    (body) => ({
      statusCode: 200,
      body: `Hello ${body.name}`,
    })
  )
);

const expressApp = express();
OA.registerExpress(expressApp, app);
expressApp.listen(4000, () => console.log('listening on 4000'));
