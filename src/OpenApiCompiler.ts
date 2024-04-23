/**
 * Based on https://github.com/effect/schema/blob/0.1.0/test/compiler/JSONSchema.ts
 *
 * @since 1.0.0
 */
import * as Array from "effect/Array"
import { pipe } from "effect/Function"
import * as Option from "effect/Option"
import type { ComponentSchemaCallback } from "./internal/internal.js"
import type {
  OpenAPISchemaArrayType,
  OpenAPISchemaEnumType,
  OpenAPISchemaObjectType,
  OpenAPISchemaType
} from "./OpenApiTypes.js"

import * as AST from "@effect/schema/AST"
import * as Schema from "@effect/schema/Schema"
import * as circular from "./internal/circular.js"

const OpenApiId = Symbol.for("schema-openapi/OpenApiId")

/**
 * @since 1.0.0
 */
export const annotate = (spec: OpenAPISchemaType) => <A, I, R>(self: Schema.Schema<A, I, R>): Schema.Schema<A, I, R> =>
  Schema.make(AST.annotations(self.ast, { [OpenApiId]: spec }))

/**
 * @since 1.0.0
 */
export const getOpenApiAnnotation = (ast: AST.Annotated) => AST.getAnnotation<OpenAPISchemaType>(OpenApiId)(ast)

/** @internal */
const convertJsonSchemaAnnotation = (annotations: object) => {
  let newAnnotations = annotations

  if ("exclusiveMinimum" in newAnnotations) {
    const { exclusiveMinimum, ...rest } = newAnnotations
    newAnnotations = {
      ...rest,
      exclusiveMinimum: true,
      minimum: exclusiveMinimum
    }
  }

  if ("exclusiveMaximum" in newAnnotations) {
    const { exclusiveMaximum, ...rest } = newAnnotations
    newAnnotations = {
      ...rest,
      exclusiveMaximum: true,
      maximum: exclusiveMaximum
    }
  }

  return newAnnotations
}

/** @internal */
const getJSONSchemaAnnotation = (ast: AST.Annotated) =>
  pipe(
    ast,
    AST.getAnnotation<AST.JSONSchemaAnnotation>(AST.JSONSchemaAnnotationId),
    Option.map(convertJsonSchemaAnnotation)
  )

/** @internal */
const addDescription = (ast: AST.Annotated) => (schema: OpenAPISchemaType) =>
  pipe(
    ast,
    AST.getAnnotation<AST.DescriptionAnnotation>(AST.DescriptionAnnotationId),
    Option.map((description) => ({ ...schema, description })),
    Option.getOrElse(() => schema)
  )

/** @internal */
const createEnum = <T extends AST.LiteralValue>(
  types: ReadonlyArray<T>,
  nullable: boolean
): OpenAPISchemaEnumType => {
  const type = typeof types[0]

  if (type !== "string" && type !== "number") {
    throw new Error("Enum values must be either strings or numbers")
  }

  const nullableObj = nullable && { nullable: true }
  const values = types as ReadonlyArray<string | number>

  return {
    type,
    enum: nullable ? [...values, null] : [...values],
    ...nullableObj
  }
}

/**
 * @since 1.0.0
 */
