import * as Schema from "@effect/schema/Schema"

import { openAPISchemaFor } from "schema-openapi/OpenApiCompiler"
import { describe, expect, it } from "vitest"

// https://swagger.io/docs/specification/data-models/dictionaries/

describe("records", () => {
  it("string to string map", () => {
    const schema = Schema.record(Schema.string, Schema.string)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "object",
      additionalProperties: {
        description: "a string",
        type: "string"
      }
    })
  })

  it("string to object map", () => {
    const schema = Schema.record(
      Schema.string,
      Schema.struct({
        code: Schema.optional(Schema.number, { exact: true }),
        text: Schema.optional(Schema.string)
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
