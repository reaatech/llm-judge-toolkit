import { describe, expect, it } from 'vitest';
import {
  ComprehensiveBiasDetector,
  LengthBiasDetector,
  PositionBiasDetector,
  StyleBiasDetector,
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
