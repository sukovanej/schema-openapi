import SwaggerParser from '@apidevtools/swagger-parser';
import { pipe } from 'effect';

import * as S from '@effect/schema/Schema';
import { identifier } from '@effect/schema/Schema';

import * as OA from '../src/openapi';

const recursiveOpenApiDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'test',
    version: '0.1',
  },
  paths: {
    '/pet': {
      post: {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Category',
                },
              },
            },
            description: 'Test',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Category: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'a string',
          },
          categories: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Category',
            },
          },
        },
        required: ['name', 'categories'],
      },
    },
  },
};

describe('component schema and reference', () => {
  it('component schema', async () => {
    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.componentSchema('MyComponent', S.struct({ value: S.string }).ast)
    );
    const openapi = {
      openapi: '3.0.3',
      info: { title: 'test', version: '0.1' },
      paths: {},
      components: {
        schemas: {
          MyComponent: {
            type: 'object',
            required: ['value'],
            properties: {
              value: {
                type: 'string',
                description: 'a string',
              },
            },
          },
        },
      },
    };
    expect(spec).toStrictEqual(openapi);

    // @ts-ignore
    SwaggerParser.validate(spec);
  });

  it('reference', async () => {
    const ReferencedType = pipe(
      S.struct({ something: S.string }),
      identifier('ReferencedType')
    );
    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet',
        OA.operation('post', OA.jsonResponse(200, ReferencedType, 'Test'))
      )
    );
    const openapi = {
      openapi: '3.0.3',
      info: { title: 'test', version: '0.1' },
      paths: {
        '/pet': {
          post: {
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ReferencedType',
                    },
                  },
                },
                description: 'Test',
              },
            },
          },
        },
      },
      components: {
        schemas: {
          ReferencedType: {
            properties: {
              something: {
                description: 'a string',
                type: 'string',
              },
            },
            required: ['something'],
            type: 'object',
          },
        },
      },
    };
    expect(spec).toStrictEqual(openapi);

    // @ts-ignore
    SwaggerParser.validate(spec);
  });

  it('reference with sub schema as reference', async () => {
    const ReferencedSubType = pipe(
      S.struct({ more: S.string }),
      identifier('ReferencedSubType')
    );
    const ReferencedType = pipe(
      S.struct({ something: S.string, sub: ReferencedSubType }),
      identifier('ReferencedType')
    );
    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet',
        OA.operation('post', OA.jsonResponse(200, ReferencedType, 'Test'))
      )
    );
    const openapi = {
      openapi: '3.0.3',
      info: { title: 'test', version: '0.1' },
      paths: {
        '/pet': {
          post: {
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ReferencedType',
                    },
                  },
                },
                description: 'Test',
              },
            },
          },
        },
      },
      components: {
        schemas: {
          ReferencedType: {
            properties: {
              something: {
                description: 'a string',
                type: 'string',
              },
              sub: {
                $ref: '#/components/schemas/ReferencedSubType',
              },
            },
            required: ['something', 'sub'],
            type: 'object',
          },
          ReferencedSubType: {
            properties: {
              more: {
                description: 'a string',
                type: 'string',
              },
            },
            required: ['more'],
            type: 'object',
          },
        },
      },
    };
    expect(spec).toStrictEqual(openapi);

    // @ts-ignore
    SwaggerParser.validate(spec);
  });

  it('reference with recursive reference and identifier inside lazy', async () => {
    interface Category {
      readonly name: string;
      readonly categories: ReadonlyArray<Category>;
    }
    const categorySchema: S.Schema<Category> = S.lazy<Category>(() =>
      S.struct({
        name: S.string,
        categories: S.array(categorySchema),
      }).pipe(S.identifier('Category'))
    );
    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet',
        OA.operation('post', OA.jsonResponse(200, categorySchema, 'Test'))
      )
    );
    expect(spec).toStrictEqual(recursiveOpenApiDefinition);

    // @ts-ignore
    SwaggerParser.validate(spec);
  });

  it('reference with recursive reference and identifier on lazy', async () => {
    interface Category {
      readonly name: string;
      readonly categories: ReadonlyArray<Category>;
    }
    const categorySchema: S.Schema<Category> = S.lazy<Category>(() =>
      S.struct({
        name: S.string,
        categories: S.array(categorySchema),
      })
    ).pipe(S.identifier('Category'));
    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet',
        OA.operation('post', OA.jsonResponse(200, categorySchema, 'Test'))
      )
    );
    expect(spec).toStrictEqual(recursiveOpenApiDefinition);

    // @ts-ignore
    SwaggerParser.validate(spec);
  });
});
