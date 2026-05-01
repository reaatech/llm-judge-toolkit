# Cache Implementation Skill

## Description
Implement multi-backend caching strategies for LLM judgments. This skill provides intelligent caching to avoid redundant API calls and reduce costs while maintaining correctness.

## Capabilities
- Implement in-memory caching for fast access
- Support Redis for distributed caching
- File-based caching for persistence
- Database caching (PostgreSQL, SQLite)
- Intelligent cache key generation
- Cache invalidation strategies
- Cache warming for common queries
- Cache analytics and hit rate tracking

## Invocation
```yaml
skill: cache-implementation
action: setup-cache
parameters:
  backend: redis
  ttl: 86400000
  maxSize: 10000
  prefix: llm-judge
```

## Examples

### Configure Multi-Backend Cache
```yaml
skill: cache-implementation
action: configure-backends
parameters:
  backends:
    - type: memory
      maxSize: 1000
      ttl: 3600000
    - type: redis
      host: localhost
      port: 6379
      ttl: 86400000
  strategy: hierarchical
```

### Cache Warming
```yaml
skill: cache-implementation
action: warm-cache
parameters:
  queries:
    - criteria: faithfulness
      templates: common
    - criteria: relevance
      templates: common
  priority: high-frequency
```

## Generated Code Examples

### Cache Manager
```typescript
// packages/cache/src/manager.ts
export class CacheManager {
  constructor(
    private backend: CacheBackend,
    private config: CacheConfig
  ) {}
  
  async get(key: string): Promise<Judgment | null> {
    const cached = await this.backend.get(key);
    if (!cached) return null;
    
    if (this.isExpired(cached)) {
      await this.backend.delete(key);
      return null;
    }
    
    await this.backend.touch(key);
    return cached;
  }
  
  async set(key: string, judgment: Judgment): Promise<void> {
    const item: CacheItem = {
      ...judgment,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.ttl),
      accessCount: 0
    };
    
    await this.backend.set(key, item);
  }
  
  private buildCacheKey(context: TemplateContext): string {
    const normalized = this.normalizeContext(context);
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
    return `judgment:${this.template.name}:${this.template.version}:${hash}`;
  }
}
```

### Cache Backends
```typescript
// packages/cache/src/backends.ts
export interface CacheBackend {
  get(key: string): Promise<CacheItem | null>;
  set(key: string, item: CacheItem): Promise<void>;
  delete(key: string): Promise<void>;
  touch(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class InMemoryCache implements CacheBackend {
  private store = new Map<string, CacheItem>();
  
  async get(key: string): Promise<CacheItem | null> {
    return this.store.get(key) || null;
  }
  
  async set(key: string, item: CacheItem): Promise<void> {
    this.store.set(key, item);
  }
  
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async touch(key: string): Promise<void> {
    const item = this.store.get(key);
    if (item) {
      item.lastAccessed = new Date();
      this.store.set(key, item);
    }
  }
  
  async clear(): Promise<void> {
    this.store.clear();
  }
}

export class RedisCache implements CacheBackend {
  constructor(private redis: Redis) {}
  
  async get(key: string): Promise<CacheItem | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set(key: string, item: CacheItem): Promise<void> {
    await this.redis.setex(key, 86400, JSON.stringify(item));
  }
  
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
  
  async touch(key: string): Promise<void> {
    await this.redis.expire(key, 86400);
  }
  
  async clear(): Promise<void> {
    await this.redis.flushdb();
  }
}
```

## Constraints
- Cache keys must be deterministic and collision-free
- TTL must be configurable per use case
- Cache must handle concurrent access safely
- Support cache invalidation by pattern
- Monitor cache hit rates and performance

## Best Practices
1. **Smart Key Generation**: Use content hashing for cache keys
2. **Appropriate TTL**: Set TTL based on content volatility
3. **Cache Invalidation**: Implement proper invalidation strategies
4. **Monitoring**: Track cache hit rates and performance
5. **Fallback**: Handle cache failures gracefully
6. **Size Limits**: Prevent unbounded cache growth
7. **Serialization**: Use efficient serialization formats
8. **Testing**: Test cache behavior under load

## Related Skills
- `cost-optimization` - For measuring cost savings from caching
- `provider-integration` - For caching provider responses
- `type-design` - For cache data structures
