# @reaatech/llm-judge-providers

[![npm version](https://img.shields.io/npm/v/@reaatech/llm-judge-providers.svg)](https://www.npmjs.com/package/@reaatech/llm-judge-providers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/llm-judge-toolkit/ci.yml?branch=main&label=CI)](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml)

> **Status:** Pre-1.0 — APIs may change in minor versions. Pin to a specific version in production.

LLM provider implementations with a factory pattern for OpenAI, Anthropic, and local (OpenAI-compatible) endpoints. All providers implement the shared `LLMProvider` interface with dynamic SDK loading.

## Installation

```bash
npm install @reaatech/llm-judge-providers
# or
pnpm add @reaatech/llm-judge-providers
```

For provider SDKs (optional, lazily loaded):

```bash
npm install openai               # for OpenAIProvider
npm install @anthropic-ai/sdk    # for AnthropicProvider
```

## Feature Overview

- **OpenAI provider** — GPT-4o, GPT-4o-mini, GPT-4 Turbo with per-model pricing tables
- **Anthropic provider** — Claude 3.5 Sonnet, Claude 3 Haiku with system/user message separation
- **Local provider** — raw `fetch` to any OpenAI-compatible endpoint (Ollama, vLLM, LM Studio)
- **ProviderFactory** — `create()` for explicit config, `fromEnv()` for environment variable resolution
- **Dynamic SDK loading** — SDKs only loaded when a provider is actually instantiated
- **Built-in cost calculation** — per-million-token pricing in USD for every model
- **Health checks** — `checkHealth()` returns latency and status per provider

## Quick Start

```typescript
import { ProviderFactory } from "@reaatech/llm-judge-providers";

// From environment variables (uses LLM_JUDGE_PROVIDER or defaults to 'openai')
const provider = ProviderFactory.fromEnv();

// Or create explicitly by name
const localProvider = ProviderFactory.create({ name: "local" });

const response = await provider.generateCompletion({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "You are an evaluator." },
    { role: "user", content: "Score this response: ..." },
  ],
  temperature: 0.1,
  maxTokens: 2000,
});

console.log(response.content);
console.log(provider.calculateCost(response.usage));
```

## API Reference

### OpenAIProvider

Constructor options:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `apiKey` | `string` | Yes | OpenAI API key |
| `baseURL` | `string` | No | Custom endpoint URL |
| `timeout` | `number` | No | Request timeout in ms (default: `30000`) |

Supported models:

| Model | Context Window | Streaming |
|-------|---------------|-----------|
| `gpt-4o` | 128K | Yes |
| `gpt-4o-mini` | 128K | Yes |
| `gpt-4-turbo` | 128K | Yes |

Per-model pricing (per 1M tokens):

| Model | Input | Output |
|-------|-------|--------|
| `gpt-4o` | $2.50 | $10.00 |
| `gpt-4o-mini` | $0.15 | $0.60 |
| `gpt-4-turbo` | $10.00 | $30.00 |

### AnthropicProvider

Constructor options:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `apiKey` | `string` | Yes | Anthropic API key |
| `baseURL` | `string` | No | Custom endpoint URL |
| `timeout` | `number` | No | Request timeout in ms (default: `30000`) |

Supported models:

| Model | Context Window | Streaming |
|-------|---------------|-----------|
| `claude-3-5-sonnet-20241022` | 200K | Yes |
| `claude-3-haiku-20240307` | 200K | Yes |

Per-model pricing (per 1M tokens):

| Model | Input | Output |
|-------|-------|--------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Haiku | $0.25 | $1.25 |

### LocalProvider

Constructor options:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `baseURL` | `string` | No | `http://localhost:11434` | OpenAI-compatible endpoint URL |
| `apiKey` | `string` | No | — | Optional auth token |
| `timeout` | `number` | No | `30000` | Request timeout in ms |

### ProviderFactory

Static methods:

| Method | Description |
|--------|-------------|
| `create(options)` | Instantiate a provider by name (`openai`, `anthropic`, or `local`) with explicit config |
| `fromEnv(providerName?)` | Create from environment variables. Reads `LLM_JUDGE_PROVIDER`, `LLM_JUDGE_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `LLM_JUDGE_BASE_URL`, and `LLM_JUDGE_TIMEOUT`. Defaults to `openai` when no provider name is set. |

### LLMProvider Interface

All providers implement this shared interface from `@reaatech/llm-judge-types`:

| Member | Type | Description |
|--------|------|-------------|
| `name` | `string` | Provider identifier (`openai`, `anthropic`, `local`) |
| `models` | `ModelInfo[]` | Supported models with context window and streaming info |
| `generateCompletion(request)` | `Promise<CompletionResponse>` | Send a chat completion and return content, usage, and duration |
| `countTokens(text)` | `number` | Estimate token count for a text string (characters / 4) |
| `calculateCost(usage)` | `CostBreakdown` | Return per-model cost breakdown in USD |
| `checkHealth()` | `Promise<HealthStatus>` | Ping the endpoint and return `healthy`, `degraded`, or `unhealthy` with latency |

## Related Packages

- [`@reaatech/llm-judge-types`](https://www.npmjs.com/package/@reaatech/llm-judge-types) — Core types including `LLMProvider` interface
- [`@reaatech/llm-judge-engine`](https://www.npmjs.com/package/@reaatech/llm-judge-engine) — Judgment engine that consumes providers

## License

[MIT](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
