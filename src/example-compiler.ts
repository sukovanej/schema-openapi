import {
  Context,
  Effect,
  Option,
  ReadonlyArray,
  Ref,
  Unify,
  pipe,
} from 'effect';

import { AST, Parser, Schema } from '@effect/schema';

const getExampleValue = (ast: AST.Annotated) =>
  pipe(
    AST.getAnnotation<AST.ExamplesAnnotation>(AST.ExamplesAnnotationId)(ast),
    Option.getOrUndefined
  );

const getIdentifier = (ast: AST.Annotated) =>
  pipe(
    AST.getAnnotation<AST.IdentifierAnnotation>(AST.IdentifierAnnotationId)(
      ast
    ),
    Option.getOrUndefined
  );

type IntegerCounter = Ref.Ref<number>;
const IntegerCounter = Context.Tag<IntegerCounter>(
  'schema-openapi/example/integer-counter'
);

const nextInteger = Effect.flatMap(
  IntegerCounter,
  Ref.getAndUpdate((n) => n + 1)
);

const randomChoice = <A>(
  xs: readonly A[]
): Effect.Effect<never, RandomExampleError, A> =>
  pipe(
    Effect.randomWith((r) => r.nextIntBetween(0, xs.length)),
    Effect.filterOrFail(
      (i) => i >= 0,
      () => randomExampleError(`Can choose from ${xs}`)
    ),
    Effect.map((i) => xs[i])
  );

export type RandomExampleError = {
  _tag: 'RandomExampleError';
  error: unknown;
};

export const randomExampleError = (error: unknown): RandomExampleError => ({
  _tag: 'RandomExampleError',
  error,
});

