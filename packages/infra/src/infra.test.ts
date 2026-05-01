import { describe, it, expect } from 'vitest';
import {
  CostTracker,
  MetricsCollector,
  BatchProcessor,
  logger,
  logJudgment,
  logError,
} from './index.js';

describe('@reaatech/llm-judge-infra', () => {
  it('should export CostTracker', () => {
    expect(CostTracker).toBeDefined();
  });

  it('should export MetricsCollector', () => {
    expect(MetricsCollector).toBeDefined();
  });

  it('should export BatchProcessor', () => {
    expect(BatchProcessor).toBeDefined();
  });

  it('should export logger', () => {
    expect(logger).toBeDefined();
  });

  it('should export logJudgment', () => {
    expect(logJudgment).toBeDefined();
  });

  it('should export logError', () => {
    expect(logError).toBeDefined();
  });
});
