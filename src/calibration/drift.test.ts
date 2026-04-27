import { describe, it, expect } from 'vitest';
import { DriftDetector } from './drift.js';

describe('DriftDetector', () => {
  it('detects no drift when metrics are stable', () => {
    const baseline = {
      cohensKappa: 0.8,
      accuracy: 0.85,
      precision: 0.8,
      recall: 0.8,
      f1Score: 0.8,
      confusionMatrix: { matrix: [[1]], categories: 1, thresholds: [] },
      sampleSize: 100,
      timestamp: new Date(),
    };

    const current = {
      cohensKappa: 0.78,
      accuracy: 0.84,
      precision: 0.8,
      recall: 0.8,
      f1Score: 0.8,
      confusionMatrix: { matrix: [[1]], categories: 1, thresholds: [] },
      sampleSize: 100,
      timestamp: new Date(),
    };

    const detector = new DriftDetector();
    const report = detector.detect(baseline, current);

    expect(report.hasDrift).toBe(false);
    expect(report.cohensKappaDelta).toBeCloseTo(0.02, 3);
  });

  it('detects drift when kappa drops significantly', () => {
    const baseline = {
      cohensKappa: 0.8,
      accuracy: 0.85,
      precision: 0.8,
      recall: 0.8,
      f1Score: 0.8,
      confusionMatrix: { matrix: [[1]], categories: 1, thresholds: [] },
      sampleSize: 100,
      timestamp: new Date(),
    };

    const current = {
      cohensKappa: 0.6,
      accuracy: 0.85,
      precision: 0.8,
      recall: 0.8,
      f1Score: 0.8,
      confusionMatrix: { matrix: [[1]], categories: 1, thresholds: [] },
      sampleSize: 100,
      timestamp: new Date(),
    };

    const detector = new DriftDetector();
    const report = detector.detect(baseline, current);

    expect(report.hasDrift).toBe(true);
    expect(report.cohensKappaDelta).toBeCloseTo(0.2, 10);
  });

  it('detects drift when accuracy drops significantly', () => {
    const baseline = {
      cohensKappa: 0.8,
      accuracy: 0.9,
      precision: 0.8,
      recall: 0.8,
      f1Score: 0.8,
      confusionMatrix: { matrix: [[1]], categories: 1, thresholds: [] },
      sampleSize: 100,
      timestamp: new Date(),
    };

    const current = {
      cohensKappa: 0.8,
      accuracy: 0.7,
      precision: 0.8,
      recall: 0.8,
      f1Score: 0.8,
      confusionMatrix: { matrix: [[1]], categories: 1, thresholds: [] },
      sampleSize: 100,
      timestamp: new Date(),
    };

    const detector = new DriftDetector();
    const report = detector.detect(baseline, current);

    expect(report.hasDrift).toBe(true);
    expect(report.accuracyDelta).toBeCloseTo(0.2, 10);
  });
});
