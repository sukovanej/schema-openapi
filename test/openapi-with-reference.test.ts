import SwaggerParser from "@apidevtools/swagger-parser"
import { pipe } from "effect"
import { OpenApi } from "schema-openapi"
import { describe, expect, it } from "vitest"

import * as Schema from "@effect/schema/Schema"

const recursiveOpenApiDefinition = {
  openapi: "3.0.3",
  info: {
    title: "test",
    version: "0.1"
  },
  paths: {
    "/pet": {
      post: {
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Category"
                }
              }
            },
            description: "Test"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Category: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "a string"
          },
          categories: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Category"
            }
          }
        },
        required: ["name", "categories"]
      }
    }
  }
}

describe("component schema and reference", () => {
  it("component schema", async () => {
    const spec = OpenApi.openAPI(
      "test",
      "0.1",
      OpenApi.componentSchema(
        "MyComponent",
        Schema.struct({ value: Schema.string }).ast
      )
    )
    const openapi = {
      openapi: "3.0.3",
      info: { title: "test", version: "0.1" },
      paths: {},
      components: {
        schemas: {
          MyComponent: {
            type: "object",
            required: ["value"],
            properties: {
              value: {
                type: "string",
                description: "a string"
              }
            }
          }
        }
      }
    }
    expect(spec).toStrictEqual(openapi)

    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  it("reference only", async () => {
    const ReferencedType = pipe(
      Schema.struct({ something: Schema.string }),
      Schema.identifier("ReferencedType")
    )
    const spec = OpenApi.openAPI(
      "test",
      "0.1",
      OpenApi.path(
        "/pet",
        OpenApi.operation(
          "post",
          OpenApi.jsonResponse(200, ReferencedType, "Test")
        )
      )
    )
    const openapi = {
      openapi: "3.0.3",
      info: { title: "test", version: "0.1" },
      paths: {
        "/pet": {
          post: {
            responses: {
              200: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ReferencedType"
                    }
                  }
                },
                description: "Test"
              }
            }
          }
        }
      },
      components: {
        schemas: {
          ReferencedType: {
            properties: {
              something: {
                description: "a string",
                type: "string"
              }
            },
            required: ["something"],
            type: "object"
          }
        }
      }
    }
    expect(spec).toStrictEqual(openapi)

    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  it("reference with sub schema as reference", async () => {
    const ReferencedSubType = pipe(
      Schema.struct({ more: Schema.string }),
      Schema.identifier("ReferencedSubType")
    )
    const ReferencedType = pipe(
      Schema.struct({ something: Schema.string, sub: ReferencedSubType }),
      Schema.identifier("ReferencedType")
    )
    const spec = OpenApi.openAPI(
      "test",
      "0.1",
      OpenApi.path(
        "/pet",
        OpenApi.operation(
          "post",
          OpenApi.jsonResponse(200, ReferencedType, "Test")
        )
      )
    )
    const openapi = {
      openapi: "3.0.3",
      info: { title: "test", version: "0.1" },
      paths: {
        "/pet": {
          post: {
            responses: {
              200: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/ReferencedType"
                    }
                  }
                },
                description: "Test"
              }
            }
          }
        }
      },
      components: {
        schemas: {
          ReferencedType: {
            properties: {
              something: {
                description: "a string",
                type: "string"
              },
              sub: {
                $ref: "#/components/schemas/ReferencedSubType"
              }
            },
            required: ["something", "sub"],
            type: "object"
          },
          ReferencedSubType: {
            properties: {
              more: {
                description: "a string",
                type: "string"
              }
            },
            required: ["more"],
            type: "object"
          }
        }
      }
    }
    expect(spec).toStrictEqual(openapi)

    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  it("reference with recursive reference and identifier inside lazy", async () => {
    interface Category {
      readonly name: string
      readonly categories: ReadonlyArray<Category>
    }
    const categorySchema: Schema.Schema<Category> = Schema.suspend<Category, Category, never>(() =>
      Schema.struct({
        name: Schema.string,
        categories: Schema.array(categorySchema)
      }).pipe(Schema.identifier("Category"))
    )
    const spec = OpenApi.openAPI(
      "test",
      "0.1",
      OpenApi.path(
        "/pet",
        OpenApi.operation(
          "post",
          OpenApi.jsonResponse(200, categorySchema, "Test")
        )
      )
    )
    expect(spec).toStrictEqual(recursiveOpenApiDefinition)

    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  it("reference with recursive reference and identifier on lazy", async () => {
    interface Category {
      readonly name: string
      readonly categories: ReadonlyArray<Category>
    }

    const categorySchema: Schema.Schema<Category, Category, never> = Schema.suspend<Category, Category, never>(() =>
      Schema.struct({
        name: Schema.string,
        categories: Schema.array(categorySchema)
      })
    ).pipe(Schema.identifier("Category"))

    const spec = OpenApi.openAPI(
      "test",
      "0.1",
      OpenApi.path(
        "/pet",
        OpenApi.operation(
          "post",
          OpenApi.jsonResponse(200, categorySchema, "Test")
        )
      )
    )
    expect(spec).toStrictEqual(recursiveOpenApiDefinition)

    // @ts-expect-error
    SwaggerParser.validate(spec)
  })

  // reported in https://github.com/sukovanej/effect-http/issues/471
  it.each(
    [
      Schema.optional(Schema.Date, { nullable: true, exact: true, as: "Option" }),
      Schema.optional(Schema.Date, { nullable: true, default: () => new Date() }),
      Schema.optional(Schema.Date, { exact: true, default: () => new Date() }),
      Schema.optional(Schema.Date, { exact: true, as: "Option" }),
      Schema.optional(Schema.Date, { nullable: true, as: "Option" }),
      Schema.optional(Schema.Date, { as: "Option" }),
      Schema.optional(Schema.Date, { exact: true }),
      Schema.optional(Schema.Date)
    ]
  )("optional variants", async (fieldSchema) => {
    const MySchema = Schema.struct({ field: fieldSchema }).pipe(Schema.identifier("Foo"))

    const spec = OpenApi.openAPI(
      "test",
      "0.1",
      OpenApi.path(
        "/pet",
        OpenApi.operation(
          "post",
          OpenApi.jsonResponse(200, MySchema, "my response")
        )
      )
    )

    expect(Object.keys(spec.components!.schemas!)).toHaveLength(1)
  })
})
