/**
 * Pipeable API.
 *
 * @since 1.0.0
 */
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import * as circular from "./internal/circular.js"
import * as I from "./internal/internal.js"
import { openAPISchemaFor, openAPISchemaForAst } from "./OpenApiCompiler.js"
import type {
  AnySchema,
  OpenAPISchemaType,
  OpenAPISecurityRequirement,
  OpenAPISecurityScheme,
  OpenAPISpec,
  OpenApiSpecContent,
  OpenAPISpecExternalDocs,
  OpenAPISpecInfo,
  OpenAPISpecMethodName,
  OpenAPISpecOperation,
  OpenAPISpecParameter,
  OpenAPISpecPathItem,
  OpenAPISpecReference,
  OpenAPISpecRequestBody,
  OpenApiSpecResponse,
  OpenAPISpecServer,
  OpenAPISpecServerVariable,
  OpenAPISpecStatusCode,
  OpenAPISpecTag
} from "./OpenApiTypes.js"

import * as AST from "@effect/schema/AST"
import type * as Schema from "@effect/schema/Schema"

/**
 * Initialize OpenAPI schema.
 *
 * *Available setters*: `info`
 *
 * @param {string} title - title in the info section
 * @param {string} version - version in the info section
 *
 * @since 1.0.0
 */
export const openAPI = (
  title: string,
  version: string,
  ...setters: Array<I.Setter<OpenAPISpec<OpenAPISchemaType>>>
): OpenAPISpec<OpenAPISchemaType> => {
  const componentSchemasFromReference: Array<
    I.Setter<
      OpenAPISpec<OpenAPISchemaType>
    >
  > = []
  const addedComponentSchemas = new Set<string>()
  const addComponentSchemaCallback: I.ComponentSchemaCallback = (id, ast) => {
    if (!addedComponentSchemas.has(id)) {
      componentSchemasFromReference.push(componentSchema(id, ast))
      addedComponentSchemas.add(id)
    }
  }
  let spec = I.runSetters(
    {
      openapi: "3.0.3",
      info: { title, version },
      paths: {}
    },
    setters,
    addComponentSchemaCallback
  )
  let setter
  while ((setter = componentSchemasFromReference.pop())) {
    spec = setter(spec, addComponentSchemaCallback)
  }
  return spec
}

/**
 * Set `info` section.
 *
 * *Available setters*: `description`, `license`
 *
 * @since 1.0.0
 */
export const info = (
  ...setters: Array<I.Setter<OpenAPISpecInfo>>
): I.Setter<OpenAPISpec<OpenAPISchemaType>> =>
(spec) => ({
  ...spec,
  info: I.runSetters(spec.info, setters)
})

/**
 * Set `license` in the `info` section.
 *
 * *Setter of*: `license`
 *
 * @since 1.0.0
 */
export const license = (name: string, url?: string): I.Setter<OpenAPISpec<OpenAPISchemaType>> => (spec) => ({
  ...spec,
  info: {
    ...spec.info,
    license: {
      url,
      name
    }
  }
})

/**
 * Set the `server` section.
 *
 * *Setter of*: `openAPI`
 * *Available setters*: `description`, `variable`
 *
 * @since 1.0.0
 */
export const server = (
  url: string,
  ...setters: Array<I.Setter<OpenAPISpecServer>>
): I.Setter<OpenAPISpec<OpenAPISchemaType>> =>
(spec, componentSchemaCallback) => ({
  ...spec,
  servers: [
    ...(spec.servers ?? []),
    I.runSetters({ url }, setters, componentSchemaCallback)
  ]
})

/**
 * Adds global tags.
 *
 * *Setter of*: `openAPI`
 *
 * @since 1.0.0
 */
export const globalTags = (tag: OpenAPISpecTag, ...tags: Array<OpenAPISpecTag>): I.Setter<OpenAPISpec> => (spec) => ({
  ...spec,
  tags: [...(spec.tags ?? []), tag, ...tags]
})

