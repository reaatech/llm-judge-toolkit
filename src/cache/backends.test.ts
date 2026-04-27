import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { InMemoryCache, FileCache } from './backends.js';
import type { CacheItem } from '../types/cache.js';
import type { Judgment } from '../types/judgment.js';

function makeItem(score: number): CacheItem {
  return {
    judgment: {
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
    } as Judgment,
    cachedAt: new Date(),
    expiresAt: new Date(Date.now() + 10000),
    accessCount: 0,
  };
}

describe('InMemoryCache', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache();
  });

  it('stores and retrieves', async () => {
    await cache.set('k1', makeItem(0.9));
    const got = await cache.get('k1');
    expect(got?.judgment.score).toBe(0.9);
  });

  it('returns null for missing keys', async () => {
    expect(await cache.get('missing')).toBeNull();
  });

  it('returns null for expired items', async () => {
    const item = makeItem(0.9);
    item.expiresAt = new Date(Date.now() - 1000);
    await cache.set('exp', item);
    expect(await cache.get('exp')).toBeNull();
  });

  it('deletes items', async () => {
    await cache.set('k1', makeItem(0.9));
    await cache.delete('k1');
    expect(await cache.get('k1')).toBeNull();
  });

  it('touches items', async () => {
    await cache.set('k1', makeItem(0.9));
    await cache.touch('k1');
    const got = await cache.get('k1');
    expect(got?.lastAccessed).toBeInstanceOf(Date);
    expect(got?.accessCount).toBe(1);
  });

  it('clears all', async () => {
    await cache.set('a', makeItem(0.9));
    await cache.set('b', makeItem(0.8));
    await cache.clear();
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBeNull();
  });
});

describe('FileCache', () => {
  let tmpDir: string;
  let cache: FileCache;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'llm-judge-test-'));
    cache = new FileCache(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('stores and retrieves', async () => {
    await cache.set('k1', makeItem(0.9));
    const got = await cache.get('k1');
    expect(got?.judgment.score).toBe(0.9);
  });

  it('returns null for missing keys', async () => {
    expect(await cache.get('missing')).toBeNull();
  });

  it('returns null for expired items', async () => {
    const item = makeItem(0.9);
    item.expiresAt = new Date(Date.now() - 1000);
    await cache.set('exp', item);
    expect(await cache.get('exp')).toBeNull();
  });

  it('deletes items', async () => {
    await cache.set('k1', makeItem(0.9));
    await cache.delete('k1');
    expect(await cache.get('k1')).toBeNull();
  });

  it('touches items', async () => {
    await cache.set('k1', makeItem(0.9));
    await cache.touch('k1');
    const got = await cache.get('k1');
    expect(got?.lastAccessed).toBeInstanceOf(Date);
    expect(got?.accessCount).toBe(1);
  });

  it('clears all', async () => {
    await cache.set('a', makeItem(0.9));
    await cache.set('b', makeItem(0.8));
    await cache.clear();
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBeNull();
  });
});
