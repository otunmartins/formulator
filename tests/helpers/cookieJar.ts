/** A minimal stand-in for next/headers `cookies()` in unit tests. */
export function createCookieJar() {
  const values = new Map<string, string>();
  return {
    values,
    store: {
      get: (name: string) => {
        const value = values.get(name);
        return value === undefined ? undefined : { name, value };
      },
      set: (name: string, value: string) => {
        values.set(name, value);
      },
      delete: (name: string) => {
        values.delete(name);
      },
    },
  };
}
