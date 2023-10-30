/** Based on https://github.com/effect/schema/blob/0.1.0/test/compiler/JSONSchema.ts */
import { Option, ReadonlyArray, pipe } from 'effect';
import { ComponentSchemaCallback } from 'schema-openapi/internal';
import { reference } from 'schema-openapi/openapi';
import {
  OpenAPISchemaArrayType,
  OpenAPISchemaObjectType,
  OpenAPISchemaType,
} from 'schema-openapi/types';

import { AST, Schema } from '@effect/schema';
import { getIdentifierAnnotation } from '@effect/schema/AST';

const convertJsonSchemaAnnotation = (annotations: object) => {
  let newAnnotations = annotations;

  if ('exclusiveMinimum' in newAnnotations) {
    let { exclusiveMinimum, ...rest } = newAnnotations;
    newAnnotations = {
      ...rest,
      exclusiveMinimum: true,
      minimum: exclusiveMinimum,
    };
  }

  if ('exclusiveMaximum' in newAnnotations) {
    let { exclusiveMaximum, ...rest } = newAnnotations;
    newAnnotations = {
      ...rest,
      exclusiveMaximum: true,
      maximum: exclusiveMaximum,
    };
  }

  return newAnnotations;
};

const getJSONSchemaAnnotation = (ast: AST.Annotated) =>
  pipe(
    AST.getAnnotation<AST.JSONSchemaAnnotation>(AST.JSONSchemaAnnotationId)(
      ast
    ),
    Option.map(convertJsonSchemaAnnotation)
  );

const addDescription = (ast: AST.Annotated) => (schema: OpenAPISchemaType) =>
  pipe(
    ast,
    AST.getAnnotation<AST.DescriptionAnnotation>(AST.DescriptionAnnotationId),
    Option.map((description) => ({ ...schema, description })),
    Option.getOrElse(() => schema)
  );

const createEnum = <T extends AST.LiteralValue>(
  types: readonly T[],
  nullable: boolean
) => {
  const type = typeof types[0];

  if (type !== 'string' && type !== 'number') {
    throw new Error('Enum values must be either strings or numbers');
  }

  const nullableObj = nullable && { nullable: true };

  return {
    type,
    enum: nullable ? [...types, null] : types,
    ...nullableObj,
  };
};

