import { describe, expect, it } from 'vitest';
import { InMemoryEventBus, JudgmentEngine, RateLimiter } from './index.js';

describe('@reaatech/llm-judge-engine', () => {
  it('should export JudgmentEngine', () => {
    expect(JudgmentEngine).toBeDefined();
  });

  it('should export InMemoryEventBus', () => {
    expect(InMemoryEventBus).toBeDefined();
  });

  it('should export RateLimiter', () => {
    expect(RateLimiter).toBeDefined();
  });
});
