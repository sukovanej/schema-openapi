import * as Compiler from 'schema-openapi/compiler';

import { Schema } from '@effect/schema';

test('Declaration', () => {
  const MySchema = Schema.instanceOf(FormData).pipe(
    Compiler.annotate({ type: 'string' }),
    Schema.description('form data')
  );

  expect(Compiler.openAPISchemaForAst(MySchema.ast, () => undefined)).toEqual({
    type: 'string',
    description: 'form data',
  });
});
