import * as S from '@effect/schema/Schema';

import { openAPISchemaFor } from '../src/compiler';

// https://swagger.io/docs/specification/data-models/dictionaries/

describe('records', () => {
  it('string to string map', () => {
    const schema = S.record(S.string, S.string);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
    });
  });

  it('string to object map', () => {
    const schema = S.record(
      S.string,
      S.struct({ code: S.optional(S.number), text: S.optional(S.string) })
    );

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          code: {
            type: 'number',
          },
          text: {
            type: 'string',
          },
        },
      },
    });
  });
});
