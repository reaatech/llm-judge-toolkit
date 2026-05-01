import { describe, expect, it } from 'vitest';
import { CalibrationMetrics, CalibrationRunner, DatasetManager, DriftDetector } from './index.js';

describe('@reaatech/llm-judge-calibration', () => {
  it('should export CalibrationMetrics', () => {
    expect(CalibrationMetrics).toBeDefined();
  });

  it('should export CalibrationRunner', () => {
    expect(CalibrationRunner).toBeDefined();
  });

  it('should export DatasetManager', () => {
    expect(DatasetManager).toBeDefined();
  });

  it('should export DriftDetector', () => {
    expect(DriftDetector).toBeDefined();
  });
});
