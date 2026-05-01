import { describe, expect, it } from 'vitest';
import { CacheManager, FileCache, InMemoryCache, RedisCache } from './index.js';

describe('@reaatech/llm-judge-cache', () => {
  it('should export CacheManager', () => {
    expect(CacheManager).toBeDefined();
  });

  it('should export InMemoryCache', () => {
    expect(InMemoryCache).toBeDefined();
  });

  it('should export FileCache', () => {
    expect(FileCache).toBeDefined();
  });

  it('should export RedisCache', () => {
    expect(RedisCache).toBeDefined();
  });
});
