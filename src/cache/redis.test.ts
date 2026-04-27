import { describe, it, expect } from 'vitest';
import { RedisCache } from './redis.js';
import type { CacheItem } from '../types/cache.js';

function makeItem(): CacheItem {
  return {
    judgment: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      criteria: 'faithfulness',
      score: 0.9,
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
      timestamp: new Date('2024-01-01T00:00:00Z'),
      provider: 'test',
      model: 'test',
      templateVersion: '1.0.0',
    },
    cachedAt: new Date('2024-01-01T00:00:00Z'),
    expiresAt: new Date('2024-01-02T00:00:00Z'),
    accessCount: 0,
  };
}

function createMockRedis(): {
  store: Map<string, string>;
  redis: {
    get(key: string): Promise<string | null>;
    setex(key: string, seconds: number, value: string): Promise<void>;
    del(...keys: string[]): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    flushdb(): Promise<string>;
  };
} {
  const store = new Map<string, string>();
  return {
    store,
    redis: {
      async get(key: string) {
        return store.get(key) ?? null;
      },
      async setex(key: string, _seconds: number, value: string) {
        store.set(key, value);
      },
      async del(...keys: string[]) {
        for (const key of keys) {
          store.delete(key);
        }
        return keys.length;
      },
      async expire(key: string, _seconds: number) {
        return store.has(key) ? 1 : 0;
      },
      async keys(pattern: string) {
        if (pattern === 'llm-judge:*') {
          return Array.from(store.keys());
        }
        return Array.from(store.keys()).filter((k) => k.startsWith(pattern.replace('*', '')));
      },
      async flushdb() {
        store.clear();
        return 'OK';
      },
    },
  };
}

describe('RedisCache', () => {
  it('stores and retrieves items', async () => {
    const { redis } = createMockRedis();
    const cache = new RedisCache(redis);

    await cache.set('k1', makeItem());
    const got = await cache.get('k1');

    expect(got?.judgment.score).toBe(0.9);
    expect(got?.cachedAt).toBeInstanceOf(Date);
  });

  it('returns null for missing keys', async () => {
    const { redis } = createMockRedis();
    const cache = new RedisCache(redis);
    expect(await cache.get('missing')).toBeNull();
  });

  it('deletes items', async () => {
    const { redis, store } = createMockRedis();
    const cache = new RedisCache(redis);

    await cache.set('k1', makeItem());
    await cache.delete('k1');
    expect(store.has('k1')).toBe(false);
  });

  it('touches items', async () => {
    const { redis } = createMockRedis();
    const cache = new RedisCache(redis);

    await cache.set('k1', makeItem());
    await cache.touch('k1');
    expect(await cache.get('k1')).not.toBeNull();
  });

  it('clears all items', async () => {
    const { redis, store } = createMockRedis();
    const cache = new RedisCache(redis);

    await cache.set('a', makeItem());
    await cache.set('b', makeItem());
    await cache.clear();

    expect(store.size).toBe(0);
  });
});
