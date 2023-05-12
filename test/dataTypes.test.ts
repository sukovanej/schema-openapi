import { pipe } from '@effect/data/Function';
import * as S from '@effect/schema/Schema';

import { openAPISchemaFor } from '../src/compiler';

// https://swagger.io/docs/specification/data-models/data-types/

describe('data types', () => {
  it('boolean', () => {
    const schema = S.boolean;

    expect(openAPISchemaFor(schema)).toStrictEqual({ type: 'boolean' });
  });

  it('string', () => {
    const schema = S.string;

    expect(openAPISchemaFor(schema)).toStrictEqual({ type: 'string' });
  });

  it('branded string', () => {
    const schema = pipe(S.string, S.brand('my-string'));

    expect(openAPISchemaFor(schema)).toStrictEqual({ type: 'string' });
  });

  it('string with minLength', () => {
    const schema = pipe(S.string, S.minLength(1));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'string',
      minLength: 1,
    });
  });

  it('string with maxLength', () => {
    const schema = pipe(S.string, S.maxLength(10));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'string',
      maxLength: 10,
    });
  });

  it('string with minLength and maxLength', () => {
    const schema = pipe(S.string, S.minLength(1), S.maxLength(10));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'string',
      minLength: 1,
      maxLength: 10,
    });
  });

  it('string with pattern', () => {
    const schema = pipe(S.string, S.pattern(/^\d{3}-\d{2}-\d{4}$/));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'string',
      pattern: '^\\d{3}-\\d{2}-\\d{4}$',
    });
  });

  it('number', () => {
    const schema = S.number;

    expect(openAPISchemaFor(schema)).toStrictEqual({ type: 'number' });
  });

  it('integer', () => {
    const schema = pipe(S.number, S.int());

    expect(openAPISchemaFor(schema)).toStrictEqual({ type: 'integer' });
  });

  it('integer with exclusive min', () => {
    const schema = pipe(S.number, S.int(), S.greaterThan(10));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'integer',
      exclusiveMinimum: true,
      minimum: 10,
    });
  });

  it('integer with exclusive max', () => {
    const schema = pipe(S.number, S.int(), S.lessThan(10));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'integer',
      exclusiveMaximum: true,
      maximum: 10,
    });
  });

  it('integer with non-exclusive min', () => {
    const schema = pipe(S.number, S.int(), S.greaterThanOrEqualTo(10));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'integer',
      minimum: 10,
    });
  });

  it('integer with non-exclusive max', () => {
    const schema = pipe(S.number, S.int(), S.lessThanOrEqualTo(10));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'integer',
      maximum: 10,
    });
  });

  it('number with exclusive min', () => {
    const schema = pipe(S.number, S.greaterThan(10));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'number',
      exclusiveMinimum: true,
      minimum: 10,
    });
  });

  it('number with exclusive max', () => {
    const schema = pipe(S.number, S.lessThan(10));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'number',
      exclusiveMaximum: true,
      maximum: 10,
    });
  });

  it('number with non-exclusive min', () => {
    const schema = pipe(S.number, S.greaterThanOrEqualTo(10));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'number',
      minimum: 10,
    });
  });

  it('number with non-exclusive max', () => {
    const schema = pipe(S.number, S.lessThanOrEqualTo(10));

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'number',
      maximum: 10,
    });
  });

  it('parsed number', () => {
    const schema = S.numberFromString(S.string);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'string',
    });
  });
});

describe('nullable data types', () => {
  it('nullable number', () => {
    const schema = pipe(S.number, S.nullable);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'number',
      nullable: true,
    });
  });

  it('nullable string', () => {
    const schema = pipe(S.string, S.nullable);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'string',
      nullable: true,
    });
  });

  it('nullable string array', () => {
    const schema = pipe(S.string, S.array, S.nullable);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'array',
      items: { type: 'string' },
      nullable: true,
    });
  });
});

describe('arrays', () => {
  it('number array', () => {
    const schema = S.array(S.number);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'array',
      items: { type: 'number' },
    });
  });

  it('string array', () => {
    const schema = pipe(S.string, S.array);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('2d number array', () => {
    const schema = pipe(S.number, S.array, S.array);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'array',
      items: { type: 'array', items: { type: 'number' } },
    });
  });

  it('object array', () => {
    const schema = pipe(S.struct({ id: S.number }), S.array);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'number' } },
        required: ['id'],
      },
    });
  });

  it('mixed type array', () => {
    const schema = pipe(S.union(S.number, S.string), S.array);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'array',
      items: {
        oneOf: [{ type: 'number' }, { type: 'string' }],
      },
    });
  });

  it('array of any items', () => {
    const schema = S.array(S.any);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'array',
      items: {},
    });
  });

  it('single item array', () => {
    const schema = S.tuple(S.string);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
      maxItems: 1,
    });
  });

  it('non-empty array', () => {
    const schema = S.nonEmptyArray(S.string);

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
    });
  });

  // TODO: array length
  // TODO: unique items
});

describe('objects', () => {
  it('object', () => {
    const schema = S.struct({ id: S.int()(S.number), name: S.string });

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'object',
      properties: { id: { type: 'integer' }, name: { type: 'string' } },
      required: ['name', 'id'],
    });
  });

  it('object with non-required', () => {
    const schema = S.object;

    expect(openAPISchemaFor(schema)).toStrictEqual({ type: 'object' });
  });

  it('object with non-required', () => {
    const schema = S.struct({
      id: S.int()(S.number),
      username: S.string,
      name: S.optional(S.string),
    });

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        username: { type: 'string' },
      },
      required: ['username', 'id'],
    });
  });

  it('brands', () => {
    const schema = pipe(
      S.struct({
        id: S.int()(S.number),
        username: S.string,
        name: S.optional(S.string),
      }),
      S.brand('my-schema')
    );

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        username: { type: 'string' },
      },
      required: ['username', 'id'],
    });
  });
});

it('optionFromNullable', () => {
  const schema = S.struct({
    value: S.optionFromNullable(S.string),
  });

  expect(openAPISchemaFor(schema)).toStrictEqual({
    type: 'object',
    properties: { value: { type: 'string', nullable: true } },
    required: ['value'],
  });
});
