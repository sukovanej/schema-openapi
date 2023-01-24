export type Setter<T> = (a: T) => T;

export const runSetters = <A>(a: A, setters: Setter<A>[]) => {
  for (const setter of setters) {
    a = setter(a);
  }
  return a;
};
