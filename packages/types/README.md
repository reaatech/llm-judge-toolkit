# @reaatech/llm-judge-types

[![npm version](https://img.shields.io/npm/v/@reaatech/llm-judge-types.svg)](https://www.npmjs.com/package/@reaatech/llm-judge-types)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/llm-judge-toolkit/ci.yml?branch=main&label=CI)](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml)

> **Status:** Pre-1.0 — APIs may change in minor versions. Pin to a specific version in production.

Canonical TypeScript types, Zod schemas, and error classes for LLM Judge Toolkit. This package is the single source of truth for all type definitions used throughout the ecosystem.

## Installation

```bash
npm install @reaatech/llm-judge-types
# or
pnpm add @reaatech/llm-judge-types
```

## Feature Overview

- 70+ exported types/schemas
- 11 type files covering judgment/cost/provider/cache/events/types
- 6 typed error classes
- Zero runtime deps beyond zod
- Dual ESM/CJS

## Quick Start

```typescript
import {
  Judgment,
  EvaluationCriteriaSchema,
  JudgeError,
  LLMProvider,
} from '@reaatech/llm-judge-types';

const criteria = EvaluationCriteriaSchema.enum.faithfulness;

function validateScore(score: unknown): number {
  if (typeof score !== 'number' || score < 0 || score > 1) {
    throw new JudgeError('Score must be 0–1', 'VALIDATION_ERROR');
  }
  return score;
}
```

## API Reference

### Core Types

| Export | Description |
|--------|-------------|
| `Judgment` | Full judgment result (id, score, reasoning, confidence, cost, metadata) |
| `JudgmentMetadata` | Per-judgment metadata (provider, model, duration, retries) |
| `ConsensusJudgment` | Consensus aggregate across multiple judges |
| `ConsensusMethod` | Union of consensus methods (majority, mean, weighted, etc.) |
| `CostBreakdown` | Token-level cost breakdown (input/output/total, currency) |
| `Budget` | Budget configuration for cost tracking |

### Provider System

| Export | Description |
|--------|-------------|
| `LLMProvider` | Interface for provider implementations |
| `CompletionRequest` | LLM completion request shape |
| `CompletionResponse` | LLM completion response shape |
| `TokenUsage` | Token usage counts for a completion |
| `ModelInfo` | Model metadata (name, version, capabilities) |
| `HealthStatus` | Provider health check result |

### Configuration

| Export | Description |
|--------|-------------|
| `ProviderConfig` | Provider configuration shape |
| `EngineConfig` | Engine configuration (model, temperature, maxTokens, retries) |
| `JudgeConfig` | Judge configuration shape |
| `CacheConfig` | Cache configuration shape |
| `CriteriaConfig` | Evaluation criteria configuration |

### Interfaces

| Export | Description |
|--------|-------------|
| `ConsensusStrategy` | Interface for consensus aggregation strategies |
| `CacheBackend` | Interface for cache backend implementations |
| `EventBus` | Interface for typed event emission and subscription |

### Infrastructure Types

| Export | Description |
|--------|-------------|
| `ConfusionMatrix` | Binary classification confusion matrix |
| `CalibrationReport` | Calibration metrics output |
| `PositionBiasScore` | Per-position bias scoring result |
| `PositionBiasReport` | Full position-bias analysis result |
| `JudgmentEvent` | Discriminated union of judgment lifecycle events |

### Error Classes

| Export | Description |
|--------|-------------|
| `JudgeError` | Base error class for all judge-related errors |
| `ProviderError` | Provider-specific errors (auth, rate limit, timeout, server) |
| `ValidationError` | Zod validation failures |
| `BudgetExceededError` | Budget threshold exceeded |
| `TemplateError` | Prompt template build/failure errors |
| `CacheError` | Cache read/write failures |

## Related Packages

- [`@reaatech/llm-judge-engine`](https://www.npmjs.com/package/@reaatech/llm-judge-engine) — Judgment execution engine
- [`@reaatech/llm-judge-providers`](https://www.npmjs.com/package/@reaatech/llm-judge-providers) — Provider implementations
- [`@reaatech/llm-judge-templates`](https://www.npmjs.com/package/@reaatech/llm-judge-templates) — Prompt templates

## License

[MIT](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
