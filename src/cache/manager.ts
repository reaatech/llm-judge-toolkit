import { createHash } from 'crypto';
import type { CacheBackend, CacheConfig, CacheItem } from '../types/cache.js';
import type { Judgment } from '../types/judgment.js';
import type { TemplateContext } from '../templates/base.js';
import { InMemoryCache } from './backends.js';
import { CacheError } from '../errors.js';

export class CacheManager {
  private backend: CacheBackend;
  private config: CacheConfig;

  constructor(backend?: CacheBackend, config?: CacheConfig) {
    this.backend = backend ?? new InMemoryCache();
    this.config = config ?? {
      enabled: true,
      backend: 'memory',
      ttl: 86400000,
      maxSize: 10000,
      prefix: 'llm-judge:',
    };
  }

  async get(key: string): Promise<Judgment | null> {
    if (!this.config.enabled) return null;

    const prefixed = this.prefixedKey(key);

    try {
      const cached = await this.backend.get(prefixed);
      if (!cached) return null;

      if (this.isExpired(cached)) {
        await this.backend.delete(prefixed);
        return null;
      }

      await this.backend.touch(prefixed);
      return cached.judgment;
    } catch (error) {
      throw new CacheError(
        `Cache get failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  async set(key: string, judgment: Judgment): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const item: CacheItem = {
        judgment,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.ttl),
        accessCount: 0,
      };

      await this.backend.set(this.prefixedKey(key), item);
    } catch (error) {
      throw new CacheError(
        `Cache set failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.backend.delete(this.prefixedKey(key));
    } catch (error) {
      throw new CacheError(
        `Cache delete failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  async clear(): Promise<void> {
    try {
      await this.backend.clear();
    } catch (error) {
      throw new CacheError(
        `Cache clear failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  }

  buildCacheKey(params: {
    provider: string;
    model: string;
    templateName: string;
    templateVersion: string;
    context: TemplateContext;
    temperature?: number;
  }): string {
    const normalized = this.normalizeContext(params.context);
    const hash = createHash('sha256')
      .update(
        JSON.stringify({
          provider: params.provider,
          model: params.model,
          template: params.templateName,
          version: params.templateVersion,
          context: normalized,
          temperature: params.temperature ?? 0.1,
        }),
      )
      .digest('hex');

    return `${params.templateName}:${params.templateVersion}:${hash}`;
  }

  private prefixedKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  private isExpired(item: CacheItem): boolean {
    return item.expiresAt < new Date();
  }

  private normalizeContext(context: TemplateContext): TemplateContext {
    return {
      query: context.query?.trim(),
      response: context.response?.trim(),
      context: context.context?.trim(),
      candidates: context.candidates
        ?.map((c) => ({ id: c.id, content: c.content.trim() }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      toolCalls: context.toolCalls
        ?.map((t) => ({ name: t.name, arguments: t.arguments }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      toolOutputs: context.toolOutputs,
      conversation: context.conversation?.map((m) => ({ role: m.role, content: m.content.trim() })),
      custom: context.custom,
    };
  }
}
