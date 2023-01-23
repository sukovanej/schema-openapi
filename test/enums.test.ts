import { pipe } from '@fp-ts/data/Function';
import * as S from '@fp-ts/schema/Schema';
import { openAPISchemaFor } from '../src';

// https://swagger.io/docs/specification/data-models/enums/

describe('enums', () => {
  it('literals', () => {
    const schema = S.literal('asc', 'desc');

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'string',
      enum: ['asc', 'desc'],
    });
  });

  it('nullable literals', () => {
    const schema = pipe(S.literal('asc', 'desc'), S.nullable);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'string',
      nullable: true,
      enum: ['asc', 'desc', null],
    });
  });

  it('enum', () => {
    enum Enum {
      Asc = 'asc',
      Desc = 'desc',
    }
    const schema = S.enums(Enum);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'string',
      enum: ['asc', 'desc'],
    });
  });

  it('nullable enum', () => {
    enum Enum {
      Asc = 'asc',
      Desc = 'desc',
    }
    const schema = pipe(S.enums(Enum), S.nullable);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'string',
      nullable: true,
      enum: ['asc', 'desc', null],
    });
  });
});
