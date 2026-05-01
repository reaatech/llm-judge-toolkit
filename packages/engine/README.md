# @reaatech/llm-judge-engine

[![npm version](https://img.shields.io/npm/v/@reaatech/llm-judge-engine.svg)](https://www.npmjs.com/package/@reaatech/llm-judge-engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/llm-judge-toolkit/ci.yml?branch=main&label=CI)](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml)

> **Status:** Pre-1.0 — APIs may change in minor versions. Pin to a specific version in production.

The core judgment execution engine. Orchestrates provider calls with automatic retry, caching, rate limiting, and a typed event bus.

## Installation

```bash
npm install @reaatech/llm-judge-engine
# or
pnpm add @reaatech/llm-judge-engine
```

## Feature Overview

- Retry with exponential backoff
- Cache integration
- Rate limiting via token bucket
- Typed event bus (7 event types)
- In-memory event bus implementation

## Quick Start

```typescript
import { JudgmentEngine } from '@reaatech/llm-judge-engine';
import { OpenAIProvider } from '@reaatech/llm-judge-providers';
import { FaithfulnessTemplate } from '@reaatech/llm-judge-templates';

const engine = new JudgmentEngine({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  template: new FaithfulnessTemplate(),
  config: { model: 'gpt-4o-mini', maxRetries: 3 },
});

const judgment = await engine.judge({
  query: 'What is the capital of France?',
  response: 'The capital is Paris.',
  context: 'Paris is the capital of France.',
});

console.log(judgment.score, judgment.reasoning);
```

## API Reference

### JudgmentEngine

| Export | Description |
|--------|-------------|
| `constructor(options)` | Create a new engine with provider, template, cache, event bus, and rate limiter |
| `judge(context)` | Evaluate a response, returning a full `Judgment` with caching, retry, and validation |
| `createJudgment(output)` | Parse provider output into a validated `Judgment` |
| `getCacheKey(context)` | Generate a cache key for a given judgment context |

### InMemoryEventBus

| Export | Description |
|--------|-------------|
| `emit(event, payload)` | Emit a typed event to all subscribers |
| `on(event, handler)` | Subscribe to an event |
| `off(event, handler)` | Unsubscribe from an event |
| `removeAllListeners(event?)` | Remove all handlers (or for a specific event) |
| `listenerCount(event)` | Count active subscribers for an event |

### RateLimiter

| Export | Description |
|--------|-------------|
| `RateLimiterConfig` | Configuration for token bucket rate limiter |
| `acquire(tokens)` | Wait until tokens are available (async) |
| `tryAcquire(tokens)` | Try to acquire tokens without waiting (boolean) |
| `getRemainingTokens()` | Get current available token count |

## Related Packages

- [`@reaatech/llm-judge-types`](https://www.npmjs.com/package/@reaatech/llm-judge-types) — Core type definitions
- [`@reaatech/llm-judge-templates`](https://www.npmjs.com/package/@reaatech/llm-judge-templates) — Prompt templates
- [`@reaatech/llm-judge-cache`](https://www.npmjs.com/package/@reaatech/llm-judge-cache) — Cache backends

## License

[MIT](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
