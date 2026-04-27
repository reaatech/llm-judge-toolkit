import { describe, it, expect } from 'vitest';
import {
  FaithfulnessTemplate,
  RelevanceTemplate,
  CoherenceTemplate,
  SafetyTemplate,
  ToolUseTemplate,
} from './index.js';

describe('FaithfulnessTemplate', () => {
  const template = new FaithfulnessTemplate();

  it('has correct metadata', () => {
    expect(template.name).toBe('faithfulness');
    expect(template.version).toBe('1.0.0');
    expect(template.criteria).toBe('faithfulness');
  });

  it('builds a prompt with context and response', () => {
    const prompt = template.buildPrompt({
      query: 'What is the capital?',
      response: 'Paris',
      context: 'The capital of France is Paris.',
    });

    expect(prompt.system).toContain('faithfulness');
    expect(prompt.user).toContain('Paris');
    expect(prompt.user).toContain('Source Material');
  });

  it('throws when context is missing', () => {
    expect(() => template.buildPrompt({ response: 'Paris' })).toThrow(
      'Faithfulness evaluation requires context',
    );
  });

  it('parses a valid JSON response', () => {
    const parsed = template.parseResponse(
      JSON.stringify({
        score: 0.95,
        reasoning: 'Fully supported',
        confidence: 0.9,
        unsupported_claims: [],
      }),
    );

    expect(parsed.score).toBe(0.95);
    expect(parsed.confidence).toBe(0.9);
    expect(parsed.reasoning).toBe('Fully supported');
    expect(parsed.metadata?.unsupportedClaims).toEqual([]);
  });

  it('parses a markdown-wrapped JSON response', () => {
    const parsed = template.parseResponse(
      '```json\n{"score":0.8,"reasoning":"OK","confidence":0.7}\n```',
    );

    expect(parsed.score).toBe(0.8);
  });

  it('falls back for non-JSON responses', () => {
    const parsed = template.parseResponse('The score is 0.6 because reasons.');

    expect(parsed.score).toBe(0.6);
    expect(parsed.confidence).toBe(0.3);
    expect(parsed.metadata?.parsedFallback).toBe(true);
  });

  it('clamps scores to 0-1', () => {
    const parsed = template.parseResponse('{"score": 1.5, "reasoning": "test", "confidence": 2}');

    expect(parsed.score).toBe(1);
    expect(parsed.confidence).toBe(1);
  });
});

describe('RelevanceTemplate', () => {
  const template = new RelevanceTemplate();

  it('builds a prompt with query and response', () => {
    const prompt = template.buildPrompt({
      query: 'What is the capital?',
      response: 'Paris',
    });

    expect(prompt.system).toContain('relevance');
    expect(prompt.user).toContain('What is the capital?');
  });

  it('throws when query is missing', () => {
    expect(() => template.buildPrompt({ response: 'Paris' })).toThrow(
      'Relevance evaluation requires a query',
    );
  });
});

describe('CoherenceTemplate', () => {
  const template = new CoherenceTemplate();

  it('builds a prompt with response', () => {
    const prompt = template.buildPrompt({
      response: 'This is a coherent response.',
    });

    expect(prompt.system).toContain('coherence');
  });
});

describe('SafetyTemplate', () => {
  const template = new SafetyTemplate();

  it('builds a prompt with response', () => {
    const prompt = template.buildPrompt({
      response: 'This is safe.',
    });

    expect(prompt.system).toContain('safety');
  });
});

describe('ToolUseTemplate', () => {
  const template = new ToolUseTemplate();

  it('builds a prompt with query and tool calls', () => {
    const prompt = template.buildPrompt({
      query: 'Get the weather',
      toolCalls: [{ name: 'get_weather', arguments: { city: 'Paris' } }],
    });

    expect(prompt.system).toContain('tool use');
    expect(prompt.user).toContain('get_weather');
  });

  it('throws when tool calls are missing', () => {
    expect(() => template.buildPrompt({ query: 'Get weather' })).toThrow(
      'Tool-use evaluation requires tool calls',
    );
  });
});
