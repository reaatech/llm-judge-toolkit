import { describe, it, expect } from 'vitest';
import { ComprehensiveBiasDetector } from './comprehensive.js';
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

describe('ComprehensiveBiasDetector', () => {
  it('runs all bias checks', async () => {
    const provider = createMockProvider(
      JSON.stringify({ score: 0.8, reasoning: 'OK', confidence: 0.7 }),
    );
    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 0 },
    });

    const detector = new ComprehensiveBiasDetector();
    const report = await detector.runAll(engine, {
      candidates: [
        { id: 'a', content: 'Answer A' },
        { id: 'b', content: 'Answer B' },
      ],
      candidateContext: { context: 'Source', response: 'Answer' },
      responses: [
        { id: '1', content: 'Short.', context: { context: 'Source', response: 'Short.' } },
        {
          id: '2',
          content: 'A much longer response with many words.',
          context: { context: 'Source', response: 'Long.' },
        },
      ],
      styleBaseResponse: 'This is a response.',
      styleContext: { context: 'Source', response: 'This is a response.' },
    });

    expect(report.positionBias).toBeDefined();
    expect(report.lengthBias).toBeDefined();
    expect(report.styleBias).toBeDefined();
  });

  it('skips checks when data is missing', async () => {
    const provider = createMockProvider(
      JSON.stringify({ score: 0.8, reasoning: 'OK', confidence: 0.7 }),
    );
    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 0 },
    });

    const detector = new ComprehensiveBiasDetector();
    const report = await detector.runAll(engine, {});

    expect(report.positionBias).toBeUndefined();
    expect(report.lengthBias).toBeUndefined();
    expect(report.styleBias).toBeUndefined();
    expect(report.hasBias).toBe(false);
  });
});
