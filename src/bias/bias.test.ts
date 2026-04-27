import { describe, it, expect } from 'vitest';
import { PositionBiasDetector } from './position.js';
import { JudgmentEngine } from '../engine/judge.js';
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
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
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

describe('PositionBiasDetector', () => {
  it('detects no bias when scores are consistent', async () => {
    const provider = createMockProvider(
      JSON.stringify({ score: 0.8, reasoning: 'OK', confidence: 0.7 }),
    );

    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model' },
    });

    const detector = new PositionBiasDetector(0.1);
    const report = await detector.detect(
      engine,
      [
        { id: 'a', content: 'Answer A' },
        { id: 'b', content: 'Answer B' },
      ],
      { context: 'Source material', response: 'Answer' },
    );

    expect(report.hasBias).toBe(false);
    expect(report.averageBias).toBe(0);
  });

  it('detects bias when scores differ between orders', async () => {
    let callCount = 0;
    const provider = createMockProvider('');
    provider.generateCompletion = async () => {
      callCount++;
      return {
        id: 'resp-1',
        model: 'mock-model',
        content: JSON.stringify({
          score: callCount === 1 ? 0.9 : 0.5,
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
      config: { model: 'mock-model' },
    });

    const detector = new PositionBiasDetector(0.1);
    const report = await detector.detect(
      engine,
      [
        { id: 'a', content: 'Answer A' },
        { id: 'b', content: 'Answer B' },
      ],
      { context: 'Source material', response: 'Answer' },
    );

    expect(report.hasBias).toBe(true);
    expect(report.averageBias).toBe(0.4);
  });

  it('throws with fewer than 2 candidates', async () => {
    const provider = createMockProvider('{}');
    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model' },
    });

    const detector = new PositionBiasDetector();
    await expect(detector.detect(engine, [{ id: 'a', content: 'A' }])).rejects.toThrow(
      'at least 2',
    );
  });

  it('debiases by averaging both orders', async () => {
    let callCount = 0;
    const provider = createMockProvider('');
    provider.generateCompletion = async () => {
      callCount++;
      return {
        id: 'resp-1',
        model: 'mock-model',
        content: JSON.stringify({
          score: callCount === 1 ? 0.9 : 0.5,
          reasoning: 'OK',
          confidence: 0.8,
        }),
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        duration: 100,
      };
    };

    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model' },
    });

    const detector = new PositionBiasDetector();
    const result = await detector.debias(
      engine,
      [
        { id: 'a', content: 'Answer A' },
        { id: 'b', content: 'Answer B' },
      ],
      { context: 'Source material', response: 'Answer' },
    );

    expect(result.score).toBe(0.7);
    expect(result.confidence).toBe(0.8);
    expect(result.metadata?.custom?.debiased).toBe(true);
  });
});
