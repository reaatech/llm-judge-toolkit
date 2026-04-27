import { describe, it, expect } from 'vitest';
import { MetricsCollector } from './metrics.js';

describe('MetricsCollector', () => {
  it('records judgments', () => {
    const metrics = new MetricsCollector();
    metrics.recordJudgment(0.8, 100, 0.001, false);
    metrics.recordJudgment(0.9, 200, 0.002, true);

    const snapshot = metrics.snapshot();
    expect(snapshot.judgmentsTotal).toBe(2);
    expect(snapshot.judgmentsCached).toBe(1);
    expect(snapshot.averageLatency).toBe(150);
    expect(snapshot.averageScore).toBeCloseTo(0.85, 10);
    expect(snapshot.totalCost).toBe(0.003);
    expect(snapshot.cacheHitRate).toBe(0.5);
  });

  it('records failures', () => {
    const metrics = new MetricsCollector();
    metrics.recordFailure();
    metrics.recordFailure();

    const snapshot = metrics.snapshot();
    expect(snapshot.judgmentsFailed).toBe(2);
  });

  it('handles empty state', () => {
    const metrics = new MetricsCollector();
    const snapshot = metrics.snapshot();

    expect(snapshot.judgmentsTotal).toBe(0);
    expect(snapshot.averageLatency).toBe(0);
    expect(snapshot.averageScore).toBe(0);
    expect(snapshot.cacheHitRate).toBe(0);
  });

  it('resets metrics', () => {
    const metrics = new MetricsCollector();
    metrics.recordJudgment(0.8, 100, 0.001, false);
    metrics.reset();

    const snapshot = metrics.snapshot();
    expect(snapshot.judgmentsTotal).toBe(0);
  });

  it('tracks cache hits and misses separately', () => {
    const metrics = new MetricsCollector();
    metrics.recordCacheHit();
    metrics.recordCacheHit();
    metrics.recordCacheMiss();

    const snapshot = metrics.snapshot();
    expect(snapshot.cacheHitRate).toBe(2 / 3);
  });
});
