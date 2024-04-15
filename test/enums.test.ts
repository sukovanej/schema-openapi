import { pipe } from "effect"

import { Schema } from "@effect/schema"

import { openAPISchemaFor } from "schema-openapi/OpenApiCompiler"
import { describe, expect, it } from "vitest"

// https://swagger.io/docs/specification/data-models/enums/

describe("enums", () => {
  it("literals", () => {
    const schema = Schema.Literal("asc", "desc")

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      enum: ["asc", "desc"]
    })
  })

  it("nullable literals", () => {
    const schema = pipe(Schema.Literal("asc", "desc"), Schema.NullOr)

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
    const schema = Schema.Enums(Enum)

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
    const schema = pipe(Schema.Enums(Enum), Schema.NullOr)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      nullable: true,
      enum: ["asc", "desc", null]
    })
  })
})
