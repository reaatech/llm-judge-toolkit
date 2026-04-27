import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCache } from './backends.js';
import { CacheManager } from './manager.js';
import type { Judgment } from '../types/judgment.js';

function makeJudgment(score: number): Judgment {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    criteria: 'faithfulness',
    score,
    reasoning: 'test',
    confidence: 0.5,
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
    timestamp: new Date(),
    provider: 'test',
    model: 'test',
    templateVersion: '1.0.0',
  };
}

describe('InMemoryCache', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache();
  });

  it('stores and retrieves items', async () => {
    const item = {
      judgment: makeJudgment(0.9),
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 10000),
      accessCount: 0,
    };

    await cache.set('key1', item);
    const retrieved = await cache.get('key1');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.judgment.score).toBe(0.9);
  });

  it('returns null for missing keys', async () => {
    const result = await cache.get('missing');
    expect(result).toBeNull();
  });

  it('returns null for expired items', async () => {
    const item = {
      judgment: makeJudgment(0.9),
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() - 1000),
      accessCount: 0,
    };

    await cache.set('expired', item);
    const retrieved = await cache.get('expired');
    expect(retrieved).toBeNull();
  });

  it('deletes items', async () => {
    const item = {
      judgment: makeJudgment(0.9),
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 10000),
      accessCount: 0,
    };

    await cache.set('del', item);
    await cache.delete('del');
    expect(await cache.get('del')).toBeNull();
  });

  it('clears all items', async () => {
    const item = {
      judgment: makeJudgment(0.9),
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 10000),
      accessCount: 0,
    };

    await cache.set('a', item);
    await cache.set('b', item);
    await cache.clear();

    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBeNull();
  });
});

describe('CacheManager', () => {
  it('builds consistent cache keys', () => {
    const manager = new CacheManager();

    const key1 = manager.buildCacheKey({
      provider: 'openai',
      model: 'gpt-4o',
      templateName: 'faithfulness',
      templateVersion: '1.0.0',
      context: { query: 'What?', response: 'Answer.' },
      temperature: 0.1,
    });

    const key2 = manager.buildCacheKey({
      provider: 'openai',
      model: 'gpt-4o',
      templateName: 'faithfulness',
      templateVersion: '1.0.0',
      context: { query: 'What?', response: 'Answer.' },
      temperature: 0.1,
    });

    expect(key1).toBe(key2);
  });

  it('builds different cache keys for different contexts', () => {
    const manager = new CacheManager();

    const key1 = manager.buildCacheKey({
      provider: 'openai',
      model: 'gpt-4o',
      templateName: 'faithfulness',
      templateVersion: '1.0.0',
      context: { query: 'What?', response: 'Answer A.' },
    });

    const key2 = manager.buildCacheKey({
      provider: 'openai',
      model: 'gpt-4o',
      templateName: 'faithfulness',
      templateVersion: '1.0.0',
      context: { query: 'What?', response: 'Answer B.' },
    });

    expect(key1).not.toBe(key2);
  });
});
