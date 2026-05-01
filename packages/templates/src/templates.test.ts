import { describe, expect, it } from 'vitest';
import {
  CoherenceTemplate,
  FaithfulnessTemplate,
  RelevanceTemplate,
  SafetyTemplate,
  ToolUseTemplate,
  cleanAndParse,
  parseFallback,
  safeScore,
} from './index.js';

describe('@reaatech/llm-judge-templates', () => {
  it('should export FaithfulnessTemplate', () => {
    expect(FaithfulnessTemplate).toBeDefined();
  });

  it('should export RelevanceTemplate', () => {
    expect(RelevanceTemplate).toBeDefined();
  });

  it('should export CoherenceTemplate', () => {
    expect(CoherenceTemplate).toBeDefined();
  });

  it('should export SafetyTemplate', () => {
    expect(SafetyTemplate).toBeDefined();
  });

  it('should export ToolUseTemplate', () => {
    expect(ToolUseTemplate).toBeDefined();
  });

  it('should export safeScore', () => {
    expect(safeScore).toBeDefined();
  });

  it('should export cleanAndParse', () => {
    expect(cleanAndParse).toBeDefined();
  });

  it('should export parseFallback', () => {
    expect(parseFallback).toBeDefined();
  });
});
