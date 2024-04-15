import * as Schema from "@effect/schema/Schema"

import { openAPISchemaFor } from "schema-openapi/OpenApiCompiler"
import { describe, expect, it } from "vitest"

// https://swagger.io/docs/specification/data-models/dictionaries/

describe("records", () => {
  it("string to string map", () => {
    const schema = Schema.Record(Schema.String, Schema.String)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "object",
      additionalProperties: {
        description: "a string",
        type: "string"
      }
    })
  })

  it("string to object map", () => {
    const schema = Schema.Record(
      Schema.String,
      Schema.Struct({
        code: Schema.optional(Schema.Number, { exact: true }),
        text: Schema.optional(Schema.String)
      })
    )

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          code: {
            description: "a number",
            type: "number"
          },
          text: {
            description: "a string",
            type: "string"
          }
        }
      }
    })
  })
})
