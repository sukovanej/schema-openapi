import { pipe } from "effect"

import { Schema } from "@effect/schema"

import { openAPISchemaFor } from "schema-openapi/OpenApiCompiler"
import { describe, expect, it } from "vitest"

// https://swagger.io/docs/specification/data-models/enums/

describe("enums", () => {
  it("literals", () => {
    const schema = Schema.literal("asc", "desc")

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      enum: ["asc", "desc"]
    })
  })

  it("nullable literals", () => {
    const schema = pipe(Schema.literal("asc", "desc"), Schema.nullable)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      nullable: true,
      enum: ["asc", "desc"]
    })
  })

  it("enum", () => {
    enum Enum {
      Asc = "asc",
      Desc = "desc"
    }
    const schema = Schema.enums(Enum)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      enum: ["asc", "desc"]
    })
  })

  it("nullable enum", () => {
    enum Enum {
      Asc = "asc",
      Desc = "desc"
    }
    const schema = pipe(Schema.enums(Enum), Schema.nullable)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      nullable: true,
      enum: ["asc", "desc", null]
    })
  })
})
