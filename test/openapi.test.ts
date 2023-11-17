import SwaggerParser from '@apidevtools/swagger-parser';
import * as OpenApi from 'schema-openapi';

import * as Schema from '@effect/schema/Schema';

describe('simple', () => {
  it('simple post', async () => {
    const schema = Schema.string;

    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.path(
        '/pet',
        OpenApi.operation(
          'post',
          OpenApi.jsonRequest(schema),
          OpenApi.jsonResponse(200, schema, 'test')
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
                  schema: { description: 'a string', type: 'string' },
                },
              },
            },
            responses: {
              200: {
                description: 'test',
                content: {
                  'application/json': {
                    schema: { description: 'a string', type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    });

    // @ts-expect-error
    SwaggerParser.validate(spec);
  });

  it('set description', async () => {
    const schema = Schema.string;

    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.info(OpenApi.description('My API')),
      OpenApi.path(
        '/pet',
        OpenApi.operation(
          'post',
          OpenApi.jsonRequest(schema),
          OpenApi.jsonResponse(200, schema, 'description'),
          OpenApi.description('Store a pet')
        ),
        OpenApi.description('Pet endpoint')
      )
    );

    expect(spec.info.description).toEqual('My API');
    expect(spec.paths['/pet'].post?.description).toEqual('Store a pet');
    expect(spec.paths['/pet'].description).toEqual('Pet endpoint');

    // @ts-expect-error
    SwaggerParser.validate(spec);
  });

  it('set license', async () => {
    const spec1 = OpenApi.openAPI('test', '0.1', OpenApi.license('MIT'));

    expect(spec1.info.license?.name).toEqual('MIT');
    // @ts-expect-error
    SwaggerParser.validate(spec1);

    const spec2 = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.license('MIT', 'http://patrik.com')
    );

    expect(spec2.info.license?.name).toEqual('MIT');
    expect(spec2.info.license?.url).toEqual('http://patrik.com');

    // @ts-expect-error
    SwaggerParser.validate(spec2);
  });

  it('set description', async () => {
    const schema = Schema.string;

    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.path(
        '/pet',
        OpenApi.operation(
          'post',
          OpenApi.jsonRequest(schema),
          OpenApi.jsonResponse(200, schema, 'description'),
          OpenApi.summary('My summary')
        ),
        OpenApi.summary('Pet stuff')
      )
    );

    expect(spec.paths['/pet'].post?.summary).toEqual('My summary');
    expect(spec.paths['/pet'].summary).toEqual('Pet stuff');

    // @ts-expect-error
    SwaggerParser.validate(spec);
  });

  it('schema description', async () => {
    const schema = Schema.string;

    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.path(
        '/pet',
        OpenApi.operation(
          'post',
          OpenApi.jsonRequest(
            schema,
            OpenApi.description('request description')
          ),
          OpenApi.jsonResponse(200, schema, 'response description')
        )
      )
    );

    expect(spec.paths['/pet'].post?.responses?.[200]?.description).toEqual(
      'response description'
    );

    expect(spec.paths['/pet'].post?.requestBody?.description).toEqual(
      'request description'
    );

    // @ts-expect-error
    SwaggerParser.validate(spec);
  });

  it('servers', async () => {
    const spec1 = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.server('http://server.com')
    );

    expect(spec1.servers).toStrictEqual([{ url: 'http://server.com' }]);
    // @ts-expect-error
    SwaggerParser.validate(spec1);

    const spec2 = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.server('http://server-prod.com'),
      OpenApi.server('http://server-sandbox.com')
    );

    expect(spec2.servers).toStrictEqual([
      { url: 'http://server-prod.com' },
      { url: 'http://server-sandbox.com' },
    ]);
    // @ts-expect-error
    SwaggerParser.validate(spec2);

    const spec3 = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.server('http://server.com', OpenApi.description('production'))
    );

    expect(spec3.servers).toStrictEqual([
      { url: 'http://server.com', description: 'production' },
    ]);
    // @ts-expect-error
    SwaggerParser.validate(spec3);

    const spec4 = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.server(
        'http://server.com',
        OpenApi.description('production'),
        OpenApi.variable('username', 'demo', OpenApi.description('username')),
        OpenApi.variable('port', '8443', OpenApi.enum('8443', '443'))
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
    // @ts-expect-error
    SwaggerParser.validate(spec4);
  });

  it('path parameters', async () => {
    const schema = Schema.string;

    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.path(
        '/pet/{id}',
        OpenApi.operation(
          'post',
          OpenApi.jsonRequest(schema),
          OpenApi.jsonResponse(200, schema, 'description')
        ),
        OpenApi.summary('Pet stuff'),
        OpenApi.parameter(
          'id',
          'query',
          Schema.string,
          OpenApi.required,
          OpenApi.deprecated,
          OpenApi.allowEmptyValue,
          OpenApi.description('id')
        )
      )
    );

    expect(spec.paths['/pet/{id}'].parameters).toEqual([
      {
        name: 'id',
        in: 'query',
        schema: {
          description: 'a string',
          type: 'string',
        },
        description: 'id',
        required: true,
        deprecated: true,
        allowEmptyValue: true,
      },
    ]);
    // @ts-expect-error
    SwaggerParser.validate(spec);
  });

  it('operation parameters', async () => {
    const schema = Schema.string;

    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.path(
        '/pet/{id}',
        OpenApi.operation(
          'post',
          OpenApi.jsonRequest(schema),
          OpenApi.jsonResponse(200, schema, 'description'),
          OpenApi.parameter(
            'id',
            'query',
            Schema.string,
            OpenApi.required,
            OpenApi.description('id')
          )
        ),
        OpenApi.summary('Pet stuff')
      )
    );

    expect(spec.paths['/pet/{id}'].post?.parameters).toEqual([
      {
        name: 'id',
        in: 'query',
        schema: {
          description: 'a string',
          type: 'string',
        },
        description: 'id',
        required: true,
      },
    ]);
    // @ts-expect-error
    SwaggerParser.validate(spec);
  });

  it('request body', async () => {
    const schema = Schema.string;

    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.path(
        '/pet/{id}',
        OpenApi.operation(
          'post',
          OpenApi.jsonRequest(
            schema,
            OpenApi.description('schema'),
            OpenApi.required
          ),
          OpenApi.jsonResponse(200, schema, 'description')
        )
      )
    );

    expect(spec.paths['/pet/{id}'].post?.requestBody).toEqual({
      content: {
        'application/json': {
          schema: { description: 'a string', type: 'string' },
        },
      },
      required: true,
      description: 'schema',
    });
    // @ts-expect-error
    SwaggerParser.validate(spec);
  });

  it('tags', async () => {
    const schema = Schema.string;

    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.path(
        '/pet/{id}',
        OpenApi.operation(
          'post',
          OpenApi.jsonRequest(
            schema,
            OpenApi.description('schema'),
            OpenApi.required
          ),
          OpenApi.jsonResponse(200, schema, 'description'),
          OpenApi.tags('tag1', 'tag2')
        )
      ),
      OpenApi.path(
        '/another-endpoint',
        OpenApi.operation(
          'post',
          OpenApi.jsonRequest(
            schema,
            OpenApi.description('schema'),
            OpenApi.required
          ),
          OpenApi.jsonResponse(200, schema, 'description'),
          OpenApi.tags('tag1')
        )
      )
    );

    // @ts-expect-error
    SwaggerParser.validate(spec);
  });

  it('tags', async () => {
    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.path(
        '/pet',
        OpenApi.operation(
          'post',
          OpenApi.jsonResponse(200, Schema.string, 'response')
        )
      ),
      OpenApi.path(
        '/pet',
        OpenApi.operation(
          'get',
          OpenApi.jsonResponse(200, Schema.string, 'response')
        )
      )
    );

    expect(spec.paths['/pet']).toStrictEqual({
      post: {
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { description: 'a string', type: 'string' },
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
                schema: { description: 'a string', type: 'string' },
              },
            },
            description: 'response',
          },
        },
      },
    });

    // @ts-expect-error
    SwaggerParser.validate(spec);
  });

  it('tags', async () => {
    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.path(
        '/pet',
        OpenApi.operation(
          'post',
          OpenApi.jsonResponse(
            200,
            Schema.string,
            'response',
            OpenApi.responseHeaders({
              'My-Header': Schema.description('My description')(Schema.string),
            })
          )
        )
      )
    );

    expect(spec.paths['/pet']).toStrictEqual({
      post: {
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { description: 'a string', type: 'string' },
              },
            },
            headers: {
              'My-Header': {
                description: 'My description',
                schema: { description: 'My description', type: 'string' },
              },
            },
            description: 'response',
          },
        },
      },
    });

    // @ts-expect-error
    SwaggerParser.validate(spec);
  });

  it('empty response schema', async () => {
    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.path(
        '/pet',
        OpenApi.operation('post', OpenApi.jsonResponse(200, undefined, 'test'))
      )
    );

    expect(spec).toStrictEqual({
      openapi: '3.0.3',
      info: { title: 'test', version: '0.1' },
      paths: {
        '/pet': { post: { responses: { 200: { description: 'test' } } } },
      },
    });

    // @ts-expect-error
    SwaggerParser.validate(spec);
  });

  it('literal', async () => {
    const spec = OpenApi.openAPI(
      'test',
      '0.1',
      OpenApi.path(
        '/pet',
        OpenApi.operation(
          'post',
          OpenApi.jsonResponse(200, Schema.literal('value'), 'test')
        )
      )
    );

    expect(spec).toStrictEqual({
      openapi: '3.0.3',
      info: { title: 'test', version: '0.1' },
      paths: {
        '/pet': {
          post: {
            responses: {
              200: {
                content: {
                  'application/json': { schema: { enum: ['value'] } },
                },
                description: 'test',
              },
            },
          },
        },
      },
    });

    // @ts-expect-error
    SwaggerParser.validate(spec);
  });
});
