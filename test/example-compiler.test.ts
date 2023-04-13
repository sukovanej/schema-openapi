import * as O from '@effect/data/Option';
import * as S from '@effect/schema/Schema';

import { randomExample } from '../src/example-compiler';

test('struct', () => {
  const es = O.getOrThrow(randomExample(S.struct({ name: S.number })));

  expect(typeof es).toBe('object');
  expect(Object.getOwnPropertyNames(es).length).toBe(1);
  expect(typeof es.name).toBe('number');
});

test('big struct', () => {
  O.getOrThrow(
    randomExample(
      S.struct({
        name: S.number,
        value: S.string,
        another: S.boolean,
        hello: S.struct({
          patrik: S.literal('borec'),
          another: S.array(S.union(S.string, S.number)),
        }),
        another3: S.boolean,
        another4: S.boolean,
        another5: S.boolean,
      })
    )
  );
});

test('list', () => {
  const example = O.getOrThrow(randomExample(S.array(S.string)));

  expect(Array.isArray(example)).toBe(true);

  for (const value of example) {
    expect(typeof value).toBe('string');
  }
});

test('tuple', () => {
  const example = O.getOrThrow(
    randomExample(
      S.tuple(S.literal('a'), S.union(S.literal('b'), S.literal('c')))
    )
  );

  expect(example[0]).toEqual('a');
  expect(example[1]).oneOf(['b', 'c']);
});

describe('template literal', () => {
  test('simple', () => {
    const es = O.getOrThrow(
      randomExample(S.templateLiteral(S.literal('zdar')))
    );

    expect(es).toBe('zdar');
  });

  test('number literal', () => {
    const es = O.getOrThrow(
      randomExample(S.templateLiteral(S.literal(1), S.literal('2')))
    );

    expect(es).toBe('12');
  });

  test('number schema', () => {
    const example = O.getOrThrow(
      randomExample(S.templateLiteral(S.number, S.literal('test'), S.number))
    );

    const reg = /(\d+)(\.\d+)?(test)(\d+)(\.\d+)?/;
    expect(reg.test(example)).toBe(true);
  });

  test('string schema', () => {
    const example = O.getOrThrow(
      randomExample(S.templateLiteral(S.number, S.string))
    );

    const reg = /(\d+)(\.\d+)?/;
    expect(reg.test(example)).toBe(true);
  });

  test('union', () => {
    const es = O.getOrThrow(
      randomExample(
        S.templateLiteral(S.literal(1), S.union(S.literal('2'), S.literal(3)))
      )
    );

    expect(es).oneOf(['12', '13']);
  });
});
