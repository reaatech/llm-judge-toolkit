import { describe, it, expect } from 'vitest';
import { CostTracker } from './tracker.js';
import type { Judgment } from '../types/judgment.js';

function makeJudgment(
  id: string,
  criteria: string,
  provider: string,
  model: string,
  totalCost: number,
): Judgment {
  return {
    id,
    criteria: criteria as Judgment['criteria'],
    score: 0.5,
    reasoning: 'test',
    confidence: 0.5,
    cost: {
      inputTokens: 10,
      outputTokens: 10,
      totalTokens: 20,
      inputCost: totalCost / 2,
      outputCost: totalCost / 2,
      totalCost,
      currency: 'USD',
    },
    metadata: {},
    timestamp: new Date(),
    provider,
    model,
    templateVersion: '1.0.0',
  };
}

describe('CostTracker', () => {
  it('tracks total cost', () => {
    const tracker = new CostTracker();

    tracker.track(makeJudgment('1', 'faithfulness', 'openai', 'gpt-4o', 0.01));
    tracker.track(makeJudgment('2', 'relevance', 'openai', 'gpt-4o-mini', 0.005));

    expect(tracker.getTotalCost()).toBeCloseTo(0.015, 5);
    expect(tracker.getJudgmentCount()).toBe(2);
  });

  it('breaks down cost by criteria', () => {
    const tracker = new CostTracker();

    tracker.track(makeJudgment('1', 'faithfulness', 'openai', 'gpt-4o', 0.01));
    tracker.track(makeJudgment('2', 'faithfulness', 'openai', 'gpt-4o', 0.02));
    tracker.track(makeJudgment('3', 'relevance', 'anthropic', 'claude-3', 0.015));

    expect(tracker.getCostByCriteria('faithfulness')).toBeCloseTo(0.03, 5);
    expect(tracker.getCostByCriteria('relevance')).toBeCloseTo(0.015, 5);
  });

  it('breaks down cost by provider', () => {
    const tracker = new CostTracker();

    tracker.track(makeJudgment('1', 'faithfulness', 'openai', 'gpt-4o', 0.01));
    tracker.track(makeJudgment('2', 'relevance', 'anthropic', 'claude-3', 0.02));

    expect(tracker.getCostByProvider('openai')).toBeCloseTo(0.01, 5);
    expect(tracker.getCostByProvider('anthropic')).toBeCloseTo(0.02, 5);
  });

  it('breaks down cost by model', () => {
    const tracker = new CostTracker();

    tracker.track(makeJudgment('1', 'faithfulness', 'openai', 'gpt-4o', 0.01));
    tracker.track(makeJudgment('2', 'relevance', 'openai', 'gpt-4o-mini', 0.005));

    expect(tracker.getCostByModel('gpt-4o')).toBeCloseTo(0.01, 5);
    expect(tracker.getCostByModel('gpt-4o-mini')).toBeCloseTo(0.005, 5);
  });

  it('generates a report', () => {
    const tracker = new CostTracker();

    tracker.track(makeJudgment('1', 'faithfulness', 'openai', 'gpt-4o', 0.01));
    tracker.track(makeJudgment('2', 'relevance', 'openai', 'gpt-4o-mini', 0.005));

    const report = tracker.generateReport();

    expect(report.totalCost).toBeCloseTo(0.015, 5);
    expect(report.judgmentCount).toBe(2);
    expect(report.averageCostPerJudgment).toBeCloseTo(0.0075, 5);
    expect(report.costByCriteria.faithfulness).toBeCloseTo(0.01, 5);
    expect(report.costByCriteria.relevance).toBeCloseTo(0.005, 5);
  });

  it('throws when budget is exceeded', () => {
    const tracker = new CostTracker({
      budget: { limit: 0.01, alertThreshold: 0.8 },
    });

    tracker.track(makeJudgment('1', 'faithfulness', 'openai', 'gpt-4o', 0.005));

    expect(() => tracker.track(makeJudgment('2', 'relevance', 'openai', 'gpt-4o', 0.02))).toThrow(
      'Budget exceeded',
    );
  });
});
