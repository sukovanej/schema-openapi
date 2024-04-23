/**
 * OpenAPI types.
 *
 * @since 1.0.0
 */
import type * as Schema from "@effect/schema/Schema"

/**
 * @category models
 * @since 1.0.0
 */
export type AnySchema = Schema.Schema<any, any, any>

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpec<S = AnySchema> = {
  openapi: "3.0.3"
  info: OpenAPISpecInfo
  servers?: Array<OpenAPISpecServer>
  paths: OpenAPISpecPaths<S>
  components?: OpenAPIComponents<S>
  security?: Array<OpenAPISecurityRequirement>
  tags?: Array<OpenAPISpecTag>
  externalDocs?: OpenAPISpecExternalDocs
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecInfo = {
  title: string
  version: string
  description?: string
  license?: OpenAPISpecLicense
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecTag = {
  name: string
  description?: string
  externalDocs?: OpenAPISpecExternalDocs
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecExternalDocs = {
  url: string
  description?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecLicense = {
  name: string
  url?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecServer = {
  url: string
  description?: string
  variables?: Record<string, OpenAPISpecServerVariable>
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecServerVariable = {
  default: string
  enum?: [string, ...Array<string>]
  description?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecPaths<S = AnySchema> = Record<
  string,
  OpenAPISpecPathItem<S>
>

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecMethodName =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace"

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecPathItem<S = AnySchema> =
  & {
    [K in OpenAPISpecMethodName]?: OpenAPISpecOperation<S>
  }
  & {
    summary?: string
    description?: string
    parameters?: Array<OpenAPISpecParameter>
  }

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecParameter<S = AnySchema> = {
  name: string
  in: "query" | "header" | "path" | "cookie"
  schema: S
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecStatusCode = 200 | 201 | 204

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecResponses<S = AnySchema> = {
  [K in OpenAPISpecStatusCode]?: OpenApiSpecResponse<S>
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenApiSpecContentType = "application/json" | "application/xml"

/**
 * @category models
 * @since 1.0.0
 */
export type OpenApiSpecContent<S = AnySchema> = {
  [K in OpenApiSpecContentType]?: OpenApiSpecMediaType<S>
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenApiSpecResponseHeader<S = AnySchema> = {
  description?: string
  schema: S
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenApiSpecResponseHeaders<S = AnySchema> = Record<
  string,
  OpenApiSpecResponseHeader<S>
>

/**
 * @category models
 * @since 1.0.0
 */
export type OpenApiSpecResponse<S = AnySchema> = {
  content?: OpenApiSpecContent<S>
  headers?: OpenApiSpecResponseHeaders<S>
  description: string
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenApiSpecMediaType<S = AnySchema> = {
  schema?: S
  example?: object
  description?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecRequestBody<S = AnySchema> = {
  content: OpenApiSpecContent<S>
  description?: string
  required?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecReference = {
  $ref: string
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPIComponents<S = AnySchema> = {
  schemas?: Record<string, S>
  securitySchemes?: Record<string, OpenAPISecurityScheme>
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPIHTTPSecurityScheme = {
  type: "http"
  description?: string
  scheme: "bearer" | "basic" | string
  /* only for scheme: 'bearer' */
  bearerFormat?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPIApiKeySecurityScheme = {
  type: "apiKey"
  description?: string
  name: string
  in: "query" | "header" | "cookie"
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPIMutualTLSSecurityScheme = {
  type: "mutualTLS"
  description?: string
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPIOAuth2SecurityScheme = {
  type: "oauth2"
  description?: string
  flows: Record<
    "implicit" | "password" | "clientCredentials" | "authorizationCode",
    Record<string, unknown>
  >
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPIOpenIdConnectSecurityScheme = {
  type: "openIdConnect"
  description?: string
  openIdConnectUrl: string
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISecurityScheme =
  | OpenAPIHTTPSecurityScheme
  | OpenAPIApiKeySecurityScheme
  | OpenAPIMutualTLSSecurityScheme
  | OpenAPIOAuth2SecurityScheme
  | OpenAPIOpenIdConnectSecurityScheme
  | OpenAPISpecReference

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISecurityRequirement = Record<string, Array<string>>

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISpecOperation<S = AnySchema> = {
  requestBody?: OpenAPISpecRequestBody<S>
  responses?: OpenAPISpecResponses<S>
  operationId?: string
  description?: string
  parameters?: Array<OpenAPISpecParameter<S>>
  summary?: string
  deprecated?: boolean
  tags?: Array<string>
  security?: Array<OpenAPISecurityRequirement>
  externalDocs?: OpenAPISpecExternalDocs
}

// Open API schema

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaNullType = {
  type: "null"
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaStringType = {
  type: "string"
  minLength?: number
  maxLength?: number
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaNumberType = {
  type: "number" | "integer"
  minimum?: number
  exclusiveMinimum?: boolean
  maximum?: number
  exclusiveMaximum?: boolean
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaBooleanType = {
  type: "boolean"
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaArrayType = {
  type: "array"
  items?: OpenAPISchemaType | Array<OpenAPISchemaType>
  minItems?: number
  maxItems?: number
  additionalItems?: OpenAPISchemaType
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaEnumType = {
  type: "string" | "number" | "boolean"
  enum: Array<string | number | boolean | null>
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaOneOfType = {
  oneOf: ReadonlyArray<OpenAPISchemaType>
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaAllOfType = {
  allOf: Array<OpenAPISchemaType>
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaObjectType = {
  type: "object"
  required?: Array<string>
  properties?: { [x: string]: OpenAPISchemaType }
  additionalProperties?: boolean | OpenAPISchemaType
  nullable?: boolean
}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaAnyType = {}

/**
 * @category models
 * @since 1.0.0
 */
export type OpenAPISchemaType =
  & {
    description?: string
  }
  & (
    | OpenAPISchemaNullType
    | OpenAPISchemaStringType
    | OpenAPISchemaNumberType
    | OpenAPISchemaBooleanType
    | OpenAPISchemaArrayType
    | OpenAPISchemaEnumType
    | OpenAPISchemaOneOfType
    | OpenAPISchemaAllOfType
    | OpenAPISchemaObjectType
    | OpenAPISchemaAnyType
    | OpenAPISpecReference
  )
