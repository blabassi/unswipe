import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test/**', 'src/types.ts'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 88,
        functions: 88,
        branches: 70,
        statements: 88,
      },
    },
  },
});
