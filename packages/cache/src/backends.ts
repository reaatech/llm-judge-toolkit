import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import type { CacheBackend, CacheItem } from '@reaatech/llm-judge-types';

export class InMemoryCache implements CacheBackend {
  private store = new Map<string, CacheItem>();
  private maxSize: number;

  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
  }

  async get(key: string): Promise<CacheItem | null> {
    const item = this.store.get(key);
    if (!item) return null;

    if (item.expiresAt < new Date()) {
      this.store.delete(key);
      return null;
    }

    return item;
  }

  async set(key: string, item: CacheItem): Promise<void> {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      let oldestKey = '';
      let oldestTime = Number.POSITIVE_INFINITY;
      for (const [k, v] of this.store) {
        const t = v.cachedAt.getTime();
        if (t < oldestTime) {
          oldestTime = t;
          oldestKey = k;
        }
      }
      if (oldestKey) this.store.delete(oldestKey);
    }
    this.store.set(key, item);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async touch(key: string): Promise<void> {
    const item = this.store.get(key);
    if (item) {
      item.lastAccessed = new Date();
      item.accessCount = (item.accessCount ?? 0) + 1;
      this.store.set(key, item);
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

export class FileCache implements CacheBackend {
  private dir: string;

  constructor(dir = '.cache/llm-judge') {
    this.dir = dir;
  }

  private path(key: string): string {
    const hash = createHash('sha256').update(key).digest('hex');
    return join(this.dir, `${hash}.json`);
  }

  async get(key: string): Promise<CacheItem | null> {
    const filePath = this.path(key);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const item = JSON.parse(data, (k, v) => {
        if (k === 'cachedAt' || k === 'expiresAt' || k === 'lastAccessed' || k === 'timestamp') {
          return new Date(v);
        }
        return v;
      }) as CacheItem;

      if (item.expiresAt < new Date()) {
        await fs.unlink(filePath).catch(() => {});
        return null;
      }

      return item;
    } catch {
      return null;
    }
  }

  async set(key: string, item: CacheItem): Promise<void> {
    const filePath = this.path(key);

    await fs.mkdir(dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(item), 'utf-8');
    await fs.rename(tempPath, filePath);
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.path(key));
    } catch {
      // ignore
    }
  }

  async touch(key: string): Promise<void> {
    const item = await this.get(key);
    if (item) {
      item.lastAccessed = new Date();
      item.accessCount = (item.accessCount ?? 0) + 1;
      await this.set(key, item);
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.dir);
      const results = await Promise.allSettled(
        files.map((f: string) => fs.unlink(join(this.dir, f))),
      );
      const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(
          `Failed to clear ${failed.length}/${files.length} cache files: ${failed[0]?.reason}`,
        );
      }
    } catch (error) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
  }
}
