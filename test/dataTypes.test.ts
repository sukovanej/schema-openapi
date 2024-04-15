import { pipe } from "effect"

import { Schema } from "@effect/schema"

import { openAPISchemaFor } from "schema-openapi/OpenApiCompiler"
import { describe, expect, it, test } from "vitest"

// https://swagger.io/docs/specification/data-models/data-types/

describe("data types", () => {
  it("boolean", () => {
    const schema = Schema.Boolean

    expect(openAPISchemaFor(schema)).toStrictEqual({
      description: "a boolean",
      type: "boolean"
    })
  })

  it("string", () => {
    const schema = Schema.String

    expect(openAPISchemaFor(schema)).toStrictEqual({
      description: "a string",
      type: "string"
    })
  })

  it("branded string", () => {
    const schema = pipe(Schema.String, Schema.brand("my-string"))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      description: "a string",
      type: "string"
    })
  })

  it("string with minLength", () => {
    const schema = pipe(Schema.String, Schema.minLength(1))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      minLength: 1,
      description: "a string at least 1 character(s) long"
    })
  })

  it("string with maxLength", () => {
    const schema = pipe(Schema.String, Schema.maxLength(10))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      maxLength: 10,
      description: "a string at most 10 character(s) long"
    })
  })

  it("string with minLength and maxLength", () => {
    const schema = pipe(
      Schema.String,
      Schema.minLength(1),
      Schema.maxLength(10)
    )

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      minLength: 1,
      maxLength: 10,
      description: "a string at most 10 character(s) long"
    })
  })

  it("string with pattern", () => {
    const schema = pipe(Schema.String, Schema.pattern(/^\d{3}-\d{2}-\d{4}$/))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      pattern: "^\\d{3}-\\d{2}-\\d{4}$",
      description: "a string matching the pattern ^\\d{3}-\\d{2}-\\d{4}$"
    })
  })

  it("number", () => {
    const schema = Schema.Number

    expect(openAPISchemaFor(schema)).toStrictEqual({
      description: "a number",
      type: "number"
    })
  })

  it("integer", () => {
    const schema = pipe(Schema.Number, Schema.int())

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "integer",
      description: "an integer"
    })
  })

  it("integer with exclusive min", () => {
    const schema = pipe(Schema.Number, Schema.int(), Schema.greaterThan(10))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "integer",
      exclusiveMinimum: true,
      minimum: 10,
      description: "a number greater than 10"
    })
  })

  it("integer with exclusive max", () => {
    const schema = pipe(Schema.Number, Schema.int(), Schema.lessThan(10))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "integer",
      exclusiveMaximum: true,
      maximum: 10,
      description: "a number less than 10"
    })
  })

  it("integer with non-exclusive min", () => {
    const schema = pipe(
      Schema.Number,
      Schema.int(),
      Schema.greaterThanOrEqualTo(10)
    )

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "integer",
      minimum: 10,
      description: "a number greater than or equal to 10"
    })
  })

  it("integer with non-exclusive max", () => {
    const schema = pipe(
      Schema.Number,
      Schema.int(),
      Schema.lessThanOrEqualTo(10)
    )

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "integer",
      maximum: 10,
      description: "a number less than or equal to 10"
    })
  })

  it("number with exclusive min", () => {
    const schema = pipe(Schema.Number, Schema.greaterThan(10))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "number",
      exclusiveMinimum: true,
      minimum: 10,
      description: "a number greater than 10"
    })
  })

  it("number with exclusive max", () => {
    const schema = pipe(Schema.Number, Schema.lessThan(10))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "number",
      exclusiveMaximum: true,
      maximum: 10,
      description: "a number less than 10"
    })
  })

  it("number with non-exclusive min", () => {
    const schema = pipe(Schema.Number, Schema.greaterThanOrEqualTo(10))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "number",
      minimum: 10,
      description: "a number greater than or equal to 10"
    })
  })

  it("number with non-exclusive max", () => {
    const schema = pipe(Schema.Number, Schema.lessThanOrEqualTo(10))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "number",
      maximum: 10,
      description: "a number less than or equal to 10"
    })
  })

  it("parsed number", () => {
    const schema = Schema.NumberFromString

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      description: "a string"
    })
  })
})

describe("nullable data types", () => {
  it("nullable number", () => {
    const schema = pipe(Schema.Number, Schema.NullOr)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "number",
      description: "a number",
      nullable: true
    })
  })

  it("nullable string", () => {
    const schema = pipe(Schema.String, Schema.NullOr)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      description: "a string",
      nullable: true
    })
  })

  it("nullable string array", () => {
    const schema = pipe(Schema.String, Schema.Array, Schema.NullOr)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "array",
      items: { type: "string", description: "a string" },
      nullable: true
    })
  })
})

