import express from "express"
import { OpenApi } from "schema-openapi"
import swaggerUi from "swagger-ui-express"

import { Schema } from "@effect/schema"

const Pet = Schema.Struct({
  name: Schema.String,
  id: Schema.Number
})

const UsageId = Schema.annotations(Schema.String, { description: "Usage identifier" })

const app = express()
const spec = OpenApi.openAPI(
  "My awesome pets API",
  "1.0.0",
  OpenApi.globalTags({
    name: "Pets",
    description: "Everything about your Pets",
    externalDocs: {
      description: "Find out more",
      url: "http://swagger.io"
    }
  }),
  OpenApi.path(
    "/pet",
    OpenApi.operation(
      "get",
      OpenApi.tags("Pets"),
      OpenApi.jsonResponse(
        200,
        Pet,
        "Pet response",
        OpenApi.responseHeaders({ "Usage-Id": UsageId })
      ),
      OpenApi.operationId("getPet")
    ),
    OpenApi.operation(
      "post",
      OpenApi.tags("Pets"),
      OpenApi.jsonRequest(Pet),
      OpenApi.operationId("savePet")
    ),
    OpenApi.operation(
      "put",
      OpenApi.tags("Pets"),
      OpenApi.jsonRequest(Pet),
      OpenApi.operationId("replacePet")
    )
  )
)

app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec))

app.listen(4000, () => console.log("listening"))
