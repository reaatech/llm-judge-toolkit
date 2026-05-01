import { describe, it, expect } from 'vitest';
import {
  MajorityVoting,
  CheapFirstTiebreaker,
  WeightedVoting,
} from './index.js';

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
