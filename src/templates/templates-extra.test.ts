import { describe, it, expect } from 'vitest';
import { CoherenceTemplate, RelevanceTemplate, SafetyTemplate, ToolUseTemplate } from './index.js';

describe('RelevanceTemplate', () => {
  const template = new RelevanceTemplate();

  it('parses JSON response', () => {
    const parsed = template.parseResponse(
      JSON.stringify({ score: 0.8, reasoning: 'Relevant', confidence: 0.9 }),
    );
    expect(parsed.score).toBe(0.8);
    expect(parsed.metadata?.missingAspects).toEqual([]);
  });

  it('parses markdown JSON', () => {
    const parsed = template.parseResponse('```json\n{"score":0.7,"reasoning":"OK"}\n```');
    expect(parsed.score).toBe(0.7);
  });

  it('falls back for non-JSON', () => {
    const parsed = template.parseResponse('The score is 0.5');
    expect(parsed.score).toBe(0.5);
    expect(parsed.confidence).toBe(0.3);
  });

  it('clamps scores', () => {
    const parsed = template.parseResponse('{"score": 2, "reasoning": "x", "confidence": -1}');
    expect(parsed.score).toBe(1);
    expect(parsed.confidence).toBe(0);
  });
});

describe('CoherenceTemplate', () => {
  const template = new CoherenceTemplate();

  it('parses JSON response', () => {
    const parsed = template.parseResponse(
      JSON.stringify({ score: 0.9, reasoning: 'Coherent', confidence: 0.8 }),
    );
    expect(parsed.score).toBe(0.9);
    expect(parsed.metadata?.contradictions).toEqual([]);
  });

  it('falls back for non-JSON', () => {
    const parsed = template.parseResponse('Score: 0.4');
    expect(parsed.score).toBe(0.4);
  });
});

describe('SafetyTemplate', () => {
  const template = new SafetyTemplate();

  it('parses JSON response', () => {
    const parsed = template.parseResponse(
      JSON.stringify({ score: 0.95, reasoning: 'Safe', confidence: 0.9 }),
    );
    expect(parsed.score).toBe(0.95);
    expect(parsed.metadata?.violations).toEqual([]);
  });

  it('falls back for non-JSON', () => {
    const parsed = template.parseResponse('rating 0.3');
    expect(parsed.score).toBe(0.3);
  });
});

describe('ToolUseTemplate', () => {
  const template = new ToolUseTemplate();

  it('parses JSON response', () => {
    const parsed = template.parseResponse(
      JSON.stringify({ score: 0.85, reasoning: 'Correct', confidence: 0.8 }),
    );
    expect(parsed.score).toBe(0.85);
    expect(parsed.metadata?.parameterErrors).toEqual([]);
  });

  it('falls back for non-JSON', () => {
    const parsed = template.parseResponse('score is 0.6');
    expect(parsed.score).toBe(0.6);
  });
});
