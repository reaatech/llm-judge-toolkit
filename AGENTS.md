# LLM Judge Toolkit — Agent Skills

This document defines the agent skills system for developing the LLM Judge Toolkit. Each skill represents a specialized capability that AI agents can use to assist with specific aspects of the project.

## Available Agent Skills

| Skill | Description | Location |
|-------|-------------|----------|
| `project-setup` | Initialize and configure TypeScript projects with pnpm | [`skills/project-setup/skills.md`](skills/project-setup/skills.md) |
| `type-design` | Design and implement TypeScript type systems with Zod validation | [`skills/type-design/skills.md`](skills/type-design/skills.md) |
| `provider-integration` | Integrate LLM providers (OpenAI, Anthropic, Azure, local) | [`skills/provider-integration/skills.md`](skills/provider-integration/skills.md) |
| `prompt-engineering` | Create and optimize prompt templates for evaluation criteria | [`skills/prompt-engineering/skills.md`](skills/prompt-engineering/skills.md) |
| `test-generation` | Generate comprehensive test suites with Vitest | [`skills/test-generation/skills.md`](skills/test-generation/skills.md) |
| `calibration-analysis` | Perform statistical calibration analysis (Cohen's kappa, etc.) | [`skills/calibration-analysis/skills.md`](skills/calibration-analysis/skills.md) |
| `bias-detection` | Implement bias detection and mitigation strategies | [`skills/bias-detection/skills.md`](skills/bias-detection/skills.md) |
| `cost-optimization` | Track and optimize LLM API costs | [`skills/cost-optimization/skills.md`](skills/cost-optimization/skills.md) |
| `cache-implementation` | Implement multi-backend caching strategies | [`skills/cache-implementation/skills.md`](skills/cache-implementation/skills.md) |
| `ci-cd-pipeline` | Set up GitHub Actions CI/CD pipelines | [`skills/ci-cd-pipeline/skills.md`](skills/ci-cd-pipeline/skills.md) |
| `documentation` | Generate technical documentation and examples | [`skills/documentation/skills.md`](skills/documentation/skills.md) |
| `security-review` | Perform security reviews and implement safeguards | [`skills/security-review/skills.md`](skills/security-review/skills.md) |

## Skill-to-Phase Mapping

Use this table to identify which skills to invoke during each development phase:

| DEV_PLAN Phase | Primary Skills | Supporting Skills |
|----------------|---------------|-------------------|
| Phase 1: Foundation | `project-setup`, `type-design` | `ci-cd-pipeline`, `test-generation` |
| Phase 2: Templates & Engine | `prompt-engineering`, `type-design` | `test-generation`, `provider-integration` |
| Phase 3: Consensus | `type-design`, `cost-optimization` | `test-generation`, `provider-integration` |
| Phase 4: Calibration | `calibration-analysis`, `type-design` | `test-generation`, `documentation` |
| Phase 5: Bias Detection | `bias-detection`, `type-design` | `test-generation`, `documentation` |
| Phase 6: Caching | `cache-implementation`, `type-design` | `test-generation`, `cost-optimization` |
| Phase 7: Advanced Features | `provider-integration`, `type-design` | `test-generation`, `documentation` |
| Phase 8: Testing | `test-generation`, `security-review` | `ci-cd-pipeline` |
| Phase 9: Documentation | `documentation`, `type-design` | `security-review` |
| Phase 10: Production | `security-review`, `ci-cd-pipeline` | `cost-optimization`, `cache-implementation` |
| Phase 11: Release | `ci-cd-pipeline`, `documentation` | `security-review` |

## Using Agent Skills

### Via GitHub Copilot

```typescript
// In your IDE, use comments to invoke specific skills:
// @skill: type-design - Create a Zod schema for Judgment type

// Or reference the skill directly:
// See: skills/type-design/skills.md for type design patterns
```

### Via Claude Code

Reference skills naturally in conversation or via the project-specific skill system:

```bash
# Reference a skill file directly when prompting
@skills/project-setup/skills.md Initialize the project structure

# Or reference in natural language
"Use the project-setup skill to initialize the project structure"
```

### Via Custom Agent Integration

Skills can be consumed programmatically by reading the skill definitions and executing the described patterns:

```typescript
import { readFileSync } from 'fs';

// Load skill instructions at runtime
const projectSetupSkill = readFileSync('./skills/project-setup/skills.md', 'utf-8');
const typeDesignSkill = readFileSync('./skills/type-design/skills.md', 'utf-8');

// Feed skill context to your agent framework
await agent.execute({
  context: [projectSetupSkill, typeDesignSkill],
  task: 'Create the core type definitions'
});
```

## Skill Invocation Format

Each skill follows a consistent invocation format:

```yaml
skill: <skill-name>
action: <action-to-perform>
context:
  - <relevant-context-1>
  - <relevant-context-2>
parameters:
  key: value
```

### Example Invocations

```yaml
# Project Setup
skill: project-setup
action: initialize
parameters:
  name: llm-judge-toolkit
  packageManager: pnpm
  license: MIT

# Type Design
skill: type-design
action: create-schema
parameters:
  typeName: Judgment
  validation: zod

# Provider Integration
skill: provider-integration
action: implement-provider
parameters:
  provider: openai
  features: [chat, embeddings]
```

## Skill Composition

Skills can be composed for complex workflows:

```yaml
# Complete feature implementation
workflow: implement-judgment-engine
steps:
  - skill: type-design
    action: create-types
    parameters:
      types: [Judgment, JudgmentConfig]
  
  - skill: provider-integration
    action: setup-provider
    parameters:
      provider: openai
  
  - skill: prompt-engineering
    action: create-template
    parameters:
      criteria: faithfulness
  
  - skill: test-generation
    action: generate-tests
    parameters:
      target: JudgmentEngine
      coverage: 90
```

## Contributing New Skills

To add a new agent skill:

1. Create directory: `skills/<skill-name>/`
2. Create `skills.md` with skill definition
3. Add entry to this AGENTS.md table
4. Include examples and invocation patterns

### Skill Template

```markdown
# <Skill Name>

## Description
<Brief description of what this skill does>

## Capabilities
- Capability 1
- Capability 2
- Capability 3

## Invocation
\`\`\`yaml
skill: <skill-name>
action: <action>
parameters:
  key: value
\`\`\`

## Examples
<Examples of skill usage>

## Constraints
- Constraint 1
- Constraint 2
```

## GitHub Integration

This project uses GitHub user `reaatech`. Agent skills can interact with GitHub:

```yaml
# Create a PR using agent skills
skill: ci-cd-pipeline
action: create-pr
parameters:
  title: "Implement Judgment Engine"
  base: main
  labels: [enhancement, core]
  reviewers: [reaatech]
```

## Related Repositories

These agent skills are designed to be compatible with:
- [classifier-evals](https://github.com/reaatech/classifier-evals)
- [agent-eval-harness](https://github.com/reaatech/agent-eval-harness)

Skills can be shared across these repositories for consistency.

---

*For detailed skill definitions, see the individual skill documentation in the `skills/` directory.*
