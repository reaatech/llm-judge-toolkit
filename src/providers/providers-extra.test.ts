import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider, AnthropicProvider, LocalProvider } from './index.js';
import { ProviderError } from '../errors.js';

const mockOpenAICreate = vi.fn();
const mockAnthropicCreate = vi.fn();

vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (...args: unknown[]) => mockOpenAICreate(...args),
      },
    },
  })),
}));

vi.mock('@anthropic-ai/sdk', () => ({
  Anthropic: vi.fn().mockImplementation(() => ({
    messages: {
      create: (...args: unknown[]) => mockAnthropicCreate(...args),
    },
  })),
}));

describe('OpenAIProvider generateCompletion', () => {
  beforeEach(() => {
    mockOpenAICreate.mockReset();
  });

  it('returns completion on success', async () => {
    mockOpenAICreate.mockResolvedValue({
      id: 'resp-1',
      model: 'gpt-4o-mini',
      choices: [{ message: { content: 'Hello world' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    });

    const provider = new OpenAIProvider({ apiKey: 'test' });
    const result = await provider.generateCompletion({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result.content).toBe('Hello world');
    expect(result.usage.promptTokens).toBe(10);
    expect(result.usage.completionTokens).toBe(5);
    expect(result.model).toBe('gpt-4o-mini');
  });

  it('throws ProviderError on API failure', async () => {
    mockOpenAICreate.mockRejectedValue(new Error('Rate limited'));

    const provider = new OpenAIProvider({ apiKey: 'test' });
    await expect(
      provider.generateCompletion({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it('checkHealth returns healthy on success', async () => {
    mockOpenAICreate.mockResolvedValue({
      id: 'resp-1',
      model: 'gpt-4o-mini',
      choices: [{ message: { content: 'ok' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });

    const provider = new OpenAIProvider({ apiKey: 'test' });
    const health = await provider.checkHealth();
    expect(health.status).toBe('healthy');
    expect(health.latency).toBeGreaterThanOrEqual(0);
  });

  it('checkHealth returns unhealthy on failure', async () => {
    mockOpenAICreate.mockRejectedValue(new Error('fail'));

    const provider = new OpenAIProvider({ apiKey: 'test' });
    const health = await provider.checkHealth();
    expect(health.status).toBe('unhealthy');
  });
});

describe('AnthropicProvider generateCompletion', () => {
  beforeEach(() => {
    mockAnthropicCreate.mockReset();
  });

  it('returns completion on success', async () => {
    mockAnthropicCreate.mockResolvedValue({
      id: 'msg-1',
      model: 'claude-3-haiku-20240307',
      content: [{ type: 'text', text: 'Hello there' }],
      usage: { input_tokens: 8, output_tokens: 2 },
    });

    const provider = new AnthropicProvider({ apiKey: 'test' });
    const result = await provider.generateCompletion({
      model: 'claude-3-haiku-20240307',
      messages: [
        { role: 'system', content: 'You are a judge' },
        { role: 'user', content: 'hi' },
      ],
    });

    expect(result.content).toBe('Hello there');
    expect(result.usage.promptTokens).toBe(8);
    expect(result.usage.completionTokens).toBe(2);
  });

  it('throws ProviderError on API failure', async () => {
    mockAnthropicCreate.mockRejectedValue(new Error('Overloaded'));

    const provider = new AnthropicProvider({ apiKey: 'test' });
    await expect(
      provider.generateCompletion({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it('checkHealth returns healthy on success', async () => {
    mockAnthropicCreate.mockResolvedValue({
      id: 'msg-1',
      model: 'claude-3-haiku-20240307',
      content: [{ type: 'text', text: 'ok' }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });

    const provider = new AnthropicProvider({ apiKey: 'test' });
    const health = await provider.checkHealth();
    expect(health.status).toBe('healthy');
  });

  it('checkHealth returns unhealthy on failure', async () => {
    mockAnthropicCreate.mockRejectedValue(new Error('fail'));

    const provider = new AnthropicProvider({ apiKey: 'test' });
    const health = await provider.checkHealth();
    expect(health.status).toBe('unhealthy');
  });
});

describe('LocalProvider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns completion with usage', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: {
        get: (_name: string) => 'application/json',
      },
      json: async () => ({
        id: 'local-1',
        model: 'llama3',
        choices: [{ message: { content: 'Done' } }],
        usage: { prompt_tokens: 4, completion_tokens: 2, total_tokens: 6 },
      }),
    });

    const provider = new LocalProvider();
    const result = await provider.generateCompletion({
      model: 'llama3',
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result.content).toBe('Done');
    expect(result.usage.totalTokens).toBe(6);
  });

  it('falls back to token counting when usage missing', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: {
        get: (_name: string) => 'application/json',
      },
      json: async () => ({
        id: 'local-1',
        model: 'llama3',
        choices: [{ message: { content: 'ab' } }],
      }),
    });

    const provider = new LocalProvider();
    const result = await provider.generateCompletion({
      model: 'llama3',
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result.usage.promptTokens).toBe(1); // 'hi' -> ceil(2/4)
    expect(result.usage.completionTokens).toBe(1); // 'ab' -> ceil(2/4)
    expect(result.usage.totalTokens).toBe(2);
  });

  it('throws ProviderError on HTTP error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const provider = new LocalProvider();
    await expect(
      provider.generateCompletion({
        model: 'llama3',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    ).rejects.toBeInstanceOf(ProviderError);
  });

  it('checkHealth returns healthy when server responds', async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const provider = new LocalProvider();
    const health = await provider.checkHealth();
    expect(health.status).toBe('healthy');
  });

  it('checkHealth returns degraded on non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    const provider = new LocalProvider();
    const health = await provider.checkHealth();
    expect(health.status).toBe('degraded');
  });

  it('checkHealth returns unhealthy on network error', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const provider = new LocalProvider();
    const health = await provider.checkHealth();
    expect(health.status).toBe('unhealthy');
  });
});
