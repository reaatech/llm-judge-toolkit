import { describe, it, expect } from 'vitest';
import { RedisCache } from './redis.js';
import { CacheError } from '../errors.js';
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

function createFailingRedis(): {
  get(): Promise<never>;
  setex(): Promise<never>;
  del(): Promise<never>;
  expire(): Promise<never>;
  flushdb(): Promise<never>;
} {
  return {
    async get() {
      throw new Error('redis down');
    },
    async setex() {
      throw new Error('redis down');
    },
    async del() {
      throw new Error('redis down');
    },
    async expire() {
      throw new Error('redis down');
    },
    async flushdb() {
      throw new Error('redis down');
    },
  };
}

describe('RedisCache error paths', () => {
  it('throws CacheError on get failure', async () => {
    const cache = new RedisCache(createFailingRedis());
    await expect(cache.get('k')).rejects.toBeInstanceOf(CacheError);
    await expect(cache.get('k')).rejects.toThrow('Redis get failed');
  });

  it('throws CacheError on set failure', async () => {
    const cache = new RedisCache(createFailingRedis());
    await expect(cache.set('k', makeItem())).rejects.toBeInstanceOf(CacheError);
    await expect(cache.set('k', makeItem())).rejects.toThrow('Redis set failed');
  });

  it('throws CacheError on delete failure', async () => {
    const cache = new RedisCache(createFailingRedis());
    await expect(cache.delete('k')).rejects.toBeInstanceOf(CacheError);
    await expect(cache.delete('k')).rejects.toThrow('Redis delete failed');
  });

  it('throws CacheError on touch failure', async () => {
    const cache = new RedisCache(createFailingRedis());
    await expect(cache.touch('k')).rejects.toBeInstanceOf(CacheError);
    await expect(cache.touch('k')).rejects.toThrow('Redis touch failed');
  });

  it('throws CacheError on clear failure', async () => {
    const cache = new RedisCache(createFailingRedis());
    await expect(cache.clear()).rejects.toBeInstanceOf(CacheError);
    await expect(cache.clear()).rejects.toThrow('Redis clear failed');
  });
});
