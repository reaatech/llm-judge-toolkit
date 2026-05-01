# @reaatech/llm-judge-cache

[![npm version](https://img.shields.io/npm/v/@reaatech/llm-judge-cache.svg)](https://www.npmjs.com/package/@reaatech/llm-judge-cache)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/llm-judge-toolkit/ci.yml?branch=main&label=CI)](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml)

> **Status:** Pre-1.0 — APIs may change in minor versions. Pin to a specific version in production.

Multi-backend caching system for judgment results with SHA-256 content-addressed keys, TTL-based expiration, and atomic file writes. Supports in-memory, file-system, and Redis backends.

## Installation

```bash
npm install @reaatech/llm-judge-cache
# or
pnpm add @reaatech/llm-judge-cache
```

## Feature Overview

- Three CacheBackend implementations (InMemoryCache with LRU eviction, FileCache with atomic writes via tmp+rename, RedisCache with configurable TTL)
- CacheManager facade with get/set/delete/clear
- SHA-256 content-addressed cache keys from normalized context
- Configurable TTL with automatic expiration
- Pluggable backend architecture via CacheBackend interface

## Quick Start

```typescript
import { CacheManager, InMemoryCache } from '@reaatech/llm-judge-cache';

const cache = new CacheManager(new InMemoryCache(10000), {
  enabled: true,
  backend: 'memory',
  ttl: 86400000,
});

const key = cache.buildCacheKey({
  provider: 'openai',
  model: 'gpt-4o-mini',
  templateName: 'faithfulness',
  templateVersion: '1.0.0',
  context: { query: '...', response: '...', context: '...' },
});

await cache.set(key, judgment);
const cached = await cache.get(key);
console.log(cached?.score);
```

## API Reference

### CacheManager

| Export | Description |
|--------|-------------|
| `constructor(backend?, config?)` | Create with optional backend and config |
| `get(key)` | Retrieve a cached judgment (null if expired or missing) |
| `set(key, judgment)` | Store a judgment with TTL |
| `delete(key)` | Remove a specific entry |
| `clear()` | Remove all entries |
| `buildCacheKey(params)` | Build deterministic SHA-256 key from provider, model, template, version, and context |

### InMemoryCache

| Export | Description |
|--------|-------------|
| `constructor(maxSize?)` | Max entries (default 10000), LRU eviction |
| `get` | Retrieve CacheItem or null |
| `set` | Store CacheItem |
| `delete` | Remove entry |
| `touch` | Update access count and timestamp |
| `clear` | Remove all entries |

### FileCache

| Export | Description |
|--------|-------------|
| `constructor(dir?)` | Directory path (default `.cache/llm-judge`) |
| `get` | Retrieve CacheItem or null |
| `set` | Store CacheItem (atomic write via temp file + rename) |
| `delete` | Remove entry |
| `touch` | Update access count and timestamp |
| `clear` | Remove all entries |

### RedisCache

| Export | Description |
|--------|-------------|
| `constructor(redis, ttlSeconds?, prefix?)` | Requires a RedisLike interface (e.g. ioredis) |
| `get` | Retrieve CacheItem or null |
| `set` | Store CacheItem with configurable TTL |
| `delete` | Remove entry |
| `touch` | Update access count and timestamp |
| `clear` | Remove all entries |

### CacheBackend Interface

| Export | Description |
|--------|-------------|
| `get()` | Retrieve a CacheItem by key |
| `set()` | Store a CacheItem by key |
| `delete()` | Remove an entry by key |
| `touch()` | Update access metadata by key |
| `clear()` | Remove all entries |

## Related Packages

- [`@reaatech/llm-judge-types`](https://www.npmjs.com/package/@reaatech/llm-judge-types) — Core type definitions
- [`@reaatech/llm-judge-engine`](https://www.npmjs.com/package/@reaatech/llm-judge-engine) — JudgmentEngine with cache integration

## License

[MIT](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
