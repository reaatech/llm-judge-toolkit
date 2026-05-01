# @reaatech/llm-judge-infra

[![npm version](https://img.shields.io/npm/v/@reaatech/llm-judge-infra.svg)](https://www.npmjs.com/package/@reaatech/llm-judge-infra)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/llm-judge-toolkit/ci.yml?branch=main&label=CI)](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml)

> **Status:** Pre-1.0 — APIs may change in minor versions. Pin to a specific version in production.

Infrastructure utilities including cost tracking with budget enforcement, structured Pino logging, metrics collection, and batch processing with configurable concurrency and retry.

## Installation

```bash
npm install @reaatech/llm-judge-infra
# or
pnpm add @reaatech/llm-judge-infra
```

## Feature Overview

- CostTracker with period-aware cost aggregation and budget alerts
- Pino logger with structured log helpers (judgment, error, cache hit/miss, budget exceeded)
- MetricsCollector tracking judgments, latency, scores, costs, and cache hit rates
- BatchProcessor with concurrency control, progress callbacks, and automatic retry
- Zero external dependencies beyond pino for logging

## Quick Start

```typescript
import { CostTracker } from '@reaatech/llm-judge-infra';

const tracker = new CostTracker({
  budget: { limit: 10.0, period: 'daily' },
});

tracker.track(judgment);

const report = tracker.generateReport();
console.log(report.totalCost, report.averageCostPerJudgment);
```

```typescript
import { BatchProcessor } from '@reaatech/llm-judge-infra';

const processor = new BatchProcessor({
  engine: judgmentEngine,
  concurrency: 5,
  onProgress: (done, total) => console.log(`${done}/${total}`),
  onError: (id, error) => console.error(`Failed ${id}:`, error.message),
});

const results = await processor.process(items);
```

## API Reference

### CostTracker

| Export | Description |
|--------|-------------|
| `constructor({budget?, eventBus?})` | Create a tracker with optional budget and event bus |
| `track(judgment)` | Record judgment cost (throws BudgetExceededError if over limit) |
| `getTotalCost()` | Sum of all tracked costs |
| `getPeriodCost()` | Cost within the current period window |
| `getCostByCriteria()` | Cost filtered by evaluation criteria |
| `getCostByProvider()` | Cost filtered by provider name |
| `getCostByModel()` | Cost filtered by model name |
| `generateReport()` | Full cost report with breakdowns |

### BatchProcessor

| Export | Description |
|--------|-------------|
| `constructor({engine, concurrency?, onProgress?, onError?})` | Create with engine, concurrency (default 3), and callbacks |
| `process(items[])` | Evaluate all items, return BatchResult[] |
| `processWithRetry(items[], options?)` | Process with automatic retries on transient errors |

### MetricsCollector

| Export | Description |
|--------|-------------|
| `recordJudgment()` | Record a single judgment |
| `recordCacheHit()` | Increment cache hit counter |
| `recordCacheMiss()` | Increment cache miss counter |
| `recordFailure()` | Increment failure counter |
| `snapshot()` | Return MetricsSnapshot with all current values |
| `reset()` | Reset all counters to zero |

### Logging Helpers

| Export | Description |
|--------|-------------|
| `logger` | Raw Pino instance |
| `logJudgment()` | Log a completed judgment with duration |
| `logError()` | Log an error with optional context |
| `logCacheHit()` | Log a cache hit event |
| `logCacheMiss()` | Log a cache miss event |
| `logBudgetExceeded()` | Log when budget threshold is exceeded |

## Related Packages

- [`@reaatech/llm-judge-types`](https://www.npmjs.com/package/@reaatech/llm-judge-types) — Core type definitions
- [`@reaatech/llm-judge-engine`](https://www.npmjs.com/package/@reaatech/llm-judge-engine) — JudgmentEngine consumed by BatchProcessor

## License

[MIT](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
