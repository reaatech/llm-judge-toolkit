import { describe, it, expect } from 'vitest';
import { MajorityVoting, CheapFirstTiebreaker, WeightedVoting } from './strategies.js';
import type { Judgment } from '../types/judgment.js';

function makeJudgment(score: number, confidence: number = 0.8): Judgment {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    criteria: 'faithfulness',
    score,
    reasoning: 'test',
    confidence,
    cost: {
      inputTokens: 10,
      outputTokens: 10,
      totalTokens: 20,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0.001,
      currency: 'USD',
    },
    metadata: {},
    timestamp: new Date(),
    provider: 'test',
    model: 'test',
    templateVersion: '1.0.0',
  };
}

describe('MajorityVoting', () => {
  it('computes weighted average by confidence', () => {
    const strategy = new MajorityVoting();
    const result = strategy.execute([makeJudgment(0.8, 1.0), makeJudgment(0.9, 0.5)]);

    // (0.8*1.0 + 0.9*0.5) / 1.5 = 1.25 / 1.5 = 0.833...
    expect(result.finalScore).toBeCloseTo(0.833, 2);
    expect(result.method).toBe('majority-voting');
    expect(result.tiebreakerUsed).toBe(false);
  });

  it('throws on empty array', () => {
    const strategy = new MajorityVoting();
    expect(() => strategy.execute([])).toThrow('empty');
  });
});

describe('CheapFirstTiebreaker', () => {
  it('returns average when cheap judges agree', () => {
    const strategy = new CheapFirstTiebreaker();
    const result = strategy.execute([makeJudgment(0.85), makeJudgment(0.85)]);

    expect(result.finalScore).toBe(0.85);
    expect(result.tiebreakerUsed).toBe(false);
    expect(result.agreementScore).toBe(1);
  });

  it('uses tiebreaker when cheap judges disagree', () => {
    const strategy = new CheapFirstTiebreaker();
    const result = strategy.execute([makeJudgment(0.5), makeJudgment(0.9), makeJudgment(0.7)]);

    expect(result.finalScore).toBeCloseTo(0.7, 1); // (0.5 + 0.9 + 0.7) / 3
    expect(result.tiebreakerUsed).toBe(true);
  });

  it('throws with fewer than 2 judgments', () => {
    const strategy = new CheapFirstTiebreaker();
    expect(() => strategy.execute([makeJudgment(0.5)])).toThrow('at least 2');
  });
});

describe('WeightedVoting', () => {
  it('applies custom weights', () => {
    const strategy = new WeightedVoting([2, 1]);
    const result = strategy.execute([makeJudgment(0.8), makeJudgment(0.5)]);

    // (0.8*2 + 0.5*1) / 3 = 2.1 / 3 = 0.7
    expect(result.finalScore).toBeCloseTo(0.7, 10);
  });

  it('throws when weights length mismatches', () => {
    const strategy = new WeightedVoting([1, 1, 1]);
    expect(() => strategy.execute([makeJudgment(0.5), makeJudgment(0.6)])).toThrow('match');
  });
});
