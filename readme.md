# schema-openapi

Declarative pipe-able API for OpenAPI specification construction using
[@effect/schema](https://github.com/effect-ts/schema).

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

### `openAPI`

Use `openAPI('Name of you API', 'version')` to initialize a new
openAPI specification.

_Available setters_: [info](#info)

### `info`

Sets info section of the specification.

```typescript
OA.openAPI(
  'My API',
  '2.0.1',
  OA.info(OA.description('This is my awesome API'))
);
```

_Available setters_: [description](#description), [license](#license),
[server](#server)

_Setter of_: [openAPI](#openAPI)

### `license`

Sets a license in the info section.

```typescript
OA.openAPI(
  'My API',
  '2.0.1',
  OA.info(
    OA.description('This is my awesome API'),
    OA.license('MIT', 'http://license-url')
  )
);
```

_Setter of_: [info](#info)

### `server`

Sets a server section.

```typescript
OA.openAPI('My API', '2.0.1', OA.server('http://my-production.com'));
```

_Available setters_: [description](#description), [variable](#variable)

_Setter of_: [openAPI](#openAPI)

### `variable`

Adds a variable to the server section.

```typescript
OA.openAPI(
  'My API',
  '2.0.1',
  OA.server('http://my-production:{port}.com', OA.variable('port', '3000'))
);
```

_Available setters_: [description](#description), [enum](#enum)

_Setter of_: [server](#server)

### `enum`

Adds possible values of a server variable.

```typescript
OA.openAPI(
  'My API',
  '2.0.1',
  OA.server(
    'http://my-production:{port}.com',
    OA.variable('port', '3000', OA.enum('3000', '3001'))
  )
);
```

_Setter of_: [variable](#variable)

## Operations

### `path`

Add a new path.

```typescript
OA.openAPI(
  'My API',
  '2.0.1',
  OA.path(
    '/pet',
    OA.operation('get', OA.jsonResponse('200', S.string, 'Returns a pet'))
  ),
  OA.path(
    '/note',
    OA.operation('get', OA.jsonResponse('200', S.string, 'Returns a note'))
  )
);
```

_Available setters_: [description](#description), [operation](#operation)

_Setter of_: [openAPI](#openAPI)

### `operation`

Set operation. Method name can be one of `get`, `put`, `post`, `delete`,
`options`, `head`, `patch`, `trace`.

```typescript
OA.openAPI(
  'My API',
  '2.0.1',
  OA.path(
    '/pet',
    OA.operation('get', OA.jsonResponse('200', S.string, 'Returns a pet')),
    OA.operation(
      'post',
      OA.jsonRequest(S.struct({ value: S.number })),
      OA.jsonResponse('200', S.string, 'Returns a pet')
    )
  )
);
```

_Available setters_: [description](#description), [parameter](#parameter),
[jsonResponse](#jsonResponse), [jsonRequest](#jsonRequest),
[deprecated](#deprecated),

_Setter of_: [path](#path)

### `parameter`

Set a parameter. The (second) `in` parameter is one of `query`, `header`,
`path`, `cookie`. If the `in` is `path`, [required](#required) must be set
for the parameter.

```typescript
OA.openAPI(
  'My API',
  '2.0.1',
  OA.path(
    '/pet/{id}',
    OA.operation(
      'get',
      OA.jsonResponse('200', S.struct({ value: S.number }), 'Returns a pet')
      OA.parameter('id', 'path', S.number, OA.required),
      OA.parameter('name', 'query', S.string),
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
OA.openAPI(
  'My API',
  '2.0.1',
  OA.path(
    '/pet/{id}',
    OA.operation(
      'get',
      OA.jsonResponse('200', S.struct({ value: S.number }), 'Returns a pet')
      OA.parameter('id', 'path', S.number, OA.required),
      OA.parameter('name', 'query', S.string),
      OA.tags('Pets')
    )
  )
);
```

_Setter of_: [operation](#operation)

### `allowEmptyValue`

Configures the parameter.

```typescript
OA.openAPI(
  'My API',
  '2.0.1',
  OA.path(
    '/pet/{id}',
    OA.operation(
      'get',
      OA.jsonResponse('200', S.struct({ value: S.number }), 'Returns a pet')
      OA.parameter('id', 'path', S.number, OA.required),
      OA.parameter('name', 'query', S.string, OA.allowEmptyValue),
    )
  )
);
```

_Setter of_: [parameter](#parameter)

### `jsonRequest`

Set the JSON request body specification.

```typescript
OA.openAPI(
  'My API',
  '2.0.1',
  OA.path(
    '/pet/{id}',
    OA.operation(
      'post',
      OA.jsonResponse('200', S.struct({ value: S.number }), 'Returns a pet'),
      OA.jsonRequest(S.struct({ value: S.number }))
    )
  )
);
```

_Available setters_: [description](#description), [required](#required)

_Setter of_: [operation](#operation)

### `jsonResponse`

Set the JSON response specification.

```typescript
OA.openAPI(
  'My API',
  '2.0.1',
  OA.path(
    '/pet/{id}',
    OA.operation(
      'post',
      OA.jsonResponse('200', S.struct({ value: S.number }), 'Returns a pet')
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
OA.openAPI(
  'My API',
  '2.0.1',
  OA.path(
    '/pet/{id}',
    OA.operation(
      'get',
      OA.jsonResponse('200', S.struct({ value: S.number }), 'Returns a pet'),
      OA.parameter('name', 'query', S.string, OA.deprecated),
      OA.deprecated
    ),
    OA.deprecated
  )
);
```

_Setter of_: [parameter](#path), [operation](#operation), [parameter](#parameter)

### `required`

Sets the parameter as required.

```typescript
OA.openAPI(
  'My API',
  '2.0.1',
  OA.path(
    '/pet/{id}',
    OA.operation(
      'post',
      OA.jsonRequest(S.struct({ value: S.number }), OA.required),
      OA.jsonResponse(
        '201',
        S.struct({ value: S.literal('success') }),
        'Returns a pet'
      ),
      OA.parameter('name', 'path', S.string, OA.required)
    )
  )
);
```

_Setter of_: [parameter](#parameter), [jsonRequest](#jsonRequest)
