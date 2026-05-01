# @reaatech/llm-judge-bias

[![npm version](https://img.shields.io/npm/v/@reaatech/llm-judge-bias.svg)](https://www.npmjs.com/package/@reaatech/llm-judge-bias)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/llm-judge-toolkit/ci.yml?branch=main&label=CI)](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml)

> **Status:** Pre-1.0 — APIs may change in minor versions. Pin to a specific version in production.

Bias detection suite for identifying systematic biases in LLM judgments. Detects position bias (order effects), length bias (verbosity preference), and style bias (formatting/register effects).

## Installation

```bash
npm install @reaatech/llm-judge-bias
# or
pnpm add @reaatech/llm-judge-bias
```

## Feature Overview

- Position bias detection with original/swapped order comparison
- Length bias detection via Pearson correlation between response length and score
- Style bias detection comparing formal/casual/bullet-point transformations
- Automatic debiasing by averaging both orders
- ComprehensiveBiasDetector orchestrates all three detectors in one pass
- Configurable thresholds for each bias dimension

## Quick Start

```typescript
import { PositionBiasDetector } from '@reaatech/llm-judge-bias';

const detector = new PositionBiasDetector(0.1);

const report = await detector.detect(engine, [
  { id: 'a', content: 'Response A...' },
  { id: 'b', content: 'Response B...' },
]);

console.log(report.hasBias, report.recommendation);
```

```typescript
import { ComprehensiveBiasDetector } from '@reaatech/llm-judge-bias';

const detector = new ComprehensiveBiasDetector({
  positionThreshold: 0.1,
  lengthThreshold: 0.3,
  styleThreshold: 0.1,
});

const report = await detector.runAll(engine, {
  candidates: [{ id: 'a', content: '...' }, { id: 'b', content: '...' }],
  responses: [{ id: '1', content: '...' }],
  styleBaseResponse: 'Some response...',
  styleContext: { query: '...', response: '...', context: '...' },
});

console.log(report.hasBias, report.recommendation);
```

## API Reference

### PositionBiasDetector

| Export | Description |
|--------|-------------|
| `constructor(threshold)` | Create a detector with a sensitivity threshold (e.g. 0.1) |
| `detect(judge, candidates, context?)` | Compare original vs. swapped order scores |
| `debias(judge, candidates, context?)` | Return averaged judgment from both orders |

### LengthBiasDetector

| Export | Description |
|--------|-------------|
| `constructor(threshold)` | Create a detector with a sensitivity threshold (e.g. 0.3) |
| `detect(judge, responses[])` | Measure Pearson correlation between response length and score |

### StyleBiasDetector

| Export | Description |
|--------|-------------|
| `constructor(threshold)` | Create a detector with a sensitivity threshold (e.g. 0.1) |
| `detect(judge, baseResponse, context, styles?)` | Compare original vs. style-transformed scores |

### ComprehensiveBiasDetector

| Export | Description |
|--------|-------------|
| `constructor(options)` | Create with per-dimension thresholds |
| `detectPosition()` | Run position bias detection |
| `detectLength()` | Run length bias detection |
| `detectStyle()` | Run style bias detection |
| `runAll()` | Orchestrate all three detectors in one pass, return ComprehensiveBiasReport |

### Report Types

| Export | Description |
|--------|-------------|
| `PositionBiasReport` | `hasBias`, `averageBias`, `biasByPosition`, `recommendation` |
| `LengthBiasReport` | `hasBias`, `correlation`, `details[]` |
| `StyleBiasReport` | `hasBias`, `details[]` |
| `ComprehensiveBiasReport` | `hasBias`, `positionBias?`, `lengthBias?`, `styleBias?` |

### Default Style Transforms

| Export | Description |
|--------|-------------|
| `formal` | Rewrite response in formal/technical register |
| `casual` | Rewrite response in casual/conversational register |
| `bullet-points` | Rewrite response as a bullet-point list |

## Related Packages

- [`@reaatech/llm-judge-engine`](https://www.npmjs.com/package/@reaatech/llm-judge-engine) — JudgmentEngine consumed by detectors
- [`@reaatech/llm-judge-types`](https://www.npmjs.com/package/@reaatech/llm-judge-types) — Core type definitions

## License

[MIT](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
