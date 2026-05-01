# @reaatech/llm-judge-consensus

[![npm version](https://img.shields.io/npm/v/@reaatech/llm-judge-consensus.svg)](https://www.npmjs.com/package/@reaatech/llm-judge-consensus)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/llm-judge-toolkit/ci.yml?branch=main&label=CI)](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml)

> **Status:** Pre-1.0 — APIs may change in minor versions. Pin to a specific version in production.

Multi-judge consensus strategies for combining individual judgment scores into a final evaluation. Includes majority voting, weighted voting, and a cheap-first tiebreaker strategy to minimize API costs.

## Installation

```bash
npm install @reaatech/llm-judge-consensus
# or
pnpm add @reaatech/llm-judge-consensus
```

## Feature Overview

- Three consensus strategies implementing shared interface
- Confidence-weighted score aggregation
- Automatic agreement score computation using variance-based formula
- Cheap-first pattern uses N cheap model judgments with optional expensive tiebreakers
- Zero external dependencies beyond types

## Quick Start

```typescript
import { MajorityVoting, CheapFirstTiebreaker } from '@reaatech/llm-judge-consensus';

const strategy = new MajorityVoting();
const result = strategy.execute([judgment1, judgment2, judgment3]);

console.log(result.finalScore, result.agreementScore);
// 0.82, 0.94
```

```typescript
const cheapFirst = new CheapFirstTiebreaker(2);

const result = cheapFirst.execute([
  gpt4oMiniJudgment,
  gpt4oMiniJudgment2,
  gpt4oJudgment,    // tiebreaker — only used if cheap judges disagree
]);

console.log(result.tiebreakerUsed);
// false (or true if cheap judges disagreed)
```

## API Reference

### MajorityVoting

| Property | Description |
|----------|-------------|
| `strategy` | `majority-voting` — confidence-weighted average with agreement computation |
| `execute(judgments)` | Weight scores by confidence, return consensus |

### CheapFirstTiebreaker

| Property | Description |
|----------|-------------|
| `strategy` | `cheap-first-tiebreaker` |
| `constructor(cheapCount)` | `cheapCount` fast/cheap judgments to compare first (default 2) |
| `agreementThreshold` | 0.8 — escalate to remaining judges if cheap pair agreement is below this |
| `execute(judgments)` | Compare cheap pair; escalate to remaining judges if agreement < threshold |

### WeightedVoting

| Property | Description |
|----------|-------------|
| `strategy` | `weighted-voting` |
| `constructor(weights)` | User-defined weights array (must match `judgments.length`) |
| `execute(judgments)` | Weight scores by provided weights, return consensus |

### ConsensusStrategy Interface

| Member | Type | Description |
|--------|------|-------------|
| `name` | `string` | Strategy identifier |
| `execute(judgments)` | `(judgments: Judgment[]) => ConsensusResult` | Execute consensus on input judgments |

### ConsensusResult

| Field | Type | Description |
|-------|------|-------------|
| `finalScore` | `number` | Consensus score (0–1) |
| `agreementScore` | `number` | Inter-judge agreement (0–1) |
| `method` | `string` | Strategy name used |
| `individualJudgments` | `Judgment[]` | Input judgments |
| `tiebreakerUsed` | `boolean` | Whether escalation happened (CheapFirstTiebreaker) |

## Related Packages

- [`@reaatech/llm-judge-types`](https://www.npmjs.com/package/@reaatech/llm-judge-types) — `ConsensusStrategy`, `ConsensusResult`, `Judgment` types

## License

[MIT](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
