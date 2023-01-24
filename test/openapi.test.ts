import { flow, pipe } from '@fp-ts/data/Function';
import * as S from '@fp-ts/schema/Schema';
import { createOpenAPI } from '../src/openapi';
import * as OA from '../src/openapi';

describe('simple', () => {
  it('simple post', () => {
    const schema = S.string;

    const spec = createOpenAPI({
      openapi: '3.0.3',
      info: {
        title: 'test',
        version: '0.1',
      },
      paths: {
        '/pet': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema,
                },
              },
            },
          },
        },
      },
    });

    expect(spec).toStrictEqual({
      openapi: '3.0.3',
      info: {
        title: 'test',
        version: '0.1',
      },
      paths: {
        '/pet': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  it('simple post with response', () => {
    const schema = S.string;

    const spec = createOpenAPI({
      openapi: '3.0.3',
      info: {
        title: 'test',
        version: '0.1',
      },
      paths: {
        '/pet': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema,
                },
              },
            },
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema,
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(spec.paths['/pet'].post?.responses).toStrictEqual({
      '200': {
        content: {
          'application/json': {
            schema: {
              type: 'string',
            },
          },
        },
      },
    });
  });

  it('simple post with response using pipeable API', () => {
    const schema = S.string;

    const spec = pipe(
      OA.openAPI('test', '0.1'),
      OA.addPath(
        '/pet',
        OA.addOperation(
          'post',
          flow(OA.setJsonRequestBody(schema), OA.setJsonResponse('200', schema))
        )
      )
    );

    expect(spec.paths['/pet'].post).toStrictEqual({
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'string',
            },
          },
        },
      },
      responses: {
        '200': {
          content: {
            'application/json': {
              schema: {
                type: 'string',
              },
            },
          },
        },
      },
    });
  });

  it('set description', () => {
    const schema = S.string;

    const spec = pipe(
      OA.openAPI('test', '0.1'),
      OA.info(OA.setDescription('My API')),
      OA.addPath(
        '/pet',
        flow(
          OA.addOperation(
            'post',
            flow(
              OA.setJsonRequestBody(schema),
              OA.setJsonResponse('200', schema),
              OA.setDescription('Store a pet')
            )
          ),
          OA.setDescription('Pet endpoint')
        )
      )
    );

    expect(spec.info.description).toEqual('My API');
    expect(spec.paths['/pet'].post?.description).toEqual('Store a pet');
    expect(spec.paths['/pet'].description).toEqual('Pet endpoint');
  });
});
