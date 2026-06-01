import { defineConfig } from 'vitest/config';

// Self-contained config so vitest does not walk up to the repo-root config
// (which targets the LumenSyntax_Core packages, not this landing sub-project).
export default defineConfig({
  test: {
    include: ['test/**/*.test.mjs'],
  },
});
