# Project Setup Skill

## Description
Initialize and configure TypeScript monorepos with pnpm workspaces, Turbo build orchestration, Biome formatting/linting, Vitest testing, and CI/CD infrastructure. This skill handles all the boilerplate setup needed for enterprise-grade TypeScript monorepos.

## Capabilities
- Initialize pnpm workspaces with proper configuration
- Configure TypeScript with strict mode
- Set up build tools (tsup) per package
- Configure Biome for linting and formatting
- Set up formatting with Biome
- Configure Vitest with coverage thresholds
- Set up Turbo for monorepo build orchestration
- Create GitHub Actions CI/CD pipelines
- Configure EditorConfig for consistent formatting
- Set up Changesets for versioning and changelogs

## Invocation
```yaml
skill: project-setup
action: initialize
parameters:
  name: "@reaatech/llm-judge-toolkit"
  packageManager: pnpm
  license: MIT
  nodeVersion: "20"
  strict: true
```

### Full Enterprise Setup
```yaml
skill: project-setup
action: initialize
parameters:
  name: "@reaatech/llm-judge-toolkit"
  description: "Calibrated LLM-as-judge library"
  packageManager: pnpm
  license: MIT
  nodeVersion: "20"
  strict: true
  features:
    - typescript
    - biome
    - vitest
    - turbo
    - changesets
    - github-actions
```

### Add Specific Tooling
```yaml
skill: project-setup
action: add-tooling
parameters:
  tools:
    - name: vitest
      coverage: 90
    - name: biome
      config: recommended
```

## Generated Files

### Root package.json (monorepo)
```json
{
  "name": "llm-judge-monorepo",
  "private": true,
  "license": "MIT",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "test:coverage": "turbo run test:coverage",
    "typecheck": "turbo run typecheck",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "turbo run build && changeset publish"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@changesets/cli": "^2.28.1",
    "turbo": "^2.5.0",
    "typescript": "^5.8.3"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### Per-package package.json (e.g. packages/types/package.json)
```json
{
  "name": "@reaatech/llm-judge-types",
  "version": "0.1.0",
  "private": false,
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^25.6.0",
    "@vitest/coverage-v8": "^3.2.4",
    "tsup": "^8.0.1",
    "typescript": "^5.8.3",
    "vitest": "^3.1.1"
  }
}
```

### Root tsconfig.json (shared base for all packages)
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
    "noUncheckedIndexedAccess": true
  },
  "exclude": ["node_modules", "dist"]
}
```

### Per-package tsconfig.json (e.g. packages/types/tsconfig.json)
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Per-package tsup.config.ts
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
});
```

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';

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
          version: 9
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint & Format
        run: pnpm lint
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Test
        run: pnpm test
      
      - name: Build
        run: pnpm build
```

### pnpm-workspace.yaml
```yaml
packages:
  - "packages/*"
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "test:coverage": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Constraints
- Requires Node.js 20+ for latest features
- pnpm version 8+ required
- Internet connection needed for package installation
- GitHub account required for CI/CD setup

## Best Practices
1. Always use strict TypeScript configuration
2. Set coverage thresholds to at least 90%
3. Use Changesets for changelog generation and versioning
4. Run Biome lint + format check in CI
5. Use `workspace:*` protocol for inter-package dependencies
6. Build packages in dependency order with Turbo (`"^build"` dependsOn)

## Related Skills
- `type-design` - For creating TypeScript types after project setup
- `ci-cd-pipeline` - For advanced CI/CD configurations
- `test-generation` - For generating test suites
