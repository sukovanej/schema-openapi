import path from "path";
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'c8',
      reporter: ['cobertura', 'text'],
      all: true,
      include: ['src'],
    },
  },
  resolve: {
    alias: {
      "schema-openapi": path.resolve(__dirname, "/src"),
    },
  },
});
