import { describe, expect, it } from 'vitest';
import { AnthropicProvider, LocalProvider, OpenAIProvider, ProviderFactory } from './index.js';

describe('@reaatech/llm-judge-providers', () => {
  it('should export OpenAIProvider', () => {
    expect(OpenAIProvider).toBeDefined();
  });

  it('should export AnthropicProvider', () => {
    expect(AnthropicProvider).toBeDefined();
  });

  it('should export LocalProvider', () => {
    expect(LocalProvider).toBeDefined();
  });

  it('should export ProviderFactory', () => {
    expect(ProviderFactory).toBeDefined();
  });
});
