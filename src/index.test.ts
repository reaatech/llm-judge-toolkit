import { describe, it, expect } from 'vitest';

// Re-import everything to ensure barrel exports resolve
import * as index from './index.js';

describe('barrel exports', () => {
  it('exports all core classes', () => {
    expect(index.OpenAIProvider).toBeDefined();
    expect(index.AnthropicProvider).toBeDefined();
    expect(index.LocalProvider).toBeDefined();
    expect(index.ProviderFactory).toBeDefined();

    expect(index.FaithfulnessTemplate).toBeDefined();
    expect(index.RelevanceTemplate).toBeDefined();
    expect(index.CoherenceTemplate).toBeDefined();
    expect(index.SafetyTemplate).toBeDefined();
    expect(index.ToolUseTemplate).toBeDefined();

    expect(index.CacheManager).toBeDefined();
    expect(index.InMemoryCache).toBeDefined();
    expect(index.FileCache).toBeDefined();
    expect(index.RedisCache).toBeDefined();

    expect(index.JudgmentEngine).toBeDefined();
    expect(index.BatchProcessor).toBeDefined();
    expect(index.CostTracker).toBeDefined();

    expect(index.MajorityVoting).toBeDefined();
    expect(index.CheapFirstTiebreaker).toBeDefined();
    expect(index.WeightedVoting).toBeDefined();

    expect(index.CalibrationMetrics).toBeDefined();
    expect(index.DatasetManager).toBeDefined();
    expect(index.CalibrationRunner).toBeDefined();
    expect(index.DriftDetector).toBeDefined();

    expect(index.MetricsCollector).toBeDefined();
    expect(index.RateLimiter).toBeDefined();

    expect(index.PositionBiasDetector).toBeDefined();
    expect(index.LengthBiasDetector).toBeDefined();
    expect(index.StyleBiasDetector).toBeDefined();
    expect(index.ComprehensiveBiasDetector).toBeDefined();

    expect(index.JudgeError).toBeDefined();
    expect(index.ProviderError).toBeDefined();
    expect(index.ValidationError).toBeDefined();
    expect(index.BudgetExceededError).toBeDefined();
    expect(index.TemplateError).toBeDefined();
    expect(index.CacheError).toBeDefined();
  });

  it('exports logger helpers', () => {
    expect(typeof index.logger).toBe('object');
    expect(typeof index.logJudgment).toBe('function');
    expect(typeof index.logError).toBe('function');
    expect(typeof index.logCacheHit).toBe('function');
    expect(typeof index.logCacheMiss).toBe('function');
    expect(typeof index.logBudgetExceeded).toBe('function');
  });
});
