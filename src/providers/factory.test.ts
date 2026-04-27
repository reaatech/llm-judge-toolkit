import { describe, it, expect } from 'vitest';
import { ProviderFactory } from './factory.js';
import { ProviderError } from '../errors.js';

describe('ProviderFactory', () => {
  it('creates OpenAI provider with explicit key', () => {
    const provider = ProviderFactory.create({ name: 'openai', apiKey: 'test-key' });
    expect(provider.name).toBe('openai');
  });

  it('creates Anthropic provider with explicit key', () => {
    const provider = ProviderFactory.create({ name: 'anthropic', apiKey: 'test-key' });
    expect(provider.name).toBe('anthropic');
  });

  it('creates Local provider without key', () => {
    const provider = ProviderFactory.create({ name: 'local' });
    expect(provider.name).toBe('local');
  });

  it('throws for OpenAI without key', () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    expect(() => ProviderFactory.create({ name: 'openai' })).toThrow(ProviderError);

    if (original) process.env.OPENAI_API_KEY = original;
  });

  it('throws for Anthropic without key', () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    expect(() => ProviderFactory.create({ name: 'anthropic' })).toThrow(ProviderError);

    if (original) process.env.ANTHROPIC_API_KEY = original;
  });

  it('throws for unknown provider', () => {
    expect(() => ProviderFactory.create({ name: 'unknown' as 'openai' })).toThrow(ProviderError);
  });

  it('reads from environment variables', () => {
    process.env.LLM_JUDGE_PROVIDER = 'local';
    process.env.LLM_JUDGE_BASE_URL = 'http://localhost:11434';

    const provider = ProviderFactory.fromEnv();
    expect(provider.name).toBe('local');

    delete process.env.LLM_JUDGE_PROVIDER;
    delete process.env.LLM_JUDGE_BASE_URL;
  });

  it('defaults to openai from env', () => {
    const originalProvider = process.env.LLM_JUDGE_PROVIDER;
    delete process.env.LLM_JUDGE_PROVIDER;

    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'test-key';

    const provider = ProviderFactory.fromEnv();
    expect(provider.name).toBe('openai');

    if (originalProvider) process.env.LLM_JUDGE_PROVIDER = originalProvider;
    if (originalKey) process.env.OPENAI_API_KEY = originalKey;
    else delete process.env.OPENAI_API_KEY;
  });
});
