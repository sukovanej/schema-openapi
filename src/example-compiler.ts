import { flow, pipe } from '@effect/data/Function';
import * as O from '@effect/data/Option';
import * as RA from '@effect/data/ReadonlyArray';
import * as AST from '@effect/schema/AST';
import * as S from '@effect/schema/Schema';

const getExampleValue = (ast: AST.Annotated) =>
  pipe(
    AST.getAnnotation<AST.ExamplesAnnotation>(AST.ExamplesAnnotationId)(ast),
    O.getOrUndefined
  );

const randomIntBetween = (min: number, max: number) =>
  Math.floor(min + max * Math.random());

const randomChoice = <A>(as: readonly A[]): A => {
  const index = randomIntBetween(0, as.length - 1);

  if (index < 0 || index >= as.length) {
    throw new Error('Cannot choose an element');
  }

  return as[index];
};

const randomBool = () => Math.random() > 0.5;

export const examples = <A>(schema: S.Schema<any, A>): A[] => {
  const go = (ast: AST.AST): any => {
    const exampleFromAnnotation = getExampleValue(ast);

    if (exampleFromAnnotation) {
      return exampleFromAnnotation;
    }

    switch (ast._tag) {
      case 'Literal': {
        return [ast.literal];
      }
      case 'UnknownKeyword':
        return undefined;
      case 'AnyKeyword':
        return {};
      case 'StringKeyword':
        return ['string', 'patrik'];
      case 'NumberKeyword':
        return [69, 420, 3.14];
      case 'BooleanKeyword':
        return [true, false];
      case 'ObjectKeyword':
        return { iam: 'object' };
      case 'Tuple': {
        let elements = ast.elements.map((e) => randomChoice(go(e.type)));
        const rest = pipe(
          ast.rest,
          O.map(RA.mapNonEmpty(flow(go, randomChoice)))
        );
        if (O.isSome(rest)) {
          elements = elements.concat(rest.value);
        }
        return [elements];
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

        const object = ast.propertySignatures.reduce(
          (acc, ps) => ({ ...acc, [ps.name]: randomChoice(go(ps.type)) }),
          {}
        );

        return [object];
      }
      case 'Union': {
        return go(randomChoice(ast.types));
      }
      case 'Enums': {
        return randomChoice(ast.enums)[1];
      }
      case 'Refinement': {
        return go(ast.from);
      }
      case 'Transform':
        return go(ast.to);
      case 'UniqueSymbol':
        return [];
      case 'UndefinedKeyword':
        return undefined;
      case 'VoidKeyword':
        return [];
      case 'NeverKeyword': {
        return [];
      }
      case 'BigIntKeyword': {
        return [BigInt(69), BigInt(420), BigInt(3.14)];
      }
      case 'SymbolKeyword':
        return [];
      case 'Lazy':
        return go(ast.f());
    }
    throw new Error(`TODO: unhandled ${JSON.stringify(ast)}`);
  };

  return go(schema.ast);
};
