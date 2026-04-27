import { describe, it, expect } from 'vitest';
import { RateLimiter } from './rate-limiter.js';

describe('RateLimiter', () => {
  it('allows requests within token budget', async () => {
    const limiter = new RateLimiter({ tokensPerInterval: 10, intervalMs: 1000 });

    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.getRemainingTokens()).toBeCloseTo(8, 0);
  });

  it('blocks requests when tokens are exhausted', () => {
    const limiter = new RateLimiter({ tokensPerInterval: 2, intervalMs: 1000 });

    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
    expect(limiter.getRemainingTokens()).toBe(0);
  });

  it('refills tokens over time', async () => {
    const limiter = new RateLimiter({ tokensPerInterval: 10, intervalMs: 100 });

    limiter.tryAcquire(); // 9 remaining
    limiter.tryAcquire(); // 8 remaining

    await new Promise((resolve) => setTimeout(resolve, 50));
    const remaining = limiter.getRemainingTokens();
    expect(remaining).toBeGreaterThan(8);
  });

  it('waits for tokens with acquire', async () => {
    const limiter = new RateLimiter({ tokensPerInterval: 1, intervalMs: 50 });

    limiter.tryAcquire(); // exhaust token
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it('respects max tokens cap', () => {
    const limiter = new RateLimiter({ tokensPerInterval: 5, intervalMs: 100, maxTokens: 3 });
    expect(limiter.getRemainingTokens()).toBe(3);
  });
});
