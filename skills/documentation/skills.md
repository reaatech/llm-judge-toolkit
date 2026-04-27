# Documentation Skill

## Description
Generate technical documentation and examples for the LLM Judge Toolkit. This skill creates comprehensive API documentation, user guides, and code examples.

## Capabilities
- Generate API reference documentation with TypeDoc
- Create user guides and tutorials
- Write code examples and snippets
- Generate architecture diagrams
- Create quickstart guides
- Document configuration options
- Write migration guides
- Generate README files

## Invocation
```yaml
skill: documentation
action: generate-api-docs
parameters:
  source: src
  output: docs/api
  format: markdown
  includeExamples: true
```

## Examples

### Generate Complete Documentation
```yaml
skill: documentation
action: generate-docs
parameters:
  types:
    - api-reference
    - user-guide
    - examples
    - architecture
  output: docs
  format: markdown
```

### Create Quickstart Guide
```yaml
skill: documentation
action: create-quickstart
parameters:
  audience: developers
  prerequisites:
    - node-20
    - pnpm
  examples:
    - basic-judgment
    - multi-judge-consensus
    - calibration
```

## Generated Code Examples

### TypeDoc Configuration
```typescript
// typedoc.json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "name": "LLM Judge Toolkit",
  "includeVersion": true,
  "readme": "README.md",
  "plugin": ["typedoc-plugin-markdown"],
  "theme": "default",
  "excludePrivate": true,
  "excludeProtected": false,
  "categorizeByGroup": true,
  "categoryOrder": ["Classes", "Interfaces", "Types", "*"],
  "sort": ["alphabetical"],
  "visibilityFilters": {
    "protected": false,
    "private": false,
    "inherited": true,
    "external": false
  }
}
```

### README Template
```markdown
# LLM Judge Toolkit

> Calibrated LLM-as-judge library for reliable, bias-aware, and cost-efficient automated evaluation.

## Installation

```bash
npm install llm-judge-toolkit
# or
pnpm add llm-judge-toolkit
```

## Quick Start

```typescript
import { JudgmentEngine, EvaluationCriteria, OpenAIProvider } from 'llm-judge-toolkit';

// Initialize provider
const provider = new OpenAIProvider({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Create judge
const judge = new JudgmentEngine({
  provider,
  criteria: EvaluationCriteria.FAITHFULNESS,
  cache: true
});

// Evaluate
const result = await judge.evaluate({
  query: "What is the capital of France?",
  response: "The capital of France is Paris.",
  context: "Paris is the capital and largest city of France."
});

console.log(`Score: ${result.score}`);
console.log(`Reasoning: ${result.reasoning}`);
```

## Features

- ✅ **Calibrated Judgments** — Trustworthy scores with known reliability metrics
- ✅ **Bias-Aware** — Automatic detection and mitigation of position bias
- ✅ **Cost-Optimized** — Smart caching and multi-judge strategies
- ✅ **Production-Ready** — Enterprise-grade TypeScript with comprehensive testing

## Documentation

- [API Reference](./docs/api/README.md)
- [User Guide](./docs/user-guide.md)
- [Examples](./docs/examples/)
- [Architecture](./docs/architecture.md)

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting a Pull Request.

## License

MIT © [reaatech](https://github.com/reaatech)
```

## Constraints
- Documentation must be kept in sync with code
- Examples must be tested and working
- API docs must be auto-generated where possible
- Documentation must be searchable and navigable
- Include both beginner and advanced examples

## Best Practices
1. **Auto-Generate**: Use TypeDoc for API documentation
2. **Examples First**: Lead with practical examples
3. **Clear Structure**: Organize docs logically
4. **Searchable**: Make docs easy to navigate
5. **Up-to-Date**: Keep docs synchronized with code
6. **Multiple Formats**: Support markdown, HTML, PDF
7. **Code Examples**: Include working code snippets
8. **Visual Aids**: Use diagrams for complex concepts

## Related Skills
- `project-setup` - For documentation tooling setup
- `type-design` - For documenting types
- `ci-cd-pipeline` - For automated doc generation