export const openAPISchemaForAst = (
  ast: AST.AST,
  componentSchemaCallback: ComponentSchemaCallback
): OpenAPISchemaType => {
  const map = (ast: AST.AST): OpenAPISchemaType => {
    switch (ast._tag) {
      case 'Literal': {
        if (typeof ast.literal === 'bigint') {
          return { type: 'integer' };
        } else if (ast.literal === null) {
          return { type: 'null' };
        }
        return { const: ast.literal };
      }
      case 'UnknownKeyword':
      case 'AnyKeyword':
        return {};
      case 'TemplateLiteral':
      case 'StringKeyword':
        return { type: 'string' };
      case 'NumberKeyword':
        return { type: 'number' };
      case 'BooleanKeyword':
        return { type: 'boolean' };
      case 'ObjectKeyword':
        return { type: 'object' };
      case 'Tuple': {
        const elements = ast.elements.map((e) => go(e.type));
        const rest = Option.map(ast.rest, ReadonlyArray.map(go));

        let minItems =
          ast.elements.filter((e) => !e.isOptional).length || undefined;
        let maxItems = minItems;
        let items: OpenAPISchemaArrayType['items'] =
          elements.length === 0
            ? undefined
            : elements.length === 1
            ? elements[0]
            : elements;
        let additionalItems = undefined;

        // ---------------------------------------------
        // handle rest element
        // ---------------------------------------------
        if (Option.isSome(rest)) {
          const head = ReadonlyArray.headNonEmpty(rest.value);
          if (items !== undefined) {
            maxItems = undefined;

            if (elements[0] !== items) {
              additionalItems = head;
            }
          } else {
            items = head;
            maxItems = undefined;
          }
          // ---------------------------------------------
          // handle post rest elements
          // ---------------------------------------------
          // const tail = RA.tailNonEmpty(rest.value) // TODO
        }

        const minItemsObj = minItems && { minItems };
        const maxItemsObj = maxItems && { maxItems };
        const additionalItemsObj = additionalItems && { additionalItems };

        return {
          type: 'array',
          ...minItemsObj,
          ...maxItemsObj,
          items,
          ...additionalItemsObj,
        };
      }
      case 'TypeLiteral': {
        if (
          ast.indexSignatures.length <
          ast.indexSignatures.filter(
            (is) => is.parameter._tag === 'StringKeyword'
          ).length
        ) {
          throw new Error(
            `Cannot encode some index signature to OpenAPISchema`
          );
        }
        const identifier = Option.getOrUndefined(getIdentifierAnnotation(ast));
        if (identifier && componentSchemaCallback) {
          componentSchemaCallback(identifier, ast);
          return reference(identifier);
        }
        const propertySignatures = ast.propertySignatures.map((ps) =>
          go(ps.type)
        );
        const indexSignatures = ast.indexSignatures.map((is) => go(is.type));
        const output: OpenAPISchemaObjectType = { type: 'object' };

        // ---------------------------------------------
        // handle property signatures
        // ---------------------------------------------
        for (let i = 0; i < propertySignatures.length; i++) {
          const name = ast.propertySignatures[i].name;
          if (typeof name === 'string') {
            output.properties = output.properties ?? {};
            output.properties[name] = propertySignatures[i];
            // ---------------------------------------------
            // handle optional property signatures
            // ---------------------------------------------
            if (!ast.propertySignatures[i].isOptional) {
              output.required = output.required ?? [];
              output.required.push(name);
            }
          } else {
            throw new Error(
              `Cannot encode ${String(name)} key to OpenAPISchema Schema`
            );
          }
        }
        // ---------------------------------------------
        // handle index signatures
        // ---------------------------------------------
        if (indexSignatures.length > 0) {
          output.additionalProperties =
            indexSignatures.length === 1
              ? indexSignatures[0]
              : { oneOf: indexSignatures };
        }

        return output;
      }
      case 'Union': {
        const nullable = ast.types.find(
          (a) => a._tag === 'Literal' && a.literal === null
        );
        const nonNullables = ast.types.filter((a) => a !== nullable);
        const nullableObj = nullable && { nullable: true };

        if (nonNullables.length === 1) {
          if (nonNullables[0]._tag === 'Enums') {
            return createEnum(
              nonNullables[0].enums.map(([_, value]) => value),
              nullable !== undefined
            );
          }
          return {
            ...go(nonNullables[0]),
            ...nullableObj,
          };
        }

        if (nonNullables.every((i): i is AST.Literal => i._tag === 'Literal')) {
          return createEnum(
            nonNullables.map((i) => i.literal),
            nullable !== undefined
          );
        }

        return {
          oneOf: nonNullables.map(go),
          ...nullableObj,
        };
      }
      case 'Enums': {
        return createEnum(
          ast.enums.map(([_, value]) => value),
          false
        );
      }
      case 'Refinement': {
        const from = go(ast.from);
        return pipe(
          getJSONSchemaAnnotation(ast),
          Option.match({
            onNone: () => from,
            onSome: (schema) => ({ ...from, ...schema }),
          })
        );
      }
      case 'Transform':
        return go(ast.from);
      case 'Declaration':
        return go(ast.type);
      case 'Lazy':
        const realAst = ast.f();
        const identifier =
          Option.getOrUndefined(getIdentifierAnnotation(ast)) ??
          Option.getOrUndefined(getIdentifierAnnotation(realAst));
        if (!identifier) {
          console.warn(`Lazy schema must have identifier set.`);
          return {};
        }
        return go(
          AST.setAnnotation(realAst, AST.IdentifierAnnotationId, identifier)
        );
      case 'UniqueSymbol':
      case 'UndefinedKeyword':
      case 'VoidKeyword':
      case 'NeverKeyword':
      case 'BigIntKeyword':
      case 'SymbolKeyword': {
        console.warn(`Schema tag "${ast._tag}" is not supported for OpenAPI.`);
        return {};
      }
    }
  };

  const go = (ast: AST.AST): OpenAPISchemaType =>
    pipe(map(ast), addDescription(ast));

  return go(ast);
};

export const openAPISchemaFor = <A>(
  schema: Schema.Schema<A, any>,
  componentSchemaCallback: ComponentSchemaCallback = undefined
): OpenAPISchemaType => {
  return openAPISchemaForAst(schema.ast, componentSchemaCallback);
};
