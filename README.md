# LLM Judge Toolkit

<p align="center">
  <strong>Calibrated LLM-as-Judge for Production Evaluation Pipelines</strong>
</p>

<p align="center">
  <a href="https://github.com/reaatech/llm-judge-toolkit/actions"><img src="https://img.shields.io/github/actions/workflow/status/reaatech/llm-judge-toolkit/ci.yml?branch=main&style=flat-square" alt="CI"></a>
  <a href="https://www.npmjs.com/package/llm-judge-toolkit"><img src="https://img.shields.io/npm/v/llm-judge-toolkit?style=flat-square" alt="npm"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/llm-judge-toolkit?style=flat-square" alt="License"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/node/v/llm-judge-toolkit?style=flat-square" alt="Node.js"></a>
</p>

---

Everyone uses LLM-as-judge now. Almost nobody calibrates them.

LLM Judge Toolkit provides **trustworthy, bias-aware, and cost-efficient** LLM-powered evaluations. It ships with built-in calibration against human labels, automatic position bias detection, multi-judge consensus strategies, and intelligent caching — so your evaluation pipelines produce scores you can actually rely on.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API](#api)
  - [Provider Setup](#provider-setup)
  - [Single Judgment](#single-judgment)
  - [Multi-Judge Consensus](#multi-judge-consensus)
  - [Calibration](#calibration)
  - [Bias Detection](#bias-detection)
  - [Caching](#caching)
  - [Cost Tracking](#cost-tracking)
  - [Batch Processing](#batch-processing)
- [Supported Providers](#supported-providers)
- [Project Status](#project-status)
- [Downstream Projects](#downstream-projects)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Features

| Module | Description |
|--------|-------------|
| **Judge Templates** | Ready-to-use prompt templates for faithfulness, relevance, coherence, safety, and tool-use correctness |
| **Multi-Judge Consensus** | Majority voting, weighted voting, and cheap-first tiebreaker strategies for improved reliability |
| **Calibration Suite** | Measure agreement with human labels via Cohen's kappa, accuracy, precision/recall, and F1 score |
| **Bias Detection** | Detect and mitigate position bias, length bias, and style bias with automatic debiasing |
| **Cost Tracking** | Per-judgment cost breakdown, budget management, and token accounting across providers |
| **Intelligent Caching** | In-memory, file-based, and Redis cache backends — same input + criteria yields cached result |
| **Batch Processing** | Concurrent execution with configurable parallelism for bulk evaluation workloads |
| **Observability** | Structured logging (pino), metrics collection, and an event bus for judgment lifecycle hooks |
| **Rate Limiting** | Token-bucket rate limiter to respect provider throughput constraints |

## Installation

```bash
npm install llm-judge-toolkit
# or
pnpm add llm-judge-toolkit
```

Provider SDKs are optional peer dependencies. Install only what you need:

```bash
# OpenAI provider
pnpm add openai

# Anthropic provider
pnpm add @anthropic-ai/sdk
```

**Requirements:** Node.js >= 20

## Quick Start

```typescript
import { JudgmentEngine, OpenAIProvider, FaithfulnessTemplate } from 'llm-judge-toolkit';

const provider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
const engine = new JudgmentEngine({
  provider,
  template: new FaithfulnessTemplate(),
  config: { model: 'gpt-4o-mini' },
});

const result = await engine.judge({
  query: 'What is the capital of France?',
  response: 'The capital of France is Paris.',
  context: 'Paris is the capital and largest city of France.',
});

console.log(result.score);       // 0.95
console.log(result.reasoning);   // "The response is fully supported..."
console.log(result.confidence);  // 0.92
```

## API

### Provider Setup

```typescript
import { OpenAIProvider, AnthropicProvider, LocalProvider } from 'llm-judge-toolkit';

const openai = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',    // optional
  timeout: 30_000,                          // optional (ms)
});

const anthropic = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const local = new LocalProvider({
  baseURL: 'http://localhost:11434/v1',
  model: 'llama3',
});
```

### Single Judgment

```typescript
import {
  JudgmentEngine,
  FaithfulnessTemplate,
  RelevanceTemplate,
  CoherenceTemplate,
  SafetyTemplate,
  ToolUseTemplate,
} from 'llm-judge-toolkit';

const engine = new JudgmentEngine({
  provider: openai,
  template: new FaithfulnessTemplate(),
  config: {
    model: 'gpt-4o',
    temperature: 0.1,
    maxTokens: 2000,
    cacheEnabled: true,
    maxRetries: 3,
    retryDelay: 1000,
  },
});

const judgment = await engine.judge({
  query: 'Summarize the article.',
  response: 'The article discusses climate policy...',
  context: 'Article text here...',
});

console.log(judgment);
// {
//   id: "uuid",
//   criteria: "faithfulness",
//   score: 0.87,
//   reasoning: "...",
//   confidence: 0.91,
//   cost: { inputCost: 0.0001, outputCost: 0.0003, totalCost: 0.0004, currency: "USD" },
//   timestamp: 2026-04-26T...,
//   provider: "openai",
//   model: "gpt-4o"
// }
```

### Multi-Judge Consensus

```typescript
import {
  JudgmentEngine,
  OpenAIProvider,
  RelevanceTemplate,
  MajorityVoting,
  CheapFirstTiebreaker,
  WeightedVoting,
} from 'llm-judge-toolkit';

const cheapProvider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
const expensiveProvider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });

const cheapJudge = new JudgmentEngine({
  provider: cheapProvider,
  template: new RelevanceTemplate(),
  config: { model: 'gpt-4o-mini' },
});

const expensiveJudge = new JudgmentEngine({
  provider: expensiveProvider,
  template: new RelevanceTemplate(),
  config: { model: 'gpt-4o' },
});

const context = {
  query: 'Best practices for API design?',
  response: 'Use RESTful conventions, version your APIs...',
  context: "REST is an architectural style...",
};

const j1 = await cheapJudge.judge(context);
const j2 = await cheapJudge.judge(context);

// Strategy 1: Majority voting
const majority = new MajorityVoting();
const result = majority.execute([j1, j2]);
console.log(result.finalScore, result.agreementScore);

// Strategy 2: Cheap-first tiebreaker — run expensive judge only if cheap judges disagree
const tiebreaker = new CheapFirstTiebreaker(2);
const cheapResult = tiebreaker.execute([j1, j2]);

if (cheapResult.agreementScore < 0.8) {
  const j3 = await expensiveJudge.judge(context);
  const finalResult = tiebreaker.execute([j1, j2, j3]);
  console.log(finalResult.finalScore); // tiebreaker used
} else {
  console.log(cheapResult.finalScore); // cheap judges agreed — no tiebreaker needed
}

// Strategy 3: Weighted voting with custom weights
const j3 = await expensiveJudge.judge(context);
const weighted = new WeightedVoting([0.4, 0.4, 0.2]);
const result3 = weighted.execute([j1, j2, j3]);
```

### Calibration

```typescript
import { CalibrationRunner, JudgmentEngine, OpenAIProvider, FaithfulnessTemplate } from 'llm-judge-toolkit';

const engine = new JudgmentEngine({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  template: new FaithfulnessTemplate(),
  config: { model: 'gpt-4o-mini' },
});

const runner = new CalibrationRunner({
  engine,
  criteria: 'faithfulness',
  concurrency: 3,
  onProgress: (completed, total) => console.log(`${completed}/${total}`),
});

const { report, judgments, failed } = await runner.run();

console.log(`Cohen's Kappa: ${report.cohensKappa}`);
console.log(`Accuracy:     ${report.accuracy}`);
console.log(`Precision:    ${report.precision}`);
console.log(`Recall:       ${report.recall}`);
console.log(`F1 Score:     ${report.f1Score}`);
console.log(`Failed:       ${failed}`);
```

### Bias Detection

**Position Bias** — detects when candidate order influences scores:

```typescript
import { PositionBiasDetector, JudgmentEngine, OpenAIProvider, FaithfulnessTemplate } from 'llm-judge-toolkit';

const engine = new JudgmentEngine({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  template: new FaithfulnessTemplate(),
});

const detector = new PositionBiasDetector(0.1); // 10% threshold
const report = await detector.detect(engine, [
  { id: 'a', content: 'Answer A' },
  { id: 'b', content: 'Answer B' },
]);

if (report.hasBias) {
  console.log(`Bias detected: ${report.averageBias}`);
  const debiased = await detector.debias(engine, [
    { id: 'a', content: 'Answer A' },
    { id: 'b', content: 'Answer B' },
  ]);
}
```

**Length Bias** — detects preference for longer/shorter responses:

```typescript
import { LengthBiasDetector } from 'llm-judge-toolkit';

const detector = new LengthBiasDetector();
const report = await detector.detect(engine, [
  { id: 'a', content: 'Short answer.' },
  { id: 'b', content: 'A much longer, more detailed answer that goes on...' },
]);
```

**Comprehensive Bias** — runs all bias checks in one pass:

```typescript
import { ComprehensiveBiasDetector } from 'llm-judge-toolkit';

const detector = new ComprehensiveBiasDetector();
const report = await detector.detect(engine, [
  { id: 'a', content: 'Answer A' },
  { id: 'b', content: 'Answer B' },
]);

console.log(report.positionBias);
console.log(report.lengthBias);
console.log(report.styleBias);
```

### Caching

```typescript
import { CacheManager, InMemoryCache, FileCache, RedisCache } from 'llm-judge-toolkit';

// In-memory cache (default)
const memCache = new CacheManager(new InMemoryCache(), { ttl: 86_400_000 }); // 24h

// File-based persistent cache
const fileCache = new CacheManager(new FileCache('./.judge-cache'), { ttl: 86_400_000 });

// Redis cache (for distributed deployments — requires ioredis)
import Redis from 'ioredis';
const redisCache = new CacheManager(new RedisCache(new Redis()), { ttl: 86_400_000 });

// Wire cache into the engine
const engine = new JudgmentEngine({
  provider,
  template: new FaithfulnessTemplate(),
  cache: memCache,
});
```

### Cost Tracking

```typescript
import { CostTracker, JudgmentEngine } from 'llm-judge-toolkit';

const tracker = new CostTracker();

const engine = new JudgmentEngine({ provider, template: new FaithfulnessTemplate() });

const result = await engine.judge({ query: '...', response: '...' });
tracker.track(result);

console.log(tracker.getTotalCost());    // Cumulative cost
console.log(tracker.generateReport());  // Full cost breakdown
```

### Batch Processing

```typescript
import { BatchProcessor, JudgmentEngine, OpenAIProvider, FaithfulnessTemplate } from 'llm-judge-toolkit';

const engine = new JudgmentEngine({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  template: new FaithfulnessTemplate(),
  config: { model: 'gpt-4o-mini' },
});

const processor = new BatchProcessor({
  engine,
  concurrency: 5,
  onProgress: (completed, total) => console.log(`${completed}/${total}`),
});

const results = await processor.process([
  { id: 'q1', context: { query: 'Q1', response: 'A1', context: '...' } },
  { id: 'q2', context: { query: 'Q2', response: 'A2', context: '...' } },
  { id: 'q3', context: { query: 'Q3', response: 'A3', context: '...' } },
]);

for (const result of results) {
  if (result.error) {
    console.error(`Failed: ${result.error.message}`);
  } else {
    console.log(`${result.id}: score=${result.judgment!.score}`);
  }
}
```

## Supported Providers

| Provider | SDK | Models |
|----------|-----|--------|
| **OpenAI** | `openai` (peer) | GPT-4o, GPT-4o Mini, GPT-4 Turbo |
| **Anthropic** | `@anthropic-ai/sdk` (peer) | Claude 3.5 Sonnet, Claude 3 Haiku |
| **Local** | Built-in | Ollama, LM Studio (OpenAI-compatible endpoint) |

## Project Status

LLM Judge Toolkit is under active development (v0.1.x). The core engine, templates, consensus, calibration, bias detection, caching, cost tracking, and batch processing modules are implemented and tested. See [DEV_PLAN.md](DEV_PLAN.md) for the detailed roadmap.

## Downstream Projects

This library is the foundation for:

- [**classifier-evals**](https://github.com/reaatech/classifier-evals) — Classifier evaluation harness
- [**agent-eval-harness**](https://github.com/reaatech/agent-eval-harness) — Agent evaluation framework

## Documentation

- [Architecture Overview](ARCHITECTURE.md) — Design principles, data flow, and module architecture
- [Development Plan](DEV_PLAN.md) — Phased roadmap and feature status
- [Contributing Guide](CONTRIBUTING.md) — Setup, conventions, and pull request process
- [Agent Skills](AGENTS.md) — AI-assisted development workflow
- [Security Policy](SECURITY.md) — Vulnerability reporting and security considerations

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and pull request guidelines.

## Security

Report vulnerabilities to `security@reaatech.dev` or open a private advisory on GitHub. Do not open public issues for security concerns. See [SECURITY.md](SECURITY.md) for details.

## License

[MIT](LICENSE)
