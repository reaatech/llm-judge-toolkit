import { describe, it, expect } from 'vitest';
import { OpenAIProvider, AnthropicProvider, LocalProvider } from './index.js';
import { ProviderError } from '../errors.js';

describe('OpenAIProvider', () => {
  it('calculates cost for known models', () => {
    const provider = new OpenAIProvider({ apiKey: 'test' });
    const cost = provider.calculateCost({
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
      totalTokens: 2_000_000,
      model: 'gpt-4o',
    });

    expect(cost.inputCost).toBe(2.5);
    expect(cost.outputCost).toBe(10.0);
    expect(cost.totalCost).toBe(12.5);
    expect(cost.currency).toBe('USD');
  });

  it('counts tokens with heuristic', () => {
    const provider = new OpenAIProvider({ apiKey: 'test' });
    expect(provider.countTokens('abcd')).toBe(1);
    expect(provider.countTokens('a'.repeat(100))).toBe(25);
  });

  it('throws for unknown models', () => {
    const provider = new OpenAIProvider({ apiKey: 'test' });
    expect(() =>
      provider.calculateCost({
        promptTokens: 1000,
        completionTokens: 1000,
        totalTokens: 2000,
        model: 'unknown-model',
      }),
    ).toThrow(ProviderError);
  });
});

describe('AnthropicProvider', () => {
  it('calculates cost for known models', () => {
    const provider = new AnthropicProvider({ apiKey: 'test' });
    const cost = provider.calculateCost({
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
      totalTokens: 2_000_000,
      model: 'claude-3-5-sonnet-20241022',
    });

    expect(cost.inputCost).toBe(3.0);
    expect(cost.outputCost).toBe(15.0);
    expect(cost.totalCost).toBe(18.0);
  });

  it('counts tokens with heuristic', () => {
    const provider = new AnthropicProvider({ apiKey: 'test' });
    expect(provider.countTokens('abcd')).toBe(1);
  });
});

describe('LocalProvider', () => {
  it('calculates zero cost', () => {
    const provider = new LocalProvider();
    const cost = provider.calculateCost({
      promptTokens: 1000,
      completionTokens: 1000,
      totalTokens: 2000,
      model: 'llama3',
    });

    expect(cost.totalCost).toBe(0);
  });

  it('counts tokens with heuristic', () => {
    const provider = new LocalProvider();
    expect(provider.countTokens('abcd')).toBe(1);
  });

  it('returns unhealthy when server is down', async () => {
    const provider = new LocalProvider({ baseURL: 'http://localhost:99999' });
    const health = await provider.checkHealth();
    expect(health.status).toBe('unhealthy');
  });
});