export const randomExample = <A>(
  schema: Schema.Schema<any, A>
): Effect.Effect<never, RandomExampleError, A> => {
  const go = (
    ast: AST.AST,
    constraint: TypeConstraint<any> | undefined
  ): Effect.Effect<IntegerCounter, RandomExampleError, any> => {
    const exampleFromAnnotation = getExampleValue(ast);

    if (exampleFromAnnotation) {
      return randomChoice(exampleFromAnnotation);
    }

    switch (ast._tag) {
      case 'Literal': {
        return Effect.succeed(ast.literal);
      }
      case 'UnknownKeyword':
        return Effect.succeed(undefined);
      case 'AnyKeyword':
        return randomChoice([{}, 'hello-world', 69, undefined]);
      case 'StringKeyword':
        return randomChoice(['hello world', 'patrik']);
      case 'NumberKeyword':
        return Effect.map(nextInteger, (number) => {
          if (constraint) {
            return resolveConstrainedNumber(number, constraint);
          }
          return number;
        });
      case 'BooleanKeyword':
        return randomChoice([true, false]);
      case 'ObjectKeyword':
        return randomChoice([{ iam: 'object' }]);
      case 'Tuple': {
        const generate = Effect.forEach((element: AST.AST) =>
          go(element, undefined)
        );

        const elements = generate(ast.elements.map((element) => element.type));

        const postRestElementsAst = pipe(
          Option.flatMap(ast.rest, ReadonlyArray.tail),
          Option.getOrElse(() => [] as AST.AST[])
        );

        const nElements = ast.elements.length + postRestElementsAst.length;

        const rest = pipe(
          Option.flatMap(ast.rest, ReadonlyArray.head),
          Option.map((rest) =>
            Array(
              constraint?.min != null ? constraint.min - nElements : 1
            ).fill(rest)
          ),
          Option.map(generate),
          Option.getOrElse(() => Effect.succeed([] as any[]))
        );

        const postRestElements = generate(postRestElementsAst);

        return Effect.mergeAll(
          [elements, rest, postRestElements],
          [] as any[],
          (a, b) => [...a, ...b]
        );
      }
      case 'TypeLiteral': {
        if (
          ast.indexSignatures.length <
          ast.indexSignatures.filter(
            (is) => is.parameter._tag === 'StringKeyword'
          ).length
        ) {
          return Effect.fail(
            randomExampleError(
              `Cannot create example for some index signatures`
            )
          );
        }

        const result = pipe(
          ast.propertySignatures,
          Effect.reduce({}, (acc, ps) =>
            Effect.map(go(ps.type, constraint), (v) => ({
              ...acc,
              [ps.name]: v,
            }))
          )
        );

        return result;
      }
      case 'Union': {
        return Effect.flatten(
          randomChoice(ast.types.map((ast) => go(ast, constraint)))
        );
      }
      case 'Enums': {
        return randomChoice(ast.enums);
      }
      case 'Refinement': {
        return createConstraintFromRefinement(ast).pipe(
          Effect.flatMap((constraint2) =>
            go(ast.from, { ...constraint, ...constraint2 })
          ),
          Effect.flatMap((a) => {
            const error = ast.filter(a, Parser.defaultParseOption, ast);

            if (Option.isNone(error)) {
              return Effect.succeed(a);
            }

            return Effect.fail(
              randomExampleError(
                `Cannot create an example for refinement ${JSON.stringify(
                  error,
                  (_, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )}`
              )
            );
          })
        );
      }
      case 'Transform':
        return go(ast.to, constraint);
      case 'UniqueSymbol':
        return Effect.fail(randomExampleError(`UniqueSymbol`));
      case 'UndefinedKeyword':
        return Effect.fail(randomExampleError(`UndefinedKeyword`));
      case 'VoidKeyword':
        return Effect.fail(randomExampleError(`VoidKeyword`));
      case 'NeverKeyword': {
        return Effect.fail(randomExampleError(`NeverKeyword`));
      }
      case 'BigIntKeyword': {
        return Effect.map(nextInteger, (number) => {
          if (constraint) {
            return resolveConstrainedBigint(BigInt(number), constraint);
          }
          return BigInt(number);
        });
      }
      case 'SymbolKeyword':
        return Effect.fail(randomExampleError(`SymbolKeyword`));
      case 'Lazy':
        return go(ast.f(), constraint);
      case 'TemplateLiteral': {
        const result = pipe(
          ast.spans,
          Effect.reduce(ast.head, (acc, v) =>
            Effect.map(go(v.type, constraint), (x) => `${acc}${x}${v.literal}`)
          )
        );

        return result;
      }
      case 'Declaration': {
        const identifier = getIdentifier(ast);

        if (identifier === 'Option') {
          return pipe(
            randomChoice([
              () => Effect.succeed(Option.none()),
              () =>
                Effect.map(go(ast.typeParameters[0], constraint), (v) =>
                  Option.some(v)
                ),
            ]),
            Effect.flatMap((fn) => fn())
          );
        }

        return Effect.fail(
          randomExampleError(
            `Can't give an example for declaration: ${JSON.stringify(ast)}`
          )
        );
      }
    }
  };

  return go(schema.ast, undefined).pipe(
    Effect.provideServiceEffect(IntegerCounter, Ref.make(1))
  );
};

const createConstraintFromRefinement = Unify.unify((ast: AST.Refinement) => {
  const typeId = pipe(
    ast,
    AST.getAnnotation<AST.TypeAnnotation>(AST.TypeAnnotationId),
    Option.getOrUndefined
  );

  if (typeId === undefined) {
    const astStr = JSON.stringify(ast);
    const message = `Couldn't create an example for ${astStr}. Specify an example.`;
    return Effect.fail(randomExampleError(message));
  }

  let from = ast.from;
  while (from._tag === 'Refinement') {
    from = from.from;
  }

  let constraint: TypeConstraint | undefined;
  if (from._tag === 'NumberKeyword' || from._tag === 'BigIntKeyword') {
    constraint = createNumberConstraint(typeId, ast);
  } else if (from._tag === 'Tuple') {
    constraint = createTupleConstraint(typeId, ast);
  }

  if (constraint === undefined) {
    const astStr = JSON.stringify(ast);
    const message = `Couldn't create a constraint for ${astStr} Specify an example.`;
    return Effect.fail(randomExampleError(message));
  }

  return Effect.succeed(constraint);
});