export const openAPISchemaForAst = (
  ast: AST.AST,
  componentSchemaCallback: ComponentSchemaCallback
): OpenAPISchemaType => {
  const handleReference = (ast: AST.AST): OpenAPISchemaType | null => {
    const identifier = Option.getOrUndefined(AST.getIdentifierAnnotation(ast))
    if (identifier !== undefined && componentSchemaCallback) {
      componentSchemaCallback(identifier, ast)
      return circular.reference(identifier)
    }
    return null
  }
  const map = (ast: AST.AST): OpenAPISchemaType => {
    switch (ast._tag) {
      case "Literal": {
        switch (typeof ast.literal) {
          case "bigint":
            return { type: "integer" }
          case "boolean":
            return { type: "boolean", enum: [ast.literal] }
          case "number":
            return { type: "number", enum: [ast.literal] }
          case "string":
            return { type: "string", enum: [ast.literal] }
          default:
            if (ast.literal === null) {
              return { type: "null" }
            }
            throw new Error(`Unknown literal type: ${typeof ast.literal}`)
        }
      }
      case "UnknownKeyword":
      case "AnyKeyword":
        return {}
      case "TemplateLiteral":
      case "StringKeyword": {
        return { type: "string" }
      }
      case "NumberKeyword":
        return { type: "number" }
      case "BooleanKeyword":
        return { type: "boolean" }
      case "ObjectKeyword":
        return { type: "object" }
      case "TupleType": {
        const elements = ast.elements.map((e) => go(e.type))
        const rest = ast.rest.map(go)

        const minItems = ast.elements.filter((e) => !e.isOptional).length || undefined
        let maxItems = minItems
        let items: OpenAPISchemaArrayType["items"] = elements.length === 0
          ? undefined
          : elements.length === 1
          ? elements[0]
          : elements
        let additionalItems = undefined

        // ---------------------------------------------
        // handle rest element
        // ---------------------------------------------
        if (Array.isNonEmptyArray(rest)) {
          const head = Array.headNonEmpty(rest)
          if (items !== undefined) {
            maxItems = undefined

            if (elements[0] !== items) {
              additionalItems = head
            }
          } else {
            items = head
            maxItems = undefined
          }
          // ---------------------------------------------
          // handle post rest elements
          // ---------------------------------------------
          // const tail = RA.tailNonEmpty(rest.value) // TODO
        }

        const minItemsObj = minItems === undefined ? undefined : { minItems }
        const maxItemsObj = maxItems === undefined ? undefined : { maxItems }
        const additionalItemsObj = additionalItems && { additionalItems }

        return {
          type: "array",
          ...minItemsObj,
          ...maxItemsObj,
          ...(items && { items }),
          ...additionalItemsObj
        }
      }
      case "TypeLiteral": {
        if (
          ast.indexSignatures.length <
            ast.indexSignatures.filter(
              (is) => is.parameter._tag === "StringKeyword"
            ).length
        ) {
          throw new Error(
            `Cannot encode some index signature to OpenAPISchema`
          )
        }
        const reference = handleReference(ast)
        if (reference) {
          return reference
        }

        const propertySignatures = ast.propertySignatures.map((ps) => {
          const type = ps.type

          if (
            type._tag === "Union" &&
            type.types.some(AST.isUndefinedKeyword)
          ) {
            const typeWithoutUndefined = AST.Union.make(
              type.types.filter((ast) => !AST.isUndefinedKeyword(ast)),
              type.annotations
            )
            return [go(typeWithoutUndefined), true] as const
          }

          return [go(type), ps.isOptional] as const
        })

        const indexSignatures = ast.indexSignatures.map((is) => go(is.type))
        const output: OpenAPISchemaObjectType = { type: "object" }

        // ---------------------------------------------
        // handle property signatures
        // ---------------------------------------------
        for (let i = 0; i < propertySignatures.length; i++) {
          const [signature, isOptional] = propertySignatures[i]
          const name = ast.propertySignatures[i].name

          if (typeof name !== "string") {
            throw new Error(
              `Cannot encode ${String(name)} key to OpenAPISchema Schema`
            )
          }

          output.properties = output.properties ?? {}
          output.properties[name] = signature
          // ---------------------------------------------
          // handle optional property signatures
          // ---------------------------------------------
          if (!isOptional) {
            output.required = output.required ?? []
            output.required.push(name)
          }
        }
        // ---------------------------------------------
        // handle index signatures
        // ---------------------------------------------
        if (indexSignatures.length > 0) {
          output.additionalProperties = indexSignatures.length === 1
            ? indexSignatures[0]
            : { oneOf: indexSignatures }
        }

        return output
      }
      case "Union": {
        const reference = handleReference(ast)
        if (reference) {
          return reference
        }
        const nullable = ast.types.find(
          (a) => a._tag === "Literal" && a.literal === null
        )
        const nonNullables = ast.types.filter((a) => a !== nullable)
        const nullableObj = nullable && { nullable: true }

        if (nonNullables.length === 1) {
          if (nonNullables[0]._tag === "Enums") {
            return createEnum(
              nonNullables[0].enums.map(([_, value]) => value),
              nullable !== undefined
            )
          }
          return {
            ...go(nonNullables[0]),
            ...nullableObj
          }
        }

        if (nonNullables.every((i): i is AST.Literal => i._tag === "Literal")) {
          return createEnum(
            nonNullables.map((i) => i.literal),
            nullable !== undefined
          )
        }

        return {
          oneOf: nonNullables.map(go),
          ...nullableObj
        }
      }
      case "Enums": {
        const reference = handleReference(ast)
        if (reference) {
          return reference
        }
        return createEnum(
          ast.enums.map(([_, value]) => value),
          false
        )
      }
      case "Refinement": {
        const from = go(ast.from)

        const formatSchema = pipe(
          AST.getIdentifierAnnotation(ast),
          Option.filter((identifier) => identifier === "Date"),
          Option.as({ format: "date-time" }),
          Option.getOrElse(() => ({}))
        )

        return pipe(
          getJSONSchemaAnnotation(ast),
          Option.getOrElse(() => ({})),
          (schema) => ({ ...from, ...schema, ...formatSchema })
        )
      }
      case "Transformation": {
        if (ast.from._tag === "TypeLiteral") {
          const reference = handleReference(ast)
          if (reference) {
            return reference
          }
        }

        return go(ast.from)
      }
      case "Declaration": {
        const spec = getOpenApiAnnotation(ast)

        if (Option.isSome(spec)) {
          return spec.value
        }

        throw new Error(
          `Cannot encode Declaration to OpenAPISchema, please specify OpenApi annotation for custom schemas`
        )
      }
      case "Suspend": {
        const realAst = ast.f()
        const identifier = Option.getOrUndefined(AST.getIdentifierAnnotation(ast)) ??
          Option.getOrUndefined(AST.getIdentifierAnnotation(realAst))
        if (!identifier) {
          console.warn(`Lazy schema must have identifier set.`)
          return {}
        }
        return go(
          AST.annotations(realAst, { [AST.IdentifierAnnotationId]: identifier })
        )
      }
      case "UniqueSymbol":
      case "UndefinedKeyword":
      case "VoidKeyword":
      case "NeverKeyword":
      case "BigIntKeyword":
      case "SymbolKeyword": {
        console.warn(`Schema tag "${ast._tag}" is not supported for OpenAPI.`)
        return {}
      }
    }
  }

  const go = (ast: AST.AST): OpenAPISchemaType => pipe(map(ast), addDescription(ast))

  return go(ast)
}

/**
 * @since 1.0.0
 */
export const openAPISchemaFor = <A>(
  schema: Schema.Schema<any, A, any>,
  componentSchemaCallback: ComponentSchemaCallback = undefined
): OpenAPISchemaType => {
  return openAPISchemaForAst(schema.ast, componentSchemaCallback)
}
