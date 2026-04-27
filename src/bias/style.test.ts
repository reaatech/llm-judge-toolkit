import { describe, it, expect } from 'vitest';
import { StyleBiasDetector } from './style.js';
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

describe('StyleBiasDetector', () => {
  it('detects no bias when scores are consistent across styles', async () => {
    const provider = createMockProvider(
      JSON.stringify({ score: 0.8, reasoning: 'OK', confidence: 0.7 }),
    );
    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 0 },
    });

    const detector = new StyleBiasDetector(0.2);
    const report = await detector.detect(engine, 'This is a faithful response.', {
      context: 'Source material.',
      response: 'This is a faithful response.',
    });

    expect(report.hasBias).toBe(false);
    expect(report.details.length).toBe(3);
  });

  it('detects bias when style affects score', async () => {
    let callCount = 0;
    const provider = createMockProvider('');
    provider.generateCompletion = async () => {
      callCount++;
      return {
        id: 'resp-1',
        model: 'mock-model',
        content: JSON.stringify({
          score: callCount === 3 ? 0.3 : 0.9,
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

    const detector = new StyleBiasDetector(0.2);
    const report = await detector.detect(engine, 'This is a faithful response.', {
      context: 'Source material.',
      response: 'This is a faithful response.',
    });

    expect(report.hasBias).toBe(true);
    expect(report.details.some((d) => d.styleEffect > 0.2)).toBe(true);
  });
});
