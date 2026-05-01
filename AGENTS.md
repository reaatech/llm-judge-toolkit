# LLM Judge Toolkit — Agent Skills

This document defines the agent skills system for developing the LLM Judge Toolkit. Each skill represents a specialized capability that AI agents can use to assist with specific aspects of the project.

This project is a **pnpm monorepo** containing 10 packages under the `@reaatech/llm-judge-*` scope. Tooling: **Biome** for lint & format, **turbo** for task orchestration, **tsup** for builds, **changesets** for versioning, and **vitest** for tests.

## Available Agent Skills

| Skill | Description | Target Package | Location |
|-------|-------------|---------------|----------|
| `type-design` | Design Zod schemas and TypeScript interfaces | [`@reaatech/llm-judge-types`](packages/types) | [`skills/type-design/skills.md`](skills/type-design/skills.md) |
| `provider-integration` | Implement LLM provider wrappers (OpenAI, Anthropic, local) | [`@reaatech/llm-judge-providers`](packages/providers) | [`skills/provider-integration/skills.md`](skills/provider-integration/skills.md) |
| `prompt-engineering` | Create and optimize evaluation prompt templates | [`@reaatech/llm-judge-templates`](packages/templates) | [`skills/prompt-engineering/skills.md`](skills/prompt-engineering/skills.md) |
| `test-generation` | Generate comprehensive test suites with Vitest | (cross-cutting) | [`skills/test-generation/skills.md`](skills/test-generation/skills.md) |
| `calibration-analysis` | Statistical calibration analysis (Cohen's kappa, ECE, etc.) | [`@reaatech/llm-judge-calibration`](packages/calibration) | [`skills/calibration-analysis/skills.md`](skills/calibration-analysis/skills.md) |
| `bias-detection` | Detect and mitigate position, verbosity, and order biases | [`@reaatech/llm-judge-bias`](packages/bias) | [`skills/bias-detection/skills.md`](skills/bias-detection/skills.md) |
| `cost-optimization` | Track and optimize LLM API costs | [`@reaatech/llm-judge-infra`](packages/infra) | [`skills/cost-optimization/skills.md`](skills/cost-optimization/skills.md) |
| `cache-implementation` | Multi-backend caching strategies (memory, filesystem, Redis) | [`@reaatech/llm-judge-cache`](packages/cache) | [`skills/cache-implementation/skills.md`](skills/cache-implementation/skills.md) |
| `ci-cd-pipeline` | GitHub Actions CI/CD with changesets and turbo | (cross-cutting) | [`skills/ci-cd-pipeline/skills.md`](skills/ci-cd-pipeline/skills.md) |
| `documentation` | Technical docs, READMEs, API docs, and examples | (cross-cutting) | [`skills/documentation/skills.md`](skills/documentation/skills.md) |
| `security-review` | Security review and safeguards (API keys, prompt injection) | (cross-cutting) | [`skills/security-review/skills.md`](skills/security-review/skills.md) |
| `project-setup` | Initialize monorepo packages and workspace configuration | (cross-cutting) | [`skills/project-setup/skills.md`](skills/project-setup/skills.md) |

## Package Dependency Order

Build and work on packages in this order to respect internal dependency chains:

| Order | Package | Depends On (internal) | Key Skill |
|-------|---------|----------------------|-----------|
| 1 | [`@reaatech/llm-judge-types`](packages/types) | (none) | `type-design` |
| 2 | [`@reaatech/llm-judge-templates`](packages/templates) | types | `prompt-engineering` |
| 3 | [`@reaatech/llm-judge-providers`](packages/providers) | types | `provider-integration` |
| 4 | [`@reaatech/llm-judge-consensus`](packages/consensus) | types | `type-design` |
| 5 | [`@reaatech/llm-judge-cache`](packages/cache) | types, templates | `cache-implementation` |
| 6 | [`@reaatech/llm-judge-engine`](packages/engine) | types, templates, cache | `prompt-engineering` |
| 7 | [`@reaatech/llm-judge-infra`](packages/infra) | types, engine, templates | `cost-optimization` |
| 8 | [`@reaatech/llm-judge-bias`](packages/bias) | types, engine, templates | `bias-detection` |
| 9 | [`@reaatech/llm-judge-calibration`](packages/calibration) | types, engine, infra | `calibration-analysis` |
| 10 | [`@reaatech/llm-judge-cli`](packages/cli) | providers, engine, calibration, cache, infra | `project-setup` |

Run `pnpm build` (or `turbo run build`) to build all packages in correct dependency order.

## Using Agent Skills

Skills can be consumed programmatically by reading the skill definition files and executing the described patterns. Each skill target package lives under `packages/<name>/` and follows the monorepo conventions (tsup build, Biome lint, vitest tests).

```typescript
import { readFileSync } from 'fs';

// Load skill instructions at runtime
const typeDesignSkill = readFileSync('./skills/type-design/skills.md', 'utf-8');
const calibSkill = readFileSync('./skills/calibration-analysis/skills.md', 'utf-8');

// Feed skill context to your agent framework
await agent.execute({
  context: [typeDesignSkill, calibSkill],
  task: 'Add a JudgmentPair type for calibration with human labels',
  targetPackage: '@reaatech/llm-judge-calibration',
});
```

When working on a package, reference its skill to follow conventions for that domain. Cross-cutting skills (`test-generation`, `documentation`, etc.) apply to all packages.

## Skill Invocation Format

Each skill follows a consistent invocation format:

```yaml
skill: <skill-name>
action: <action-to-perform>
targetPackage: <package-name>
context:
  - <relevant-context-1>
  - <relevant-context-2>
parameters:
  key: value
```

### Example Invocations

```yaml
# Type Design — add schema to types package
skill: type-design
action: create-schema
targetPackage: "@reaatech/llm-judge-types"
parameters:
  typeName: Judgment
  validation: zod

# Provider Integration — implement OpenAI provider
skill: provider-integration
action: implement-provider
targetPackage: "@reaatech/llm-judge-providers"
parameters:
  provider: openai
  features: [chat, embeddings]

# Cache Implementation — add Redis backend
skill: cache-implementation
action: add-backend
targetPackage: "@reaatech/llm-judge-cache"
parameters:
  backend: redis
  ttl: 3600
```

## Skill Composition

Skills can be composed for complex workflows spanning multiple packages:

```yaml
# Build a calibrated multi-judge pipeline end-to-end
workflow: calibrated-judgment-pipeline
steps:
  - skill: type-design
    action: create-types
    targetPackage: "@reaatech/llm-judge-types"
    parameters:
      types: [Judgment, JudgmentPair, CalibrationReport]

  - skill: provider-integration
    action: setup-provider
    targetPackage: "@reaatech/llm-judge-providers"
    parameters:
      provider: openai

  - skill: prompt-engineering
    action: create-template
    targetPackage: "@reaatech/llm-judge-templates"
    parameters:
      criteria: faithfulness

  - skill: cache-implementation
    action: configure-cache
    targetPackage: "@reaatech/llm-judge-cache"
    parameters:
      strategy: prompt-hash

  - skill: bias-detection
    action: analyze-position-bias
    targetPackage: "@reaatech/llm-judge-bias"
    parameters:
      metric: position_swap_accuracy

  - skill: calibration-analysis
    action: compute-kappa
    targetPackage: "@reaatech/llm-judge-calibration"
    parameters:
      metric: cohens_kappa

  - skill: test-generation
    action: generate-tests
    targetPackage: "@reaatech/llm-judge-engine"
    parameters:
      coverage: 90
```

## Contributing New Skills

To add a new agent skill in this monorepo:

1. Create the skill directory: `skills/<skill-name>/`
2. Create `skills/<skill-name>/skills.md` with the skill definition
3. If the skill targets a new package, scaffold it under `packages/<name>/` using the monorepo conventions:
   - `package.json` with `@reaatech/llm-judge-<name>` as the name
   - `tsup` for builds, `vitest` for tests
   - `biome.json` extending the root config
4. Add the skill entry to the Available Agent Skills table above
5. Add the package to the Package Dependency Order table if applicable
6. Include invocation examples with `targetPackage` set

### Skill Template

```markdown
# <Skill Name>

## Description
<Brief description of what this skill does>

## Target Package
`@reaatech/llm-judge-<name>` (or cross-cutting)

## Capabilities
- Capability 1
- Capability 2
- Capability 3

## Invocation
\`\`\`yaml
skill: <skill-name>
action: <action>
targetPackage: "@reaatech/llm-judge-<name>"
parameters:
  key: value
\`\`\`

## Examples
<Examples of skill usage>

## Constraints
- Constraint 1
- Constraint 2
```

## Monorepo Tooling Quick Reference

| Tool | Purpose | Config |
|------|---------|--------|
| **pnpm** | Package manager & workspace orchestration | [`pnpm-workspace.yaml`](pnpm-workspace.yaml) |
| **turbo** | Task orchestration (build, test, lint, typecheck) | [`turbo.json`](turbo.json) |
| **Biome** | Linting & formatting (no ESLint/Prettier) | [`biome.json`](biome.json) |
| **tsup** | Package builds (CJS + ESM + .d.ts) | per-package `tsup.config.ts` |
| **vitest** | Test runner | `vitest.config.ts` (root or per-package) |
| **changesets** | Semantic versioning & changelog generation | [`.changeset/`](.changeset/) |

Common commands:

```bash
pnpm build              # turbo run build — all packages in dependency order
pnpm test               # turbo run test — all packages
pnpm lint               # biome check .
pnpm lint:fix           # biome check --write .
pnpm format             # biome format --write .
pnpm typecheck          # tsc --noEmit across all packages
pnpm changeset          # create a changeset for versioning
```

## GitHub Integration

This project lives at [`reaatech/llm-judge-toolkit`](https://github.com/reaatech/llm-judge-toolkit). Agent skills can interact with GitHub:

```yaml
# Create a PR using agent skills
skill: ci-cd-pipeline
action: create-pr
parameters:
  title: "feat(bias): add position bias detection"
  base: main
  labels: [enhancement, bias]
  reviewers: [reaatech]
```

## Related Repositories

These agent skills are designed to be compatible with:
- [classifier-evals](https://github.com/reaatech/classifier-evals)
- [agent-eval-harness](https://github.com/reaatech/agent-eval-harness)

Skills can be shared across these repositories for consistency.

---

*For detailed skill definitions, see the individual skill documentation in the `skills/` directory.*
