import * as S from '@effect/schema/Schema';
import * as OA from '../src/openapi';
import SwaggerParser from '@apidevtools/swagger-parser';

describe('simple', () => {
  it('simple post', async () => {
    const schema = S.string;

    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet',
        OA.operation(
          'post',
          OA.jsonRequest(schema),
          OA.jsonResponse(200, schema, 'test')
        )
      )
    );

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
            responses: {
              200: {
                description: 'test',
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
      },
    });

    await SwaggerParser.validate(spec);
  });

  it('set description', async () => {
    const schema = S.string;

    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.info(OA.description('My API')),
      OA.path(
        '/pet',
        OA.operation(
          'post',
          OA.jsonRequest(schema),
          OA.jsonResponse(200, schema, 'description'),
          OA.description('Store a pet')
        ),
        OA.description('Pet endpoint')
      )
    );

    expect(spec.info.description).toEqual('My API');
    expect(spec.paths['/pet'].post?.description).toEqual('Store a pet');
    expect(spec.paths['/pet'].description).toEqual('Pet endpoint');

    await SwaggerParser.validate(spec);
  });

  it('set license', async () => {
    const spec1 = OA.openAPI('test', '0.1', OA.license('MIT'));

    expect(spec1.info.license?.name).toEqual('MIT');
    await SwaggerParser.validate(spec1);

    const spec2 = OA.openAPI(
      'test',
      '0.1',
      OA.license('MIT', 'http://patrik.com')
    );

    expect(spec2.info.license?.name).toEqual('MIT');
    expect(spec2.info.license?.url).toEqual('http://patrik.com');

    await SwaggerParser.validate(spec2);
  });

  it('set description', async () => {
    const schema = S.string;

    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet',
        OA.operation(
          'post',
          OA.jsonRequest(schema),
          OA.jsonResponse(200, schema, 'description'),
          OA.summary('My summary')
        ),
        OA.summary('Pet stuff')
      )
    );

    expect(spec.paths['/pet'].post?.summary).toEqual('My summary');
    expect(spec.paths['/pet'].summary).toEqual('Pet stuff');

    await SwaggerParser.validate(spec);
  });

  it('schema description', async () => {
    const schema = S.string;

    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet',
        OA.operation(
          'post',
          OA.jsonRequest(schema, OA.description('request description')),
          OA.jsonResponse(200, schema, 'response description')
        )
      )
    );

    expect(spec.paths['/pet'].post?.responses?.[200]?.description).toEqual(
      'response description'
    );

    expect(spec.paths['/pet'].post?.requestBody?.description).toEqual(
      'request description'
    );

    await SwaggerParser.validate(spec);
  });

  it('servers', async () => {
    const spec1 = OA.openAPI('test', '0.1', OA.server('http://server.com'));

    expect(spec1.servers).toStrictEqual([{ url: 'http://server.com' }]);
    await SwaggerParser.validate(spec1);

    const spec2 = OA.openAPI(
      'test',
      '0.1',
      OA.server('http://server-prod.com'),
      OA.server('http://server-sandbox.com')
    );

    expect(spec2.servers).toStrictEqual([
      { url: 'http://server-prod.com' },
      { url: 'http://server-sandbox.com' },
    ]);
    await SwaggerParser.validate(spec2);

    const spec3 = OA.openAPI(
      'test',
      '0.1',
      OA.server('http://server.com', OA.description('production'))
    );

    expect(spec3.servers).toStrictEqual([
      { url: 'http://server.com', description: 'production' },
    ]);
    await SwaggerParser.validate(spec3);

    const spec4 = OA.openAPI(
      'test',
      '0.1',
      OA.server(
        'http://server.com',
        OA.description('production'),
        OA.variable('username', 'demo', OA.description('username')),
        OA.variable('port', '8443', OA.enum('8443', '443'))
      )
    );

    expect(spec4.servers).toStrictEqual([
      {
        url: 'http://server.com',
        description: 'production',
        variables: {
          username: { default: 'demo', description: 'username' },
          port: { default: '8443', enum: ['8443', '443'] },
        },
      },
    ]);
    await SwaggerParser.validate(spec4);
  });

  it('path parameters', async () => {
    const schema = S.string;

    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet/{id}',
        OA.operation(
          'post',
          OA.jsonRequest(schema),
          OA.jsonResponse(200, schema, 'description')
        ),
        OA.summary('Pet stuff'),
        OA.parameter(
          'id',
          'query',
          S.string,
          OA.required,
          OA.deprecated,
          OA.allowEmptyValue,
          OA.description('id')
        )
      )
    );

    expect(spec.paths['/pet/{id}'].parameters).toEqual([
      {
        name: 'id',
        in: 'query',
        schema: {
          type: 'string',
        },
        description: 'id',
        required: true,
        deprecated: true,
        allowEmptyValue: true,
      },
    ]);
    await SwaggerParser.validate(spec);
  });

  it('operation parameters', async () => {
    const schema = S.string;

    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet/{id}',
        OA.operation(
          'post',
          OA.jsonRequest(schema),
          OA.jsonResponse(200, schema, 'description'),
          OA.parameter(
            'id',
            'query',
            S.string,
            OA.required,
            OA.description('id')
          )
        ),
        OA.summary('Pet stuff')
      )
    );

    expect(spec.paths['/pet/{id}'].post?.parameters).toEqual([
      {
        name: 'id',
        in: 'query',
        schema: {
          type: 'string',
        },
        description: 'id',
        required: true,
      },
    ]);
    await SwaggerParser.validate(spec);
  });

  it('request body', async () => {
    const schema = S.string;

    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet/{id}',
        OA.operation(
          'post',
          OA.jsonRequest(schema, OA.description('schema'), OA.required),
          OA.jsonResponse(200, schema, 'description')
        )
      )
    );

    expect(spec.paths['/pet/{id}'].post?.requestBody).toEqual({
      content: {
        'application/json': {
          schema: { type: 'string' },
        },
      },
      required: true,
      description: 'schema',
    });
    await SwaggerParser.validate(spec);
  });

  it('tags', async () => {
    const schema = S.string;

    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet/{id}',
        OA.operation(
          'post',
          OA.jsonRequest(schema, OA.description('schema'), OA.required),
          OA.jsonResponse(200, schema, 'description'),
          OA.tags('tag1', 'tag2')
        )
      ),
      OA.path(
        '/another-endpoint',
        OA.operation(
          'post',
          OA.jsonRequest(schema, OA.description('schema'), OA.required),
          OA.jsonResponse(200, schema, 'description'),
          OA.tags('tag1')
        )
      )
    );

    await SwaggerParser.validate(spec);
  });

  it('tags', async () => {
    const spec = OA.openAPI(
      'test',
      '0.1',
      OA.path(
        '/pet',
        OA.operation('post', OA.jsonResponse(200, S.string, 'response'))
      ),
      OA.path(
        '/pet',
        OA.operation('get', OA.jsonResponse(200, S.string, 'response'))
      )
    );

    expect(spec.paths['/pet']).toStrictEqual({
      post: {
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { type: 'string' },
              },
            },
            description: 'response',
          },
        },
      },
      get: {
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { type: 'string' },
              },
            },
            description: 'response',
          },
        },
      },
    });

    await SwaggerParser.validate(spec);
  });
});
