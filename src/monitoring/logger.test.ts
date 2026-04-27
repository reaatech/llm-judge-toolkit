import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logger,
  logJudgment,
  logError,
  logCacheHit,
  logCacheMiss,
  logBudgetExceeded,
} from './logger.js';
import type { Judgment } from '../types/judgment.js';

describe('logger functions', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});
    warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockJudgment: Judgment = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    criteria: 'faithfulness',
    score: 0.85,
    reasoning: 'Accurate',
    confidence: 0.9,
    cost: {
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      inputCost: 0.001,
      outputCost: 0.002,
      totalCost: 0.003,
      currency: 'USD',
    },
    metadata: { cached: true, duration: 120, retries: 0 },
    timestamp: new Date('2024-01-01T00:00:00Z'),
    provider: 'openai',
    model: 'gpt-4o-mini',
    templateVersion: '1.0.0',
  };

  it('logJudgment logs judgment info', () => {
    logJudgment(mockJudgment, 120);
    expect(infoSpy).toHaveBeenCalledOnce();
    const arg = infoSpy.mock.calls[0]![0] as Record<string, unknown>;
    expect(arg.event).toBe('judgment:completed');
    expect(arg.judgmentId).toBe(mockJudgment.id);
    expect(arg.score).toBe(0.85);
    expect(arg.duration).toBe(120);
    expect(arg.cached).toBe(true);
  });

  it('logError logs error details', () => {
    const err = new Error('Something broke');
    logError(err, { extra: 'data' });
    expect(errorSpy).toHaveBeenCalledOnce();
    const arg = errorSpy.mock.calls[0]![0] as Record<string, unknown>;
    expect(arg.event).toBe('error');
    expect(arg.errorType).toBe('Error');
    expect(arg.errorMessage).toBe('Something broke');
    expect(arg.extra).toBe('data');
  });

  it('logCacheHit logs debug event', () => {
    logCacheHit('j1');
    expect(debugSpy).toHaveBeenCalledOnce();
    const arg = debugSpy.mock.calls[0]![0] as Record<string, unknown>;
    expect(arg.event).toBe('cache:hit');
    expect(arg.judgmentId).toBe('j1');
  });

  it('logCacheMiss logs debug event', () => {
    logCacheMiss('key-abc');
    expect(debugSpy).toHaveBeenCalledOnce();
    const arg = debugSpy.mock.calls[0]![0] as Record<string, unknown>;
    expect(arg.event).toBe('cache:miss');
    expect(arg.cacheKey).toBe('key-abc');
  });

  it('logBudgetExceeded logs warning with ratio', () => {
    logBudgetExceeded(100, 80);
    expect(warnSpy).toHaveBeenCalledOnce();
    const arg = warnSpy.mock.calls[0]![0] as Record<string, unknown>;
    expect(arg.event).toBe('budget:exceeded');
    expect(arg.current).toBe(100);
    expect(arg.limit).toBe(80);
    expect(arg.ratio).toBe(1.25);
  });
});
