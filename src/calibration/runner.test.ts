import { describe, it, expect } from 'vitest';
import { CalibrationRunner } from './runner.js';
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

describe('CalibrationRunner', () => {
  it('runs calibration against faithfulness dataset', async () => {
    const provider = createMockProvider(
      JSON.stringify({ score: 0.85, reasoning: 'OK', confidence: 0.8 }),
    );
    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 0 },
    });

    const runner = new CalibrationRunner({
      engine,
      criteria: 'faithfulness',
    });

    const result = await runner.run();

    expect(result.report.sampleSize).toBeGreaterThan(0);
    expect(result.judgments.length).toBe(result.dataset.examples.length);
    expect(result.report.cohensKappa).toBeDefined();
    expect(result.report.accuracy).toBeDefined();
  });

  it('calls progress callback', async () => {
    const provider = createMockProvider(
      JSON.stringify({ score: 0.85, reasoning: 'OK', confidence: 0.8 }),
    );
    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 0 },
    });

    const progress: number[] = [];
    const runner = new CalibrationRunner({
      engine,
      criteria: 'faithfulness',
      onProgress: (completed, _total) => progress.push(completed),
    });

    await runner.run();

    expect(progress.length).toBeGreaterThan(0);
    expect(progress[progress.length - 1]).toBe(progress.length);
  });

  it('throws for empty dataset', async () => {
    const provider = createMockProvider('{}');
    const engine = new JudgmentEngine({
      provider,
      template: new FaithfulnessTemplate(),
      config: { model: 'mock-model', maxRetries: 0 },
    });

    const runner = new CalibrationRunner({
      engine,
      criteria: 'custom',
    });

    await expect(runner.run()).rejects.toThrow('No calibration examples');
  });
});
