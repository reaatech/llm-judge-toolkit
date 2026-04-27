import { describe, it, expect, vi } from 'vitest';
import { BatchProcessor } from './processor.js';
import { JudgmentEngine } from '../engine/judge.js';
import { FaithfulnessTemplate } from '../templates/faithfulness.js';
import type { LLMProvider, CompletionResponse } from '../types/provider.js';

function createMockProvider(responseContent: string): LLMProvider {
  return {
    name: 'mock',
    models: [],

    async generateCompletion(): Promise<CompletionResponse> {
      return {
        id: 'resp-1',
        model: 'mock-model',
        content: responseContent,
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        duration: 100,
      };
    },

    countTokens(text: string): number {
      return Math.ceil(text.length / 4);
    },

    calculateCost(usage) {
      return {
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        currency: 'USD',
      };
    },

    async checkHealth() {
      return { status: 'healthy' as const };
    },
  };
}

describe('BatchProcessor', () => {
  it('processes multiple items', async () => {
    const provider = createMockProvider(
      JSON.stringify({ score: 0.8, reasoning: 'OK', confidence: 0.7 }),
    );
    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model' },
    });

    const processor = new BatchProcessor({ engine, concurrency: 2 });
    const results = await processor.process([
      { id: '1', context: { query: 'Q1', response: 'A1', context: 'C1' } },
      { id: '2', context: { query: 'Q2', response: 'A2', context: 'C2' } },
      { id: '3', context: { query: 'Q3', response: 'A3', context: 'C3' } },
    ]);

    expect(results).toHaveLength(3);
    expect(results[0].id).toBe('1');
    expect(results[0].judgment?.score).toBe(0.8);
    expect(results[1].judgment?.score).toBe(0.8);
    expect(results[2].judgment?.score).toBe(0.8);
  });

  it('handles errors gracefully', async () => {
    const provider = createMockProvider('');
    provider.generateCompletion = async () => {
      throw new Error('Network error');
    };

    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 0 },
    });

    const processor = new BatchProcessor({ engine });
    const results = await processor.process([
      { id: '1', context: { query: 'Q1', response: 'A1', context: 'C1' } },
    ]);

    expect(results[0].judgment).toBeNull();
    expect(results[0].error).not.toBeNull();
    expect(results[0].error?.message).toContain('Network error');
  });

  it('reports progress', async () => {
    const provider = createMockProvider(
      JSON.stringify({ score: 0.8, reasoning: 'OK', confidence: 0.7 }),
    );
    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model' },
    });

    const onProgress = vi.fn();
    const processor = new BatchProcessor({ engine, concurrency: 1, onProgress });

    await processor.process([
      { id: '1', context: { query: 'Q1', response: 'A1', context: 'C1' } },
      { id: '2', context: { query: 'Q2', response: 'A2', context: 'C2' } },
    ]);

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenLastCalledWith(2, 2);
  });

  it('retries failed items', async () => {
    let attempts = 0;
    const provider = createMockProvider('');
    provider.generateCompletion = async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('rate limit exceeded');
      }
      return {
        id: 'resp-1',
        model: 'mock-model',
        content: JSON.stringify({ score: 0.8, reasoning: 'OK', confidence: 0.7 }),
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        duration: 100,
      };
    };

    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model' },
    });

    const processor = new BatchProcessor({ engine });
    const results = await processor.processWithRetry(
      [{ id: '1', context: { query: 'Q1', response: 'A1', context: 'C1' } }],
      { maxRetries: 2 },
    );

    expect(results[0].judgment?.score).toBe(0.8);
    expect(results[0].error).toBeNull();
  });

  it('does not retry non-retryable errors', async () => {
    let attempts = 0;
    const provider = createMockProvider('');
    provider.generateCompletion = async () => {
      attempts++;
      throw new Error('bad request');
    };

    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 0 },
    });

    const processor = new BatchProcessor({ engine });
    const results = await processor.processWithRetry(
      [{ id: '1', context: { query: 'Q1', response: 'A1', context: 'C1' } }],
      { maxRetries: 2 },
    );

    expect(attempts).toBe(1); // Not retryable, so no retry
    expect(results[0].error).not.toBeNull();
  });
});
