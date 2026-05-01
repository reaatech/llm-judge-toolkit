import { describe, expect, it } from 'vitest';
import { EvaluationCriteriaSchema, JudgeError, JudgmentSchema, ProviderError } from './index.js';

describe('@reaatech/llm-judge-types', () => {
  it('should export JudgmentSchema', () => {
    expect(JudgmentSchema).toBeDefined();
  });

  it('should export EvaluationCriteriaSchema', () => {
    expect(EvaluationCriteriaSchema).toBeDefined();
  });

  it('should export JudgeError', () => {
    expect(JudgeError).toBeDefined();
  });

  it('should export ProviderError', () => {
    expect(ProviderError).toBeDefined();
  });
});
