# @reaatech/llm-judge-calibration

[![npm version](https://img.shields.io/npm/v/@reaatech/llm-judge-calibration.svg)](https://www.npmjs.com/package/@reaatech/llm-judge-calibration)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/llm-judge-toolkit/ci.yml?branch=main&label=CI)](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml)

> **Status:** Pre-1.0 — APIs may change in minor versions. Pin to a specific version in production.

Calibration suite for measuring LLM judge accuracy against human-labeled gold-standard datasets. Computes Cohen's kappa, confusion matrices, F1 scores, and detects calibration drift over time.

## Installation

```bash
npm install @reaatech/llm-judge-calibration
# or
pnpm add @reaatech/llm-judge-calibration
```

## Feature Overview

- Cohen's kappa inter-rater reliability coefficient
- Confusion matrix with precision/recall/F1 computation
- Bundled gold-standard datasets for 5 evaluation criteria
- CalibrationRunner for automated batch evaluation
- DriftDetector to detect performance regression
- Concurrency-controlled parallel execution

## Quick Start

```typescript
import { CalibrationRunner } from '@reaatech/llm-judge-calibration';
import { DatasetManager } from '@reaatech/llm-judge-calibration';

const runner = new CalibrationRunner({
  engine: judgmentEngine,
  criteria: 'faithfulness',
  concurrency: 5,
  onProgress: (done, total) => console.log(`${done}/${total}`),
});

const { report, judgments } = await runner.run();
console.log(report.cohensKappa, report.accuracy);
```

```typescript
import { CalibrationMetrics } from '@reaatech/llm-judge-calibration';

const report = CalibrationMetrics.generateReport(judgments, humanLabels);
console.log(report);
// { cohensKappa: 0.78, accuracy: 0.91, precision: 0.88, recall: 0.85, f1Score: 0.86, ... }
```

## API Reference

### CalibrationMetrics

Static class for computing calibration statistics.

| Method | Description |
|--------|-------------|
| `cohensKappa(judgments, humanLabels)` | Cohen's kappa inter-rater reliability coefficient |
| `confusionMatrix(judgments, humanLabels, thresholds?)` | 3-class confusion matrix |
| `accuracy(confusionMatrix)` | Overall accuracy from confusion matrix |
| `precisionRecallF1(confusionMatrix, positiveClass?)` | Precision, recall, and F1 score |
| `generateReport(judgments, humanLabels)` | Full `CalibrationReport` with all metrics |

### CalibrationRunner

| Constructor Option | Type | Description |
|-------------------|------|-------------|
| `engine` | `JudgmentEngine` | Engine to evaluate examples |
| `criteria` | `EvaluationCriteria` | Criteria to calibrate against |
| `concurrency` | `number` | Parallel evaluations (default 3) |
| `onProgress` | `(completed, total) => void` | Progress callback |

| Method | Description |
|--------|-------------|
| `run()` | Execute calibration and return `CalibrationRunnerResult` |

### DatasetManager

| Constructor | Description |
|-------------|-------------|
| `new DatasetManager(datasetsDir?)` | Optional custom directory for calibration JSON files |

| Method | Description |
|--------|-------------|
| `load(criteria)` | Load dataset JSON (`faithfulness.json`, etc.) |
| `loadAll()` | Load all criteria datasets as a Map |
| `getStats(dataset)` | Summary stats (total, good/bad/borderline, average label) |

### DriftDetector

| Constructor | Description |
|-------------|-------------|
| `new DriftDetector(kappaThreshold?, accuracyThreshold?)` | Thresholds for drift detection (default 0.1 each) |

| Method | Description |
|--------|-------------|
| `detect(baseline, current)` | Compare two reports, return `DriftReport` |

### Key Types

**CalibrationReport**

| Field | Type | Description |
|-------|------|-------------|
| `cohensKappa` | `number` | Inter-rater reliability coefficient |
| `accuracy` | `number` | Overall accuracy |
| `precision` | `number` | Positive class precision |
| `recall` | `number` | Positive class recall |
| `f1Score` | `number` | Harmonic mean of precision and recall |
| `confusionMatrix` | `ConfusionMatrix` | 3-class confusion matrix |

**CalibrationDataset**

| Field | Type | Description |
|-------|------|-------------|
| `criteria` | `EvaluationCriteria` | Evaluation criteria this dataset targets |
| `version` | `string` | Dataset version |
| `examples` | `CalibrationExample[]` | Array of labeled examples |

**DriftReport**

| Field | Type | Description |
|-------|------|-------------|
| `hasDrift` | `boolean` | Whether significant drift was detected |
| `kappaDelta` | `number` | Change in Cohen's kappa |
| `accuracyDelta` | `number` | Change in accuracy |
| `recommendation` | `string` | Actionable recommendation |

## Related Packages

- [`@reaatech/llm-judge-engine`](https://www.npmjs.com/package/@reaatech/llm-judge-engine) — `JudgmentEngine` consumed by CalibrationRunner
- [`@reaatech/llm-judge-types`](https://www.npmjs.com/package/@reaatech/llm-judge-types) — `CalibrationReport`, `ConfusionMatrix`, `EvaluationCriteria` types
- [`@reaatech/llm-judge-infra`](https://www.npmjs.com/package/@reaatech/llm-judge-infra) — `BatchProcessor` infrastructure utilities

## License

[MIT](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
