import { describe, it, expect } from 'vitest';
import { LengthBiasDetector } from './length.js';
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

describe('LengthBiasDetector', () => {
  it('detects no bias when scores are uniform', async () => {
    const provider = createMockProvider(
      JSON.stringify({ score: 0.8, reasoning: 'OK', confidence: 0.7 }),
    );
    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 0 },
    });

    const detector = new LengthBiasDetector(0.5);
    const report = await detector.detect(engine, [
      { id: '1', content: 'Short.', context: { context: 'C', response: 'Short.' } },
      {
        id: '2',
        content: 'A much longer response with many words and details.',
        context: { context: 'C', response: 'Long.' },
      },
    ]);

    expect(report.hasBias).toBe(false);
    expect(report.correlation).toBe(0);
  });

  it('detects bias when longer responses score higher', async () => {
    let callCount = 0;
    const provider = createMockProvider('');
    provider.generateCompletion = async () => {
      callCount++;
      return {
        id: 'resp-1',
        model: 'mock-model',
        content: JSON.stringify({
          score: callCount === 1 ? 0.5 : 0.9,
          reasoning: 'OK',
          confidence: 0.7,
        }),
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        duration: 100,
      };
    };

    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 0 },
    });

    const detector = new LengthBiasDetector(0.3);
    const report = await detector.detect(engine, [
      { id: '1', content: 'Short.', context: { context: 'C', response: 'Short.' } },
      {
        id: '2',
        content: 'A much longer response with many words and details here.',
        context: { context: 'C', response: 'Long.' },
      },
    ]);

    expect(report.hasBias).toBe(true);
    expect(report.correlation).toBeGreaterThan(0);
  });
});
