export type Setter<T> = <A extends T>(a: A) => A;

export const runSetters = <A>(a: A, setters: Setter<A>[]) => {
  for (const setter of setters) {
    a = setter(a);
  }
  return a;
};
