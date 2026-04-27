# Project Setup Skill

## Description
Initialize and configure TypeScript projects with pnpm, including build systems, linting, testing, and CI/CD infrastructure. This skill handles all the boilerplate setup needed for enterprise-grade TypeScript projects.

## Capabilities
- Initialize pnpm workspaces with proper configuration
- Configure TypeScript with strict mode and path aliases
- Set up build tools (tsup, esbuild, or rollup)
- Configure ESLint with TypeScript support
- Set up Prettier for code formatting
- Configure Vitest with coverage thresholds
- Set up Husky pre-commit hooks with lint-staged
- Create GitHub Actions CI/CD pipelines
- Configure EditorConfig for consistent formatting
- Set up conventional commits with commitlint

## Invocation
```yaml
skill: project-setup
action: initialize
parameters:
  name: llm-judge-toolkit
  packageManager: pnpm
  license: MIT
  nodeVersion: "20"
  strict: true
```

## Examples

### Basic Project Initialization
```yaml
skill: project-setup
action: initialize
parameters:
  name: my-typescript-library
  packageManager: pnpm
  license: MIT
```

### Full Enterprise Setup
```yaml
skill: project-setup
action: initialize
parameters:
  name: llm-judge-toolkit
  description: "Calibrated LLM-as-judge library"
  packageManager: pnpm
  license: MIT
  nodeVersion: "20"
  strict: true
  features:
    - typescript
    - eslint
    - prettier
    - vitest
    - husky
    - github-actions
    - conventional-commits
```

### Add Specific Tooling
```yaml
skill: project-setup
action: add-tooling
parameters:
  tools:
    - name: vitest
      coverage: 90
    - name: eslint
      config: typescript
    - name: husky
      hooks: [pre-commit, commit-msg]
```

## Generated Files

### package.json
```json
{
  "name": "llm-judge-toolkit",
  "version": "0.1.0",
  "private": false,
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "src"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write src/",
    "format:check": "prettier --check src/",
    "typecheck": "tsc --noEmit",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.55.0",
    "eslint-config-prettier": "^9.1.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "prettier": "^3.1.0",
    "tsup": "^8.0.1",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### tsup.config.ts
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['dotenv'],
  injectStyle: false,
});
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 22.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Lint
        run: pnpm lint
      
      - name: Format check
        run: pnpm format:check
      
      - name: Test
        run: pnpm test:coverage
      
      - name: Build
        run: pnpm build
```

## Constraints
- Requires Node.js 20+ for latest features
- pnpm version 8+ required
- Internet connection needed for package installation
- GitHub account required for CI/CD setup
- Some features may require additional configuration for monorepos

## Best Practices
1. Always use strict TypeScript configuration
2. Set coverage thresholds to at least 90%
3. Use conventional commits for changelog generation
4. Configure pre-commit hooks to run lint and type check
5. Use path aliases for cleaner imports
6. Generate both CJS and ESM outputs for maximum compatibility

## Related Skills
- `type-design` - For creating TypeScript types after project setup
- `ci-cd-pipeline` - For advanced CI/CD configurations
- `test-generation` - For generating test suites