describe("arrays", () => {
  it("number array", () => {
    const schema = Schema.Array(Schema.Number)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "array",
      items: { type: "number", description: "a number" }
    })
  })

  it("string array", () => {
    const schema = pipe(Schema.String, Schema.Array)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "array",
      items: { type: "string", description: "a string" }
    })
  })

  it("2d number array", () => {
    const schema = pipe(Schema.Number, Schema.Array, Schema.Array)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "array",
      items: {
        type: "array",
        items: { type: "number", description: "a number" }
      }
    })
  })

  it("object array", () => {
    const schema = pipe(Schema.Struct({ id: Schema.Number }), Schema.Array)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "number", description: "a number" } },
        required: ["id"]
      }
    })
  })

  it("mixed type array", () => {
    const schema = pipe(
      Schema.Union(Schema.Number, Schema.String),
      Schema.Array
    )

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "array",
      items: {
        oneOf: [
          { type: "number", description: "a number" },
          { type: "string", description: "a string" }
        ]
      }
    })
  })

  it("array of any items", () => {
    const schema = Schema.Array(Schema.Any)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "array",
      items: {}
    })
  })

  it("single item array", () => {
    const schema = Schema.Tuple(Schema.String)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "array",
      items: {
        type: "string",
        description: "a string"
      },
      minItems: 1,
      maxItems: 1
    })
  })

  it("non-empty array", () => {
    const schema = Schema.NonEmptyArray(Schema.String)

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "array",
      items: {
        type: "string",
        description: "a string"
      },
      minItems: 1
    })
  })

  // TODO: array length
  // TODO: unique items
})

describe("objects", () => {
  it("object", () => {
    const schema = Schema.Struct({
      id: Schema.int()(Schema.Number),
      name: Schema.String
    })

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "object",
      properties: {
        id: { type: "integer", description: "an integer" },
        name: { type: "string", description: "a string" }
      },
      required: ["name", "id"]
    })
  })

  it("object with non-required", () => {
    const schema = Schema.Object

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "object",
      description: "an object in the TypeScript meaning, i.e. the `object` type"
    })
  })

  it("object with non-required", () => {
    const schema = Schema.Struct({
      id: Schema.int()(Schema.Number),
      username: Schema.String,
      name: Schema.optional(Schema.String)
    })

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "object",
      properties: {
        id: { type: "integer", description: "an integer" },
        name: { type: "string", description: "a string" },
        username: { type: "string", description: "a string" }
      },
      required: ["username", "id"]
    })
  })

  it("brands", () => {
    const schema = pipe(
      Schema.Struct({
        id: Schema.int()(Schema.Number),
        username: Schema.String,
        name: Schema.optional(Schema.String)
      }),
      Schema.brand("my-schema")
    )

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "object",
      properties: {
        id: { type: "integer", description: "an integer" },
        name: { description: "a string", type: "string" },
        username: { description: "a string", type: "string" }
      },
      required: ["username", "id"]
    })
  })
})

it("optionFromNullable", () => {
  const schema = Schema.Struct({
    value: Schema.OptionFromNullOr(Schema.String)
  })

  expect(openAPISchemaFor(schema)).toStrictEqual({
    type: "object",
    properties: {
      value: { description: "a string", type: "string", nullable: true }
    },
    required: ["value"]
  })
})

describe("description annotation", () => {
  test("null", () => {
    const schema = pipe(
      Schema.Null,
      Schema.description("it is always missing")
    )

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "null",
      description: "it is always missing"
    })
  })

  test("string", () => {
    const schema = pipe(Schema.String, Schema.description("my description"))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      description: "my description"
    })
  })

  test("number", () => {
    const schema = pipe(Schema.Number, Schema.description("my description"))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "number",
      description: "my description"
    })
  })

  test("boolean", () => {
    const schema = pipe(Schema.Boolean, Schema.description("my description"))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "boolean",
      description: "my description"
    })
  })

  test("object", () => {
    const schema = pipe(Schema.Object, Schema.description("my description"))

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "object",
      description: "my description"
    })
  })

  test("tuple", () => {
    const schema = pipe(
      Schema.Tuple(pipe(Schema.String, Schema.description("my description"))),
      Schema.description("my description")
    )

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "array",
      items: {
        type: "string",
        description: "my description"
      },
      minItems: 1,
      maxItems: 1,
      description: "my description"
    })
  })

  it("type literal", () => {
    const schema = pipe(
      Schema.Struct({
        id: pipe(
          Schema.Number,
          Schema.int(),
          Schema.description("id description")
        ),
        name: pipe(
          Schema.Literal("value"),
          Schema.description("value description")
        )
      }),
      Schema.description("my description")
    )

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "object",
      properties: {
        id: { type: "integer", description: "id description" },
        name: { enum: ["value"], description: "value description" }
      },
      required: ["name", "id"],
      description: "my description"
    })
  })

  test("union", () => {
    const schema = pipe(
      Schema.Literal("value", "another"),
      Schema.description("my description")
    )

    expect(openAPISchemaFor(schema)).toStrictEqual({
      type: "string",
      enum: ["value", "another"],
      description: "my description"
    })
  })
})
