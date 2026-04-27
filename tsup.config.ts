import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
  },
  {
    entry: ['src/cli/cli.ts'],
    outDir: 'dist/cli',
    format: ['esm'],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: false,
    treeshake: false,
    minify: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
