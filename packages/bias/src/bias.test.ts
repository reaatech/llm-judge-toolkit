import { describe, it, expect } from 'vitest';
import {
  PositionBiasDetector,
  LengthBiasDetector,
  StyleBiasDetector,
  ComprehensiveBiasDetector,
} from './index.js';

describe('@reaatech/llm-judge-bias', () => {
  it('should export PositionBiasDetector', () => {
    expect(PositionBiasDetector).toBeDefined();
  });

  it('should export LengthBiasDetector', () => {
    expect(LengthBiasDetector).toBeDefined();
  });

  it('should export StyleBiasDetector', () => {
    expect(StyleBiasDetector).toBeDefined();
  });

  it('should export ComprehensiveBiasDetector', () => {
    expect(ComprehensiveBiasDetector).toBeDefined();
  });
});