/**
 * Adds external documentation object.
 *
 * *Setter of*: `openAPI`, `tag`, `operation`
 *
 * @since 1.0.0
 */
export const externalDocs = (
  externalDocs: OpenAPISpecExternalDocs
): I.Setter<{ externalDocs?: OpenAPISpecExternalDocs }> =>
(spec) => ({
  ...spec,
  externalDocs
})

/**
 * Add variable to a server section.
 *
 * *Setter of*: `server`
 * *Available setters*: `description`, `enum`
 *
 * @param {string} name - name of the variable
 * @param {string} defaultValue - default value of the variable
 *
 * @since 1.0.0
 */
export const variable = (
  name: string,
  defaultValue: string,
  ...setters: Array<I.Setter<OpenAPISpecServerVariable>>
): I.Setter<OpenAPISpecServer> =>
(server, componentSchemaCallback) => ({
  ...server,
  variables: {
    ...server.variables,
    [name]: I.runSetters(
      { default: defaultValue },
      setters,
      componentSchemaCallback
    )
  }
})

/** @internal */
const _enum = (...values: Array<string>): I.Setter<OpenAPISpecServerVariable> => (variable) => ({
  ...variable,
  enum: [...(variable.enum ?? []), ...values]
})

export {
  /**
   * Add possible values for a server variable.
   *
   * *Setter of*: `variable`
   *
   * @param {...string} values -
   *
   * @since 1.0.0
   */
  _enum as enum
}

/**
 * Add a path to the specification.
 *
 * *Available setters*: `operation`
 * *Setter of*: `openAPI`
 *
 * @param {string} path - endpoint path
 *
 * @since 1.0.0
 */
export const path = (
  path: string,
  ...setters: Array<I.Setter<OpenAPISpecPathItem<OpenAPISchemaType>>>
): I.Setter<OpenAPISpec<OpenAPISchemaType>> =>
(spec, componentSchemaCallback) => ({
  ...spec,
  paths: {
    ...spec.paths,
    [path]: {
      ...spec.paths[path],
      ...I.runSetters({}, setters, componentSchemaCallback)
    }
  }
})

/**
 * Set operation. Method name can be one of `get`, `put`, `post`, `delete`,
 * `options`, `head`, `patch`, `trace`.
 *
 * *Available setters*: `parameter`, `jsonResponse`, `jsonRequest`
 * *Setter of*: `path`
 *
 * @param {OpenAPISpecMethodName} methodName - "get" | "put" ...
 *
 * @since 1.0.0
 */
export const operation = (
  methodName: OpenAPISpecMethodName,
  ...setters: Array<I.Setter<OpenAPISpecOperation<OpenAPISchemaType>>>
): I.Setter<OpenAPISpecPathItem<OpenAPISchemaType>> =>
(pathItem, componentSchemaCallback) => ({
  ...pathItem,
  [methodName]: {
    ...pathItem[methodName],
    ...I.runSetters({}, setters, componentSchemaCallback)
  }
})

/**
 * Operation parameter. One of `query`, `header`, `path`, `cookie`.
 *
 * *Available setters*: `parameter`, `jsonResponse`, `jsonRequest`
 * *Setter of*: `path`
 *
 * @param {string} name - name of the parameter
 * @param {'query' | 'header' | 'path' | 'cookie'} inValue - in
 * @param {Schema} schema - Schema for the parameter
 *
 * @since 1.0.0
 */
export const parameter = (
  name: string,
  inValue: OpenAPISpecParameter["in"],
  schema: AnySchema,
  ...setters: Array<I.Setter<OpenAPISpecParameter<OpenAPISchemaType>>>
): I.Setter<{ parameters?: Array<OpenAPISpecParameter<OpenAPISchemaType>> }> =>
(spec, componentSchemaCallback) => ({
  ...spec,
  parameters: [
    ...(spec.parameters ?? []),
    I.runSetters(
      {
        name,
        in: inValue,
        schema: openAPISchemaFor(schema, componentSchemaCallback)
      },
      setters,
      componentSchemaCallback
    )
  ]
})

