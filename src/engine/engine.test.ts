import { describe, it, expect, vi } from 'vitest';
import { JudgmentEngine } from './judge.js';
import { FaithfulnessTemplate } from '../templates/faithfulness.js';
import type { LLMProvider, CompletionResponse, TokenUsage } from '../types/provider.js';

function createMockProvider(responseContent: string): LLMProvider {
  return {
    name: 'mock',
    models: [],

    async generateCompletion(): Promise<CompletionResponse> {
      return {
        id: 'resp-1',
        model: 'mock-model',
        content: responseContent,
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
        duration: 100,
      };
    },

    countTokens(text: string): number {
      return Math.ceil(text.length / 4);
    },

    calculateCost(usage: TokenUsage) {
      return {
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        inputCost: 0.001,
        outputCost: 0.002,
        totalCost: 0.003,
        currency: 'USD',
      };
    },

    async checkHealth() {
      return { status: 'healthy' as const };
    },
  };
}

describe('JudgmentEngine', () => {
  it('evaluates a response and returns a judgment', async () => {
    const provider = createMockProvider(
      JSON.stringify({
        score: 0.95,
        reasoning: 'Fully supported by context',
        confidence: 0.9,
        unsupported_claims: [],
      }),
    );

    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model' },
    });

    const result = await engine.judge({
      query: 'What is the capital?',
      response: 'Paris',
      context: 'The capital of France is Paris.',
    });

    expect(result.score).toBe(0.95);
    expect(result.confidence).toBe(0.9);
    expect(result.reasoning).toBe('Fully supported by context');
    expect(result.provider).toBe('mock');
    expect(result.model).toBe('mock-model');
    expect(result.criteria).toBe('faithfulness');
    expect(result.cost.totalCost).toBe(0.003);
  });

  it('retries on provider failure', async () => {
    let attempts = 0;
    const provider = createMockProvider('');
    const { ProviderError } = await import('../errors.js');

    provider.generateCompletion = async (): Promise<CompletionResponse> => {
      attempts++;
      if (attempts < 2) {
        throw new ProviderError('Network error', 'mock');
      }
      return {
        id: 'resp-1',
        model: 'mock-model',
        content: JSON.stringify({ score: 0.8, reasoning: 'OK', confidence: 0.7 }),
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        duration: 50,
      };
    };

    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 3, retryDelay: 10 },
    });

    const result = await engine.judge({
      query: 'What?',
      response: 'Answer',
      context: 'Source',
    });

    expect(attempts).toBe(2);
    expect(result.score).toBe(0.8);
  });

  it('throws after exhausting retries', async () => {
    const provider = createMockProvider('');
    provider.generateCompletion = async () => {
      throw new Error('Persistent error');
    };

    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 1, retryDelay: 10 },
    });

    await expect(
      engine.judge({
        query: 'What?',
        response: 'Answer',
        context: 'Source',
      }),
    ).rejects.toThrow('Persistent error');
  });

  it('uses cache when enabled', async () => {
    const provider = createMockProvider(
      JSON.stringify({ score: 0.9, reasoning: 'Good', confidence: 0.8 }),
    );

    const generateSpy = vi.spyOn(provider, 'generateCompletion');

    const { CacheManager } = await import('../cache/manager.js');
    const cache = new CacheManager();

    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      cache,
      config: { model: 'mock-model', cacheEnabled: true },
    });

    const context = {
      query: 'What?',
      response: 'Answer',
      context: 'Source',
    };

    const result1 = await engine.judge(context);
    const result2 = await engine.judge(context);

    expect(result1.score).toBe(0.9);
    expect(result2.score).toBe(0.9);
    expect(generateSpy).toHaveBeenCalledTimes(1);
  });
});
