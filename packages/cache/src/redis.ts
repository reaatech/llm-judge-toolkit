import type { CacheBackend, CacheItem } from '@reaatech/llm-judge-types';
import { CacheError } from '@reaatech/llm-judge-types';

interface RedisLike {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string | undefined>;
  del(...keys: string[]): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  keys(pattern: string): Promise<string[]>;
}

export class RedisCache implements CacheBackend {
  private redis: RedisLike;
  private ttlSeconds: number;
  private prefix: string;

  constructor(redis: RedisLike, ttlSeconds = 86400, prefix = 'llm-judge:') {
    this.redis = redis;
    this.ttlSeconds = ttlSeconds;
    this.prefix = prefix;
  }

  private prefixed(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<CacheItem | null> {
    try {
      const data = await this.redis.get(this.prefixed(key));
      if (!data) return null;
      const parsed = JSON.parse(data);
      return reviveCacheItem(parsed);
    } catch (error) {
      throw new CacheError(
        `Redis get failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  async set(key: string, item: CacheItem): Promise<void> {
    try {
      await this.redis.setex(this.prefixed(key), this.ttlSeconds, JSON.stringify(item));
    } catch (error) {
      throw new CacheError(
        `Redis set failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.prefixed(key));
    } catch (error) {
      throw new CacheError(
        `Redis delete failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  async touch(key: string): Promise<void> {
    try {
      await this.redis.expire(this.prefixed(key), this.ttlSeconds);
    } catch (error) {
      throw new CacheError(
        `Redis touch failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      throw new CacheError(
        `Redis clear failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }
}

function reviveCacheItem(parsed: Record<string, unknown>): CacheItem {
  return {
    ...parsed,
    cachedAt: parsed.cachedAt ? new Date(parsed.cachedAt as string) : new Date(),
    expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt as string) : new Date(),
    lastAccessed: parsed.lastAccessed ? new Date(parsed.lastAccessed as string) : undefined,
  } as unknown as CacheItem;
}