/**
 * Allow an empty value for the parameter.
 *
 * *Setter of*: `parameter`
 *
 * @since 1.0.0
 */
export const allowEmptyValue: I.Setter<OpenAPISpecParameter> = (parameter) => ({
  ...parameter,
  allowEmptyValue: true
})

/**
 * Make the parameter required.
 *
 * *Setter of*: `parameter`, `jsonRequest`
 *
 * @since 1.0.0
 */
export const required: I.Setter<OpenAPISpecParameter> = (parameter) => ({
  ...parameter,
  required: true
})

/**
 * Allow an empty value for the parameter.
 *
 * *Setter of*: `parameter`
 *
 * @since 1.0.0
 */
export const deprecated: I.Setter<{ deprecated?: boolean }> = (parameter) => ({
  ...parameter,
  deprecated: true
})

/**
 * Set JSON request.
 *
 * *Avaialble setter*: `description`, `required`
 * *Setter of*: `operation`
 *
 * @param {Schema} content - schema for the request body
 *
 * @since 1.0.0
 */
export const jsonRequest = (
  content: AnySchema,
  ...setters: Array<I.Setter<OpenAPISpecRequestBody<OpenAPISchemaType>>>
): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
(spec, componentSchemaCallback) => ({
  ...spec,
  requestBody: I.runSetters(
    {
      ...spec.requestBody,
      content: modifyContentJsonSchema(
        spec.requestBody?.content,
        content,
        componentSchemaCallback
      )
    },
    setters,
    componentSchemaCallback
  )
})

/**
 * Add 204 No-Content response.
 *
 * *Available setter*: `description`
 * *Setter of*: `operation`
 *
 * @param {string} description - description of the response
 *
 * @since 1.0.0
 */
export const noContentResponse = (
  description: string,
  ...setters: Array<I.Setter<OpenApiSpecResponse<OpenAPISchemaType>>>
): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
(spec, componentSchemaCallback) => ({
  ...spec,
  responses: {
    ...spec.responses,
    [204]: I.runSetters(
      { description },
      setters,
      componentSchemaCallback
    )
  }
})

/**
 * Set JSON response for a HTTP status code.
 *
 * *Available setter*: `description`
 * *Setter of*: `operation`
 *
 * @param {OpenAPISpecStatusCode} statusCode - HTTP status code
 * @param {Schema} contentSchema - schema for the request body
 * @param {string} description - description of the response
 *
 * @since 1.0.0
 */
export const jsonResponse = (
  statusCode: OpenAPISpecStatusCode,
  contentSchema: AnySchema | undefined,
  description: string,
  ...setters: Array<I.Setter<OpenApiSpecResponse<OpenAPISchemaType>>>
): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
(spec, componentSchemaCallback) => ({
  ...spec,
  responses: {
    ...spec.responses,
    [statusCode]: I.runSetters(
      {
        ...spec.responses?.[statusCode],
        ...(contentSchema && {
          content: modifyContentJsonSchema(
            spec.responses?.[statusCode]?.content,
            contentSchema,
            componentSchemaCallback
          )
        }),
        description
      },
      setters,
      componentSchemaCallback
    )
  }
})

/**
 * Adds operation tags.
 *
 * *Setter of*: `operation`
 *
 * @param {...string} tags - one of more tag values
 *
 * @since 1.0.0
 */
export const tags = (
  tag: string,
  ...tags: Array<string>
): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> =>
(spec) => ({
  ...spec,
  tags: [...(spec.tags ?? []), tag, ...tags]
})

/**
 * Set operationId.
 *
 * @param {string} operationId
 *
 * @since 1.0.0
 */
