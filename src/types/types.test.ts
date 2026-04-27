import { describe, it, expect } from 'vitest';
import {
  EvaluationCriteriaSchema,
  JudgmentSchema,
  CostBreakdownSchema,
  CacheConfigSchema,
  ProviderConfigSchema,
} from './index.js';

describe('EvaluationCriteriaSchema', () => {
  it('accepts valid criteria', () => {
    expect(EvaluationCriteriaSchema.parse('faithfulness')).toBe('faithfulness');
    expect(EvaluationCriteriaSchema.parse('relevance')).toBe('relevance');
    expect(EvaluationCriteriaSchema.parse('coherence')).toBe('coherence');
    expect(EvaluationCriteriaSchema.parse('safety')).toBe('safety');
    expect(EvaluationCriteriaSchema.parse('tool-use')).toBe('tool-use');
    expect(EvaluationCriteriaSchema.parse('custom')).toBe('custom');
  });

  it('rejects invalid criteria', () => {
    expect(() => EvaluationCriteriaSchema.parse('invalid')).toThrow();
  });
});

describe('JudgmentSchema', () => {
  it('accepts a valid judgment', () => {
    const judgment = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      criteria: 'faithfulness',
      score: 0.95,
      reasoning: 'The response is fully supported by the source material.',
      confidence: 0.9,
      cost: {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        inputCost: 0.0001,
        outputCost: 0.0002,
        totalCost: 0.0003,
        currency: 'USD',
      },
      metadata: {},
      timestamp: new Date(),
      provider: 'openai',
      model: 'gpt-4o',
      templateVersion: '1.0.0',
    };

    expect(() => JudgmentSchema.parse(judgment)).not.toThrow();
  });

  it('rejects scores outside 0-1', () => {
    const judgment = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      criteria: 'faithfulness',
      score: 1.5,
      reasoning: 'Test',
      confidence: 0.5,
      cost: {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        currency: 'USD',
      },
      metadata: {},
      timestamp: new Date(),
      provider: 'openai',
      model: 'gpt-4o',
      templateVersion: '1.0.0',
    };

    expect(() => JudgmentSchema.parse(judgment)).toThrow();
  });
});

describe('CostBreakdownSchema', () => {
  it('accepts a valid cost breakdown', () => {
    const cost = {
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      inputCost: 0.001,
      outputCost: 0.002,
      totalCost: 0.003,
    };

    const parsed = CostBreakdownSchema.parse(cost);
    expect(parsed.currency).toBe('USD');
  });

  it('rejects negative costs', () => {
    expect(() =>
      CostBreakdownSchema.parse({
        inputTokens: -1,
        outputTokens: 0,
        totalTokens: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
      }),
    ).toThrow();
  });
});

describe('CacheConfigSchema', () => {
  it('applies defaults', () => {
    const parsed = CacheConfigSchema.parse({});
    expect(parsed.enabled).toBe(true);
    expect(parsed.backend).toBe('memory');
    expect(parsed.ttl).toBe(86400000);
    expect(parsed.maxSize).toBe(10000);
    expect(parsed.prefix).toBe('llm-judge:');
  });
});

describe('ProviderConfigSchema', () => {
  it('applies defaults', () => {
    const parsed = ProviderConfigSchema.parse({ name: 'openai' });
    expect(parsed.timeout).toBe(30000);
    expect(parsed.maxRetries).toBe(3);
    expect(parsed.retryDelay).toBe(1000);
  });
});
