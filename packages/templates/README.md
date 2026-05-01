# @reaatech/llm-judge-templates

[![npm version](https://img.shields.io/npm/v/@reaatech/llm-judge-templates.svg)](https://www.npmjs.com/package/@reaatech/llm-judge-templates)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/llm-judge-toolkit/ci.yml?branch=main&label=CI)](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml)

> **Status:** Pre-1.0 — APIs may change in minor versions. Pin to a specific version in production.

Evaluation prompt templates implementing the `JudgmentTemplate` interface. Each template (faithfulness, relevance, coherence, safety, tool-use) builds structured prompts with JSON-parsed responses and fallback parsing.

## Installation

```bash
npm install @reaatech/llm-judge-templates
# or
pnpm add @reaatech/llm-judge-templates
```

## Feature Overview

- **Five evaluation templates** — faithfulness, relevance, coherence, safety, and tool-use criteria
- **JudgmentTemplate interface** — build custom templates with `buildPrompt` and `parseResponse`
- **Structured JSON output** — every template returns score, reasoning, confidence, and metadata
- **Robust parsing** — `cleanAndParse` strips markdown fences; `parseFallback` handles malformed output
- **Input validation** — 500K character length limit and required field checks enforced per template
- **Score normalization** — `safeScore` clamps and validates scores to 0–1, defaults to 0.5

## Quick Start

```typescript
import { FaithfulnessTemplate } from "@reaatech/llm-judge-templates";

const template = new FaithfulnessTemplate();

const prompt = template.buildPrompt({
  query: "What is the capital of France?",
  response: "The capital of France is Paris.",
  context: "Paris is the capital and most populous city of France.",
});
// prompt = { system: "...", user: "..." }

const parsed = template.parseResponse(`{
  "score": 1.0,
  "reasoning": "All claims are supported by the source material.",
  "confidence": 0.95
}`);

console.log(parsed.score, parsed.confidence);
// 1.0, 0.95
```

## API Reference

### FaithfulnessTemplate

| Property | Value |
|----------|-------|
| Criteria | `faithfulness` |
| Required context | `context` (source material), `response` |
| Metadata output | `unsupportedClaims` — claims not found in source |

### RelevanceTemplate

| Property | Value |
|----------|-------|
| Criteria | `relevance` |
| Required context | `query`, `response` |
| Metadata output | `missingAspects` — query aspects not addressed |

### CoherenceTemplate

| Property | Value |
|----------|-------|
| Criteria | `coherence` |
| Required context | `response` |
| Metadata output | `contradictions` — logical inconsistencies detected |

### SafetyTemplate

| Property | Value |
|----------|-------|
| Criteria | `safety` |
| Required context | `response` |
| Checks | Harmful content, bias/discrimination, PII leaks, misinformation |
| Metadata output | `violations` — safety violations found |

### ToolUseTemplate

| Property | Value |
|----------|-------|
| Criteria | `tool-use` |
| Required context | `query`, `toolCalls` |
| Metadata output | `parameterErrors` — incorrect tool parameters |

### JudgmentTemplate Interface

| Member | Type | Description |
|--------|------|-------------|
| `name` | `string` | Template identifier |
| `version` | `string` | Semantic version of the template |
| `criteria` | `EvaluationCriteria` | The evaluation criterion this template assesses |
| `buildPrompt(context)` | `(context: TemplateContext) => PromptRequest` | Build a `{ system, user }` prompt from template context |
| `parseResponse(response)` | `(response: string) => ParsedJudgment` | Parse raw LLM output into `{ score, reasoning, confidence, metadata }` |

### TemplateContext

| Property | Type | Description |
|----------|------|-------------|
| `query` | `string` | The original user query |
| `response` | `string` | The generated response to evaluate |
| `context` | `string` | Source material for faithfulness checks |
| `candidates` | `Candidate[]` | Multiple response candidates for comparison |
| `toolCalls` | `ToolCall[]` | Tool calls made by the model |
| `toolOutputs` | `unknown[]` | Outputs from tool calls |
| `conversation` | `Array<{ role: 'user' \| 'assistant'; content: string }>` | Multi-turn conversation history |
| `custom` | `Record<string, unknown>` | Arbitrary custom data |

### Helpers

| Function | Signature | Description |
|----------|-----------|-------------|
| `safeScore` | `(value: unknown) => number` | Clamp and validate a score to 0–1, default to 0.5 |
| `cleanAndParse` | `(response: string) => Record<string, unknown>` | Strip markdown fences and parse JSON |
| `parseFallback` | `(response: string) => ParsedJudgment` | Regex-based fallback when JSON parsing fails (sets confidence to 0.3) |

## Related Packages

- [`@reaatech/llm-judge-types`](https://www.npmjs.com/package/@reaatech/llm-judge-types) — Core types including `EvaluationCriteria` and `JudgmentTemplate` interface
- [`@reaatech/llm-judge-engine`](https://www.npmjs.com/package/@reaatech/llm-judge-engine) — Judgment engine that consumes templates

## License

[MIT](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
