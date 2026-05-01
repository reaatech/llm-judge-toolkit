import { describe, expect, it } from 'vitest';
import { CheapFirstTiebreaker, MajorityVoting, WeightedVoting } from './index.js';

describe('@reaatech/llm-judge-consensus', () => {
  it('should export MajorityVoting', () => {
    expect(MajorityVoting).toBeDefined();
  });

  it('should export CheapFirstTiebreaker', () => {
    expect(CheapFirstTiebreaker).toBeDefined();
  });

  it('should export WeightedVoting', () => {
    expect(WeightedVoting).toBeDefined();
  });
});
