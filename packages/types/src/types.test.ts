import { describe, it, expect } from 'vitest';
import {
  JudgmentSchema,
  EvaluationCriteriaSchema,
  JudgeError,
  ProviderError,
} from './index.js';

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
