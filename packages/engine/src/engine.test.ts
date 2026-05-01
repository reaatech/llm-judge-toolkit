import { describe, it, expect } from 'vitest';
import {
  JudgmentEngine,
  InMemoryEventBus,
  RateLimiter,
} from './index.js';

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