const resolveConstrainedBigint = (
  number: bigint,
  constraint: TypeConstraint<bigint>
) => {
  const min =
    constraint.min && constraint.min + BigInt(constraint.minExclusive ? 1 : 0);
  const max =
    constraint.max && constraint.max - BigInt(constraint.maxExclusive ? 1 : 0);

  let result: number | bigint = number;

  if (min && number < min) {
    result = min;
  }
  if (max && number > max) {
    result = max;
  }

  return result;
};

const resolveConstrainedNumber = (
  number: number,
  constraint: TypeConstraint<number>
) => {
  const min =
    constraint.min && constraint.min + (constraint.minExclusive ? 1 : 0);
  const max =
    constraint.max && constraint.max - (constraint.maxExclusive ? 1 : 0);

  let result: number | bigint = number;

  if (min && number < min) {
    result = min;
  }
  if (max && number > max) {
    result = max;
  }
  if (constraint.integer && !Number.isInteger(number)) {
    result = Math.ceil(result);
  }

  return result;
};

const createNumberConstraint = (
  typeId: AST.TypeAnnotation,
  ast: AST.AST
): TypeConstraint | undefined => {
  const jsonSchema: any = ast.annotations[AST.JSONSchemaAnnotationId];

  if (typeId === Schema.IntTypeId) {
    return TypeConstraint({ integer: true });
  } else if (typeId === Schema.BetweenTypeId) {
    const [min, max] = [jsonSchema.minimum, jsonSchema.maximum];
    return TypeConstraint({ min, max });
  } else if (typeId === Schema.GreaterThanTypeId) {
    const min = jsonSchema.exclusiveMinimum;
    return TypeConstraint({ min, minExclusive: true });
  } else if (typeId === Schema.GreaterThanBigintTypeId) {
    const { min }: any = ast.annotations[typeId];
    return TypeConstraint({ min, minExclusive: true });
  } else if (typeId === Schema.GreaterThanOrEqualToTypeId) {
    const min = jsonSchema.minimum;
    return TypeConstraint({ min });
  } else if (typeId === Schema.GreaterThanOrEqualToBigintTypeId) {
    const { min }: any = ast.annotations[typeId];
    return TypeConstraint({ min });
  } else if (typeId === Schema.LessThanTypeId) {
    const max = jsonSchema.exclusiveMaximum;
    return TypeConstraint({ max, maxExclusive: true });
  } else if (typeId === Schema.LessThanBigintTypeId) {
    const { max }: any = ast.annotations[typeId];
    return TypeConstraint({ max, maxExclusive: true });
  } else if (typeId === Schema.LessThanOrEqualToTypeId) {
    const max = jsonSchema.maximum;
    return TypeConstraint({ max });
  } else if (typeId === Schema.LessThanOrEqualToBigintTypeId) {
    const { max }: any = ast.annotations[typeId];
    return TypeConstraint({ max });
  }
};

const createTupleConstraint = (
  typeId: AST.TypeAnnotation,
  ast: AST.AST
): TypeConstraint | undefined => {
  const jsonSchema: any = ast.annotations[AST.JSONSchemaAnnotationId];

  if (typeId === Schema.MinItemsTypeId) {
    const min = jsonSchema.minItems;
    return TypeConstraint({ min });
  } else if (typeId === Schema.MaxItemsTypeId) {
    const max = jsonSchema.maxItems;
    return TypeConstraint({ max });
  } else if (typeId === Schema.ItemsCountTypeId) {
    const min = jsonSchema.minItems;
    const max = jsonSchema.maxItems;
    return TypeConstraint({ min, max });
  }
};

type TypeConstraint<T = any> = {
  min?: T;
  minExclusive?: boolean;
  max?: T;
  maxExclusive?: boolean;
  integer?: boolean;
};

const TypeConstraint = <T>(values: TypeConstraint<T>): TypeConstraint<T> => ({
  ...values,
});
