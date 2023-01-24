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

  it('set license', () => {
    const spec1 = pipe(OA.openAPI('test', '0.1'), OA.license('MIT'));

    expect(spec1.info.license?.name).toEqual('MIT');

    const spec2 = pipe(
      OA.openAPI('test', '0.1'),
      OA.license('MIT', 'http://patrik.com')
    );

    expect(spec2.info.license?.name).toEqual('MIT');
    expect(spec2.info.license?.url).toEqual('http://patrik.com');
  });

  it('set description', () => {
    const schema = S.string;

    const spec = pipe(
      OA.openAPI('test', '0.1'),
      OA.addPath(
        '/pet',
        flow(
          OA.addOperation(
            'post',
            flow(
              OA.setJsonRequestBody(schema),
              OA.setJsonResponse('200', schema),
              OA.setSummary('My summary')
            )
          ),
          OA.setSummary('Pet stuff')
        )
      )
    );

    expect(spec.paths['/pet'].post?.summary).toEqual('My summary');
    expect(spec.paths['/pet'].summary).toEqual('Pet stuff');
  });

  it('schema description', () => {
    const schema = S.string;

    const spec = pipe(
      OA.openAPI('test', '0.1'),
      OA.addPath(
        '/pet',
        flow(
          OA.addOperation(
            'post',
            flow(
              OA.setJsonRequestBody(schema, 'request description'),
              OA.setJsonResponse('200', schema, 'response description')
            )
          )
        )
      )
    );

    expect(
      spec.paths['/pet'].post?.responses?.['200']?.content['application/json']
        ?.schema.description
    ).toEqual('response description');
    expect(
      spec.paths['/pet'].post?.requestBody?.content['application/json']?.schema
        ?.description
    ).toEqual('request description');
  });
});
