import * as S from '@effect/schema/Schema';

import { examples } from '../src/example-compiler';

test('struct', () => {
  const es = examples(S.struct({ name: S.number }));

  expect(es.length).toBeGreaterThan(0);

  for (const example of es) {
    expect(typeof example).toBe('object');
    expect(Object.getOwnPropertyNames(example).length).toBe(1);
    expect(typeof example.name).toBe('number');
  }
});

test('list', () => {
  const es = examples(S.array(S.string));

  expect(es.length).toBeGreaterThan(0);

  let atLeastOneNonEmpty = false;

  for (const example of es) {
    expect(Array.isArray(example)).toBe(true);

    for (const value of example) {
      expect(typeof value).toBe('string');
    }

    atLeastOneNonEmpty = atLeastOneNonEmpty || example.length > 0;
  }

  expect(atLeastOneNonEmpty).toBe(true);
});

test('tuple', () => {
  const es = examples(S.tuple(S.literal('a'), S.literal('b')));

  expect(es.length).toBe(1);
  expect(es[0]).toEqual(['a', 'b']);
});

//test('template literal', () => {
//  const es = examples(
//    S.templateLiteral(
//      S.literal(1),
//      S.literal('e'),
//      S.literal('l'),
//      S.string,
//      S.literal('x')
//    )
//  );
//
//  expect(es.length).toBeGreaterThan(0);
//  for (const example of es) {
//    expect(example.startsWith('1el')).toBe(true);
//    expect(example.endsWith('x')).toBe(true);
//  }
//});
