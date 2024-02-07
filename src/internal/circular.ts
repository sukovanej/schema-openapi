import type { OpenAPISpecReference } from "schema-openapi/OpenApiTypes"

export const reference = (referenceName: string): OpenAPISpecReference => ({
  $ref: `#/components/schemas/${referenceName}`
})
