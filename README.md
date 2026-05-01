# llm-judge-toolkit

[![CI](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)

> A calibrated LLM-as-judge evaluation library with multi-judge consensus, position bias
> detection, calibration against human labels, cost tracking, and caching.

This monorepo provides a complete toolkit for using LLMs as evaluators (judges) for
generated text: prompt templates, provider integrations, a judgment engine with retry/caching,
statistical calibration, bias detection, and CLI tooling.

## Features

- **Judgment engine** — Execute, cache, and retry LLM judgments with a typed event bus and rate limiting
- **Multi-provider support** — OpenAI, Anthropic, and local (Ollama/vLLM/LM Studio) endpoints with dynamic SDK loading
- **Prompt templates** — Five built-in evaluation criteria (faithfulness, relevance, coherence, safety, tool-use) with extensible template interface
- **Multi-judge consensus** — Majority voting, weighted voting, and cheap-first tiebreaker strategies
- **Calibration suite** — Cohen's kappa, confusion matrices, F1 scores, and drift detection against human-labeled gold-standard datasets
- **Bias detection** — Detect position bias (order effects), length bias (verbosity preference), and style bias (formatting/register effects)
- **Caching** — Multi-backend cache (in-memory, file-system, Redis) with SHA-256 content-addressed keys and TTL expiration
- **Infrastructure** — Cost tracking with budget enforcement, structured Pino logging, metrics collection, and batch processing
- **CLI** — `llm-judge evaluate` and `llm-judge calibrate` commands consuming JSONL input

## Installation

### Using the packages

Packages are published under the `@reaatech` scope and can be installed individually:

```bash
# Core types and schemas
pnpm add @reaatech/llm-judge-types

# Judgment engine (events, rate limiting)
pnpm add @reaatech/llm-judge-engine

# Provider implementations
pnpm add @reaatech/llm-judge-providers

# Prompt templates
pnpm add @reaatech/llm-judge-templates

# Consensus strategies
pnpm add @reaatech/llm-judge-consensus

# Calibration metrics and datasets
pnpm add @reaatech/llm-judge-calibration

# Bias detection
pnpm add @reaatech/llm-judge-bias

# Caching backends
pnpm add @reaatech/llm-judge-cache

# Cost tracking, monitoring, batch processing
pnpm add @reaatech/llm-judge-infra

# CLI tool
pnpm add @reaatech/llm-judge-cli
```

### Contributing

```bash
# Clone the repository
git clone https://github.com/reaatech/llm-judge-toolkit.git
cd llm-judge-toolkit

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run the test suite
pnpm test

# Run linting
pnpm lint
```

## Quick Start

Evaluate text faithfulness with the judgment engine:

```typescript
import { JudgmentEngine } from "@reaatech/llm-judge-engine";
import { OpenAIProvider } from "@reaatech/llm-judge-providers";
import { FaithfulnessTemplate } from "@reaatech/llm-judge-templates";
import { CacheManager, InMemoryCache } from "@reaatech/llm-judge-cache";

const provider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
const template = new FaithfulnessTemplate();
const cache = new CacheManager(new InMemoryCache());

const engine = new JudgmentEngine({
  provider,
  template,
  cache,
  config: { model: "gpt-4o-mini" },
});

const judgment = await engine.judge({
  query: "What are black holes?",
  response:
    "A black hole is a region of spacetime where gravity is so strong " +
    "that nothing, not even light, can escape.",
  context:
    "Black holes are regions of spacetime exhibiting gravitational " +
    "acceleration so strong that nothing can escape from it.",
});

console.log(`Score: ${judgment.score}, Confidence: ${judgment.confidence}`);
console.log(judgment.reasoning);
```

Detect position bias across multiple candidate responses:

```typescript
import { PositionBiasDetector } from "@reaatech/llm-judge-bias";

const detector = new PositionBiasDetector(0.1);
const report = await detector.detect(engine, [
  { id: "a", content: "Short answer." },
  { id: "b", content: "A much longer and more elaborate answer." },
]);

if (report.hasBias) {
  console.log(report.recommendation);
  // Use detector.debias() to average both orderings
}
```

Run calibration against human-labeled data with the CLI:

```bash
llm-judge calibrate \
  --input data/labels.jsonl \
  --criteria faithfulness \
  --provider openai \
  --model gpt-4o-mini
```

See the [`examples/`](./examples/) directory for complete working samples.

## Packages

| Package | Description |
| ------- | ----------- |
| [`@reaatech/llm-judge-types`](./packages/types) | Core types, Zod schemas, and error classes |
| [`@reaatech/llm-judge-providers`](./packages/providers) | OpenAI, Anthropic, and local provider implementations |
| [`@reaatech/llm-judge-templates`](./packages/templates) | Prompt templates for evaluation criteria |
| [`@reaatech/llm-judge-engine`](./packages/engine) | Judgment engine with retry, caching, event bus, and rate limiting |
| [`@reaatech/llm-judge-consensus`](./packages/consensus) | Multi-judge consensus strategies |
| [`@reaatech/llm-judge-calibration`](./packages/calibration) | Calibration metrics, runner, datasets, and drift detection |
| [`@reaatech/llm-judge-bias`](./packages/bias) | Position, length, and style bias detection |
| [`@reaatech/llm-judge-cache`](./packages/cache) | Multi-backend caching (in-memory, file, Redis) |
| [`@reaatech/llm-judge-infra`](./packages/infra) | Cost tracking, monitoring, and batch processing |
| [`@reaatech/llm-judge-cli`](./packages/cli) | CLI tool with evaluate and calibrate commands |

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — System design, package relationships, and data flows
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — Contribution workflow and release process
- [`skills/`](./skills/) — Agent skill definitions for AI-assisted development

## License

[MIT](LICENSE)
