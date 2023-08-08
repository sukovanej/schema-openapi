import { pipe } from '@effect/data/Function';
import * as Effect from '@effect/io/Effect';
import * as Option from '@effect/data/Option';
import * as ParseResult from '@effect/schema/ParseResult';
import * as Schema from '@effect/schema/Schema';

import { randomExample } from '../src/example-compiler';

test('struct', () => {
  const es = Effect.runSync(
    randomExample(Schema.struct({ name: Schema.number }))
  );

  expect(typeof es).toBe('object');
  expect(Object.getOwnPropertyNames(es).length).toBe(1);
  expect(typeof es.name).toBe('number');
});

test('with test annotation', () => {
  const example1 = Effect.runSync(
    randomExample(
      Schema.struct({ name: pipe(Schema.number, Schema.examples([1])) })
    )
  );

  expect(example1).toEqual({ name: 1 });

  const IntegerFromString = pipe(
    Schema.NumberFromString,
    Schema.int({ examples: [42, 69] }),
    Schema.brand('Integer')
  );

  const example2 = Effect.runSync(randomExample(IntegerFromString));
  expect(example2).oneOf([42, 69]);

  class MyClass {}

  const MyClassSchema = Schema.instanceOf(MyClass, {
    examples: [new MyClass()],
  });
  const example3 = Effect.runSync(randomExample(MyClassSchema));
  expect(example3).toBeInstanceOf(MyClass);

  const TransformedSchema = Schema.transformResult(
    Schema.string,
    MyClassSchema,
    () => ParseResult.success(new MyClass()),
    () => ParseResult.success('hello')
  );
  const example4 = Effect.runSync(randomExample(TransformedSchema));
  expect(example4).toBeInstanceOf(MyClass);
});

test('big struct', () => {
  const example = Effect.runSync(
    randomExample(
      Schema.struct({
        name: Schema.number,
        value: Schema.string,
        another: Schema.boolean,
        hello: Schema.struct({
          patrik: Schema.literal('borec'),
          another: Schema.array(Schema.union(Schema.string, Schema.number)),
        }),
        another3: Schema.boolean,
        another4: Schema.boolean,
        another5: Schema.boolean,
      })
    )
  );
  expect(typeof example).toBe('object');
  expect(Object.getOwnPropertyNames(example).length).toBe(7);
  expect(example.another3).oneOf([true, false]);
});

test('list', () => {
  const example = Effect.runSync(randomExample(Schema.array(Schema.string)));

  expect(Array.isArray(example)).toBe(true);

  for (const value of example) {
    expect(typeof value).toBe('string');
  }
});

test('tuple', () => {
  const example = Effect.runSync(
    randomExample(
      Schema.tuple(
        Schema.literal('a'),
        Schema.union(Schema.literal('b'), Schema.literal('c'))
      )
    )
  );

  expect(example[0]).toEqual('a');
  expect(example[1]).oneOf(['b', 'c']);
});

describe('template literal', () => {
  test('simple', () => {
    const es = Effect.runSync(
      randomExample(Schema.templateLiteral(Schema.literal('zdar')))
    );

    expect(es).toBe('zdar');
  });

  test('number literal', () => {
    const es = Effect.runSync(
      randomExample(
        Schema.templateLiteral(Schema.literal(1), Schema.literal('2'))
      )
    );

    expect(es).toBe('12');
  });

  test('number schema', () => {
    const example = Effect.runSync(
      randomExample(
        Schema.templateLiteral(
          Schema.number,
          Schema.literal('test'),
          Schema.number
        )
      )
    );

    const reg = /(\d+)(\.\d+)?(test)(\d+)(\.\d+)?/;
    expect(reg.test(example)).toBe(true);
  });

  test('string schema', () => {
    const example = Effect.runSync(
      randomExample(Schema.templateLiteral(Schema.number, Schema.string))
    );

    const reg = /(\d+)(\.\d+)?/;
    expect(reg.test(example)).toBe(true);
  });

  test('union', () => {
    const es = Effect.runSync(
      randomExample(
        Schema.templateLiteral(
          Schema.literal(1),
          Schema.union(Schema.literal('2'), Schema.literal(3))
        )
      )
    );

    expect(es).oneOf(['12', '13']);
  });
});

test('Declaration', () => {
  const schema = Schema.optionFromNullable(Schema.string);
  const example = Effect.runSync((randomExample(schema)));

  expect(Option.isOption(example)).toBe(true);
})
