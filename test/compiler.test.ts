import { OpenApiCompiler } from "schema-openapi"

import { Schema } from "@effect/schema"
import { expect, test } from "vitest"

test("Declaration", () => {
  const MySchema = Schema.instanceOf(FormData).pipe(
    OpenApiCompiler.annotate({ type: "string" }),
    Schema.description("form data")
  )

  expect(OpenApiCompiler.openAPISchemaForAst(MySchema.ast, () => undefined)).toEqual({
    type: "string",
    description: "form data"
  })
})
