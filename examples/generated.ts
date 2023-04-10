import * as S from '@effect/schema/Schema';
import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import * as Logger from '@effect/io/Logger';

import { EffectApi, EffectExpress } from '../src';

const milanSchema = S.struct({
  penisLength: S.number,
  name: S.string,
});

const app = pipe(
  EffectApi.make('My awesome pets API', '1.0.0', Effect),
  EffectApi.handle(
    EffectApi.get('/milan', S.string, () => Effect.succeed('test'))
  ),
  EffectApi.handle(
    EffectApi.getQuery(
      '/lesnek',
      S.struct({ name: S.string }),
      S.string,
      ({ query }) =>
        pipe(
          Effect.succeed(`hello ${query.name}`),
          Effect.tap(() => Effect.logDebug('hello world'))
        )
    )
  ),
  EffectApi.handle(
    EffectApi.postBody('/milan', milanSchema, milanSchema, ({ body }) =>
      Effect.succeed({
        ...body,
        penisLength: body.penisLength + 10,
      })
    )
  ),
  EffectApi.provideLayer(
    Logger.replace(
      Logger.defaultLogger,
      Logger.simple((message) => console.log(message))
    )
  ),
  EffectExpress.make
);

app.listen(4000, () => console.log('listening on 4000'));
