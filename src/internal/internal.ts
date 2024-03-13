import * as AST from "@effect/schema/AST"

export type ComponentSchemaCallback =
  | ((id: string, ast: AST.AST) => void)
  | undefined

export type Setter<T> = <A extends T>(
  a: A,
  componentSchemaCallback: ComponentSchemaCallback
) => A

export const runSetters = <A>(
  a: A,
  setters: Array<Setter<A>>,
  componentSchemaCallback: ComponentSchemaCallback = undefined
) => {
  for (const setter of setters) {
    a = setter(a, componentSchemaCallback)
  }
  return a
}

export const removeAnnotation = (key: symbol) => (ast: AST.AST & AST.Annotated): AST.AST => {
  if (Object.prototype.hasOwnProperty.call(ast.annotations, key)) {
    // copied from the implementation of AST.annotations
    const { [key]: _, ...annotations } = ast.annotations
    const d = Object.getOwnPropertyDescriptors(ast)
    d.annotations.value = annotations
    return Object.create(Object.getPrototypeOf(ast), d)
  }
  return ast
}

export const removeIdentifierAnnotation = removeAnnotation(
  AST.IdentifierAnnotationId
)
