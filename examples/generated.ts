import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import * as S from '@effect/schema/Schema';

import { EffectApi as Api } from '../src';

const milanSchema = S.struct({
  penisLength: S.number,
  name: S.string,
});

const lesnekSchema = S.struct({ name: S.string });

const standaSchema = S.record(S.string, S.union(S.string, S.number));

const app = pipe(
  Api.make('My awesome pets API', '1.0.0'),
  Api.get('/milan', S.string, () => Effect.succeed('test')),
  Api.getQuery('/lesnek', lesnekSchema, S.string, ({ query }) =>
    pipe(
      Effect.succeed(`hello ${query.name}`),
      Effect.tap(() => Effect.logDebug('hello world'))
    )
  ),
  Api.handle(
    Api.handleGet(
      '/test',
      {
        responseSchema: standaSchema,
        querySchema: lesnekSchema,
      },
      ({ query: { name } }) => Effect.succeed({ name })
    )
  ),
  Api.getBody('/standa', standaSchema, standaSchema, ({ body }) =>
    Effect.succeed({ ...body, standa: 'je borec' })
  ),
  Api.postBody('/milan', milanSchema, milanSchema, ({ body }) =>
    Effect.succeed({
      ...body,
      penisLength: body.penisLength + 10,
    })
  ),
  Api.listen(4000),
  Effect.flatMap(({ address, port }) =>
    Effect.logInfo(`Listening on ${address}:${port}`)
  )
);

Effect.runPromise(app);
