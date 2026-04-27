import { z } from 'zod';
import { JudgmentSchema } from './judgment.js';

export const CacheConfigSchema = z.object({
  enabled: z.boolean().default(true),
  backend: z.enum(['memory', 'file', 'redis', 'database']).default('memory'),
  ttl: z.number().positive().default(86400000),
  maxSize: z.number().positive().default(10000),
  prefix: z.string().default('llm-judge:'),
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;

export const CacheItemSchema = z.object({
  judgment: JudgmentSchema,
  cachedAt: z.date(),
  expiresAt: z.date(),
  accessCount: z.number().int().min(0).default(0),
  lastAccessed: z.date().optional(),
});

export type CacheItem = z.infer<typeof CacheItemSchema>;

export interface CacheBackend {
  get(key: string): Promise<CacheItem | null>;
  set(key: string, item: CacheItem): Promise<void>;
  delete(key: string): Promise<void>;
  touch(key: string): Promise<void>;
  clear(): Promise<void>;
}
