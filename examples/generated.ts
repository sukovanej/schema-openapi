import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import * as S from '@effect/schema/Schema';

import { EffectApi } from '../src';

const milanSchema = S.struct({
  penisLength: S.number,
  name: S.string,
});

const app = pipe(
  EffectApi.make('My awesome pets API', '1.0.0', Effect),
  EffectApi.get('/milan', S.string, () => Effect.succeed('test')),
  EffectApi.getQuery(
    '/lesnek',
    S.struct({ name: S.string }),
    S.string,
    ({ query }) =>
      pipe(
        Effect.succeed(`hello ${query.name}`),
        Effect.tap(() => Effect.logDebug('hello world'))
      )
  ),
  EffectApi.postBody('/milan', milanSchema, milanSchema, ({ body }) =>
    Effect.succeed({
      ...body,
      penisLength: body.penisLength + 10,
    })
  ),
  EffectApi.listen(4000),
  Effect.flatMap(({address, port}) => Effect.logInfo(`Listening on ${address}:${port}`))
);

Effect.runPromise(app);
