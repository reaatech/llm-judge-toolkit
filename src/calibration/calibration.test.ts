import { describe, it, expect } from 'vitest';
import { CalibrationMetrics } from './metrics.js';
import type { Judgment } from '../types/judgment.js';

function makeJudgment(score: number): Judgment {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    criteria: 'faithfulness',
    score,
    reasoning: 'test',
    confidence: 0.8,
    cost: {
      inputTokens: 10,
      outputTokens: 10,
      totalTokens: 20,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    },
    metadata: {},
    timestamp: new Date(),
    provider: 'test',
    model: 'test',
    templateVersion: '1.0.0',
  };
}

describe('CalibrationMetrics.cohensKappa', () => {
  it('returns 1.0 for perfect agreement', () => {
    const judgments = [makeJudgment(0.9), makeJudgment(0.2), makeJudgment(0.5)];
    const humanLabels = [0.9, 0.2, 0.5];

    const kappa = CalibrationMetrics.cohensKappa(judgments, humanLabels);
    expect(kappa).toBe(1);
  });

  it('returns lower value for partial agreement', () => {
    const judgments = [makeJudgment(0.9), makeJudgment(0.2), makeJudgment(0.9)];
    const humanLabels = [0.9, 0.2, 0.2];

    const kappa = CalibrationMetrics.cohensKappa(judgments, humanLabels);
    expect(kappa).toBeLessThan(1);
    expect(kappa).toBeGreaterThan(-1);
  });

  it('handles empty arrays', () => {
    expect(CalibrationMetrics.cohensKappa([], [])).toBe(0);
  });
});

describe('CalibrationMetrics.confusionMatrix', () => {
  it('builds a 3x3 matrix with default thresholds', () => {
    const judgments = [makeJudgment(0.1), makeJudgment(0.5), makeJudgment(0.9)];
    const humanLabels = [0.1, 0.5, 0.9];

    const cm = CalibrationMetrics.confusionMatrix(judgments, humanLabels);
    expect(cm.categories).toBe(3);
    expect(cm.matrix[0][0]).toBe(1);
    expect(cm.matrix[1][1]).toBe(1);
    expect(cm.matrix[2][2]).toBe(1);
  });
});

describe('CalibrationMetrics.accuracy', () => {
  it('computes accuracy', () => {
    const judgments = [makeJudgment(0.9), makeJudgment(0.2), makeJudgment(0.9)];
    const humanLabels = [0.9, 0.2, 0.2];

    const cm = CalibrationMetrics.confusionMatrix(judgments, humanLabels);
    const accuracy = CalibrationMetrics.accuracy(cm);
    expect(accuracy).toBeCloseTo(2 / 3, 2);
  });
});

describe('CalibrationMetrics.precisionRecallF1', () => {
  it('computes metrics for positive class', () => {
    const judgments = [makeJudgment(0.9), makeJudgment(0.9), makeJudgment(0.2)];
    const humanLabels = [0.9, 0.2, 0.2];

    const cm = CalibrationMetrics.confusionMatrix(judgments, humanLabels);
    const { precision, recall, f1Score } = CalibrationMetrics.precisionRecallF1(
      cm,
      2,
    );

    expect(precision).toBe(0.5);
    expect(recall).toBe(1);
    expect(f1Score).toBeCloseTo(0.667, 2);
  });
});

describe('CalibrationMetrics.generateReport', () => {
  it('generates a complete report', () => {
    const judgments = [makeJudgment(0.9), makeJudgment(0.2)];
    const humanLabels = [0.9, 0.2];

    const report = CalibrationMetrics.generateReport(judgments, humanLabels);

    expect(report.cohensKappa).toBe(1);
    expect(report.accuracy).toBe(1);
    expect(report.sampleSize).toBe(2);
    expect(report.timestamp).toBeInstanceOf(Date);
  });
});
