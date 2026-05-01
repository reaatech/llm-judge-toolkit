import type { Judgment } from '@reaatech/llm-judge-types';
import type { JudgmentEngine } from '@reaatech/llm-judge-engine';
import type { TemplateContext } from '@reaatech/llm-judge-templates';

export interface BatchItem {
  id: string;
  context: TemplateContext;
}

export interface BatchResult {
  id: string;
  judgment: Judgment | null;
  error: Error | null;
  duration: number;
}

export interface BatchProcessorOptions {
  engine: JudgmentEngine;
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
  onError?: (id: string, error: Error) => void;
}

export class BatchProcessor {
  private engine: JudgmentEngine;
  private concurrency: number;
  private onProgress?: (completed: number, total: number) => void;
  private onError?: (id: string, error: Error) => void;

  constructor(options: BatchProcessorOptions) {
    this.engine = options.engine;
    this.concurrency = options.concurrency ?? 3;
    this.onProgress = options.onProgress;
    this.onError = options.onError;
  }

  async process(items: BatchItem[]): Promise<BatchResult[]> {
    const total = items.length;
    const results: BatchResult[] = [];
    let completed = 0;

    const processItem = async (item: BatchItem): Promise<BatchResult> => {
      const start = Date.now();
      try {
        const judgment = await this.engine.judge(item.context);
        return {
          id: item.id,
          judgment,
          error: null,
          duration: Date.now() - start,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.onError?.(item.id, err);
        return {
          id: item.id,
          judgment: null,
          error: err,
          duration: Date.now() - start,
        };
      }
    };

    for (let i = 0; i < items.length; i += this.concurrency) {
      const chunk = items.slice(i, i + this.concurrency);
      const chunkResults = await Promise.all(chunk.map(processItem));
      results.push(...chunkResults);
      completed += chunkResults.length;
      this.onProgress?.(completed, total);
    }

    return results;
  }

  async processWithRetry(
    items: BatchItem[],
    retryOptions?: {
      maxRetries?: number;
      shouldRetry?: (error: Error) => boolean;
    },
  ): Promise<BatchResult[]> {
    const maxRetries = retryOptions?.maxRetries ?? 2;
    const shouldRetry =
      retryOptions?.shouldRetry ??
      ((error: Error) => {
        const msg = error.message.toLowerCase();
        return (
          msg.includes('rate limit') ||
          msg.includes('rate_limit') ||
          msg.includes('429') ||
          msg.includes('timeout') ||
          msg.includes('503') ||
          msg.includes('server error')
        );
      });

    const results = await this.process(items);

    const failed = results.filter((r) => r.error !== null);
    if (failed.length === 0 || maxRetries === 0) {
      return results;
    }

    const retryable = failed.filter((r) => r.error && shouldRetry(r.error));
    if (retryable.length === 0) {
      return results;
    }

    const retryItems: BatchItem[] = [];
    for (const r of retryable) {
      const item = items.find((item) => item.id === r.id);
      if (item) retryItems.push(item);
    }

    const retryResults = await this.processWithRetry(retryItems, {
      maxRetries: maxRetries - 1,
      shouldRetry,
    });

    const resultMap = new Map(results.map((r) => [r.id, r]));
    for (const retryResult of retryResults) {
      if (retryResult.error === null) {
        resultMap.set(retryResult.id, retryResult);
      }
    }

    return Array.from(resultMap.values());
  }
}
