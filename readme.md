# schema-openapi

Declarative pipe-able API for OpenAPI specification construction using
[@effect/schema](https://github.com/effect-ts/schema).

:construction: **Under development.**

## Installation

```
pnpm add schema-openapi
```

# API documentation

Top-level

- [openAPI](#openAPI)
- [info](#info)
- [license](#license)
- [server](#license)
- [variable](#variable)
- [enum](#enum)

Operations

- [path](#path)
- [operation](#operation)
- [operationId](#parameter)
- [parameter](#parameter)
- [allowEmptyValue](#allowEmptyValue)
- [jsonRequest](#jsonRequest)
- [jsonResponse](#jsonResponse)

General

- [description](#description)
- [summary](#summary)
- [deprecated](#deprecated)
- [required](#required)

## Top-level

```typescript
import * as OpenApi from 'schema-openapi';
```

### `openAPI`

Use `openAPI('Name of you API', 'version')` to initialize a new
openAPI specification.

_Available setters_: [info](#info)

### `info`

Sets info section of the specification.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.info(OpenApi.description('This is my awesome API'))
);
```

_Available setters_: [description](#description), [license](#license),
[server](#server)

_Setter of_: [openAPI](#openAPI)

### `license`

Sets a license in the info section.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.info(
    OpenApi.description('This is my awesome API'),
    OpenApi.license('MIT', 'http://license-url')
  )
);
```

_Setter of_: [info](#info)

### `server`

Sets a server section.

```typescript
OpenApi.openAPI('My API', '2.0.1', OpenApi.server('http://my-production.com'));
```

_Available setters_: [description](#description), [variable](#variable)

_Setter of_: [openAPI](#openAPI)

### `variable`

Adds a variable to the server section.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.server(
    'http://my-production:{port}.com',
    OpenApi.variable('port', '3000')
  )
);
```

_Available setters_: [description](#description), [enum](#enum)

_Setter of_: [server](#server)

### `enum`

Adds possible values of a server variable.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.server(
    'http://my-production:{port}.com',
    OpenApi.variable('port', '3000', OpenApi.enum('3000', '3001'))
  )
);
```

_Setter of_: [variable](#variable)

## Operations

### `path`

Add a new path.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.path(
    '/pet',
    OpenApi.operation(
      'get',
      OpenApi.jsonResponse('200', S.string, 'Returns a pet')
    )
  ),
  OpenApi.path(
    '/note',
    OpenApi.operation(
      'get',
      OpenApi.jsonResponse('200', S.string, 'Returns a note')
    )
  )
);
```

_Available setters_: [description](#description), [operation](#operation)

_Setter of_: [openAPI](#openAPI)

### `operation`

Set operation. Method name can be one of `get`, `put`, `post`, `delete`,
`options`, `head`, `patch`, `trace`.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.path(
    '/pet',
    OpenApi.operation(
      'get',
      OpenApi.jsonResponse('200', S.string, 'Returns a pet')
    ),
    OpenApi.operation(
      'post',
      OpenApi.jsonRequest(S.struct({ value: S.number })),
      OpenApi.jsonResponse('200', S.string, 'Returns a pet')
    )
  )
);
```

_Available setters_: [description](#description), [parameter](#parameter),
[jsonResponse](#jsonResponse), [jsonRequest](#jsonRequest),
[deprecated](#deprecated), [operationId](#parameter)

_Setter of_: [path](#path)

### `parameter`

Set a parameter. The (second) `in` parameter is one of `query`, `header`,
`path`, `cookie`. If the `in` is `path`, [required](#required) must be set
for the parameter.

Set the operation id using `OpenApi.operationId`.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.path(
    '/pet/{id}',
    OpenApi.operation(
      'get',
      OpenApi.jsonResponse('200', S.struct({ value: S.number }), 'Returns a pet')
      OpenApi.parameter('id', 'path', S.number, OpenApi.required),
      OpenApi.parameter('name', 'query', S.string),
      OpenApi.operationId('getPet')
    )
  )
);
```

_Setter of_: [operation](#operation)

### `parameter`

Set a parameter. The (second) `in` parameter is one of `query`, `header`,
`path`, `cookie`. If the `in` is `path`, [required](#required) must be set
for the parameter.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.path(
    '/pet/{id}',
    OpenApi.operation(
      'get',
      OpenApi.jsonResponse('200', S.struct({ value: S.number }), 'Returns a pet')
      OpenApi.parameter('id', 'path', S.number, OpenApi.required),
      OpenApi.parameter('name', 'query', S.string),
    )
  )
);
```

_Available setters_: [required](#required), [description](#description),
[deprecated](#deprecated), [allowEmptyValue](#allowEmptyValue)

_Setter of_: [operation](#operation)

### `tags`

Set tags for an operation.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.path(
    '/pet/{id}',
    OpenApi.operation(
      'get',
      OpenApi.jsonResponse('200', S.struct({ value: S.number }), 'Returns a pet')
      OpenApi.parameter('id', 'path', S.number, OpenApi.required),
      OpenApi.parameter('name', 'query', S.string),
      OpenApi.tags('Pets')
    )
  )
);
```

_Setter of_: [operation](#operation)

### `allowEmptyValue`

Configures the parameter.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.path(
    '/pet/{id}',
    OpenApi.operation(
      'get',
      OpenApi.jsonResponse('200', S.struct({ value: S.number }), 'Returns a pet')
      OpenApi.parameter('id', 'path', S.number, OpenApi.required),
      OpenApi.parameter('name', 'query', S.string, OpenApi.allowEmptyValue),
    )
  )
);
```

_Setter of_: [parameter](#parameter)

### `jsonRequest`

Set the JSON request body specification.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.path(
    '/pet/{id}',
    OpenApi.operation(
      'post',
      OpenApi.jsonResponse(
        '200',
        S.struct({ value: S.number }),
        'Returns a pet'
      ),
      OpenApi.jsonRequest(S.struct({ value: S.number }))
    )
  )
);
```

_Available setters_: [description](#description), [required](#required)

_Setter of_: [operation](#operation)

### `jsonResponse`

Set the JSON response specification.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.path(
    '/pet/{id}',
    OpenApi.operation(
      'post',
      OpenApi.jsonResponse(
        '200',
        S.struct({ value: S.number }),
        'Returns a pet'
      )
    )
  )
);
```

_Available setters_: [description](#description)

_Setter of_: [operation](#operation)

## General

### `description`

Sets a description field.

_Setter of_: [info](#info), [operation](#operation), [parameter](#parameter)

### `summary`

Sets a summary field.

_Setter of_: [path](#path), [operation](#operation)

### `deprecated`

Sets the spec as deprecated.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.path(
    '/pet/{id}',
    OpenApi.operation(
      'get',
      OpenApi.jsonResponse(
        '200',
        S.struct({ value: S.number }),
        'Returns a pet'
      ),
      OpenApi.parameter('name', 'query', S.string, OpenApi.deprecated),
      OpenApi.deprecated
    ),
    OpenApi.deprecated
  )
);
```

_Setter of_: [parameter](#path), [operation](#operation), [parameter](#parameter)

### `required`

Sets the parameter as required.

```typescript
OpenApi.openAPI(
  'My API',
  '2.0.1',
  OpenApi.path(
    '/pet/{id}',
    OpenApi.operation(
      'post',
      OpenApi.jsonRequest(S.struct({ value: S.number }), OpenApi.required),
      OpenApi.jsonResponse(
        '201',
        S.struct({ value: S.literal('success') }),
        'Returns a pet'
      ),
      OpenApi.parameter('name', 'path', S.string, OpenApi.required)
    )
  )
);
```

_Setter of_: [parameter](#parameter), [jsonRequest](#jsonRequest)