export const operationId = (operationId: string): I.Setter<OpenAPISpecOperation<OpenAPISchemaType>> => (spec) => ({
  ...spec,
  operationId
})

/**
 * Set description.
 *
 * @param {string} description - text of the description
 *
 * @since 1.0.0
 */
export const description = (description: string): I.Setter<{ description?: string }> => (spec) => ({
  ...spec,
  description
})

/**
 * Adds component schema
 *
 * @since 1.0.0
 */
export const componentSchema =
  (name: string, ast: AST.AST): I.Setter<OpenAPISpec<OpenAPISchemaType>> => (spec, componentSchemaCallback) => ({
    ...spec,
    components: {
      ...spec.components,
      schemas: {
        ...spec.components?.schemas,
        [name]: openAPISchemaForAst(
          I.removeIdentifierAnnotation(
            ast
          ), /* Remove identifier, so we don't create infinite loop */
          componentSchemaCallback
        )
      }
    }
  })

/**
 * Adds reference
 *
 * @since 1.0.0
 */
export const reference: (referenceName: string) => OpenAPISpecReference = circular.reference

/**
 * Set description.
 *
 * @param {string} summary - text of the summary
 *
 * @since 1.0.0
 */
export const summary = (summary: string): I.Setter<{ summary?: string }> => (spec) => ({ ...spec, summary })

/**
 * Set response headers.
 *
 * @param {string} headers
 *
 * @since 1.0.0
 */
export const responseHeaders = (
  headers: Record<string, Schema.Schema<any, string, any>>
): I.Setter<OpenApiSpecResponse<OpenAPISchemaType>> =>
(spec, componentSchemaCallback) => ({
  ...spec,
  headers: Object.entries(headers).reduce((obj, [name, schema]) => {
    const descriptionObj = pipe(
      schema.ast,
      AST.getAnnotation<AST.DescriptionAnnotation>(
        AST.DescriptionAnnotationId
      ),
      Option.match({
        onNone: () => undefined,
        onSome: (description) => ({ description })
      })
    )

    return {
      ...obj,
      [name]: {
        schema: openAPISchemaFor(schema, componentSchemaCallback),
        ...descriptionObj
      }
    }
  }, {})
})

/**
 * Add a security scheme to the specification.
 *
 * *Setter of*: `openAPI`
 *
 * @param {string} name - name of the security scheme
 * @param {OpenAPISecurityScheme} securityScheme - security scheme
 *
 * @since 1.0.0
 */
export const securityScheme = (
  name: string,
  securityScheme: OpenAPISecurityScheme
): I.Setter<OpenAPISpec<OpenAPISchemaType>> =>
(spec) => ({
  ...spec,
  components: {
    ...spec.components,
    securitySchemes: {
      ...spec.components?.securitySchemes,
      [name]: securityScheme
    }
  }
})

/**
 * Add a security requirement to the specification.
 *
 * *Setter of*: `openAPI`, `operation`
 *
 * @param {string} securityScheme - name of the security scheme
 * @param {string[]} scopes - list of required OAuth2 scopes
 *
 * @since 1.0.0
 */
export const securityRequirement = (
  securityScheme: string,
  scopes: Array<string> = []
): I.Setter<{ security?: Array<OpenAPISecurityRequirement> }> =>
(spec) => ({
  ...spec,
  security: [...(spec.security ?? []), { [securityScheme]: scopes }]
})

/** @internal */
const modifyContentJsonSchema = (
  content: OpenApiSpecContent<OpenAPISchemaType> | undefined,
  schema: AnySchema | undefined,
  componentSchemaCallback: I.ComponentSchemaCallback
): OpenApiSpecContent<OpenAPISchemaType> => ({
  "application/json": {
    ...(content && content["application/json"]),
    ...(schema && {
      schema: {
        ...openAPISchemaFor(schema, componentSchemaCallback)
      }
    })
  }
})
