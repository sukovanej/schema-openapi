import { pipe } from '@effect/data/Function';
import * as O from '@effect/data/Option';
import * as RA from '@effect/data/ReadonlyArray';
import * as AST from '@effect/schema/AST';
import * as S from '@effect/schema/Schema';

const getExampleValue = (ast: AST.Annotated) =>
  pipe(
    AST.getAnnotation<AST.ExamplesAnnotation>(AST.ExamplesAnnotationId)(ast),
    O.getOrUndefined
  );

const randomChoice = <A>(xs: readonly A[]): O.Option<A> => {
  const randomIndex = Math.round(Math.random() * (xs.length - 1));

  if (randomIndex < 0) {
    return O.none();
  }

  return O.some(xs[randomIndex]);
};

export const randomExample = <A>(schema: S.Schema<any, A>): O.Option<A> => {
  const go = (ast: AST.AST): O.Option<any> => {
    const exampleFromAnnotation = getExampleValue(ast);

    if (exampleFromAnnotation) {
      return O.some(exampleFromAnnotation);
    }

    switch (ast._tag) {
      case 'Literal': {
        return O.some(ast.literal);
      }
      case 'UnknownKeyword':
        return O.some(undefined);
      case 'AnyKeyword':
        return randomChoice([{}, 'hello-world', 69, undefined]);
      case 'StringKeyword':
        return randomChoice(['string', 'patrik']);
      case 'NumberKeyword':
        return randomChoice([69, 420, 3.14]);
      case 'BooleanKeyword':
        return randomChoice([true, false]);
      case 'ObjectKeyword':
        return randomChoice([{ iam: 'object' }]);
      case 'Tuple': {
        const rest = pipe(
          O.flatMap(ast.rest, RA.traverse(O.Applicative)(go)),
          O.orElse(() => O.some([]))
        );

        const elements = pipe(
          ast.elements.values(),
          RA.traverse(O.Applicative)((element) => go(element.type))
        );

        return O.flatMap(rest, (rest) =>
          O.map(elements, (elements) => [...elements, ...rest])
        );
      }
      case 'TypeLiteral': {
        if (
          ast.indexSignatures.length <
          ast.indexSignatures.filter(
            (is) => is.parameter._tag === 'StringKeyword'
          ).length
        ) {
          throw new Error(`Cannot create example for some index signatures`);
        }

        const result = ast.propertySignatures.reduce(
          (acc, ps) =>
            pipe(
              acc,
              O.flatMap((acc) =>
                pipe(
                  go(ps.type),
                  O.map((v) => ({ ...acc, [ps.name]: v }))
                )
              )
            ),
          O.some({})
        );

        return result;
      }
      case 'Union': {
        return O.flatten(randomChoice(ast.types.map(go)));
      }
      case 'Enums': {
        return randomChoice(ast.enums);
      }
      case 'Refinement': {
        return O.none(); // TODO
      }
      case 'Transform':
        return go(ast.to);
      case 'UniqueSymbol':
        return O.none();
      case 'UndefinedKeyword':
        return O.some(undefined);
      case 'VoidKeyword':
        return O.none();
      case 'NeverKeyword': {
        return O.none();
      }
      case 'BigIntKeyword': {
        return randomChoice([BigInt(69), BigInt(420), BigInt(3.14)]);
      }
      case 'SymbolKeyword':
        return O.none();
      case 'Lazy':
        return go(ast.f());
      case 'TemplateLiteral': {
        const result = ast.spans.reduce(
          (acc, v) =>
            O.flatMap(acc, (acc) =>
              O.map(go(v.type), (x) => `${acc}${x}${v.literal}`)
            ),
          O.some(ast.head)
        );

        return result;
      }
    }
    throw new Error(`TODO: unhandled ${JSON.stringify(ast)}`);
  };

  return go(schema.ast);
};
