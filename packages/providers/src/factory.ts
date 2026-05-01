import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { LocalProvider } from './local.js';
import type { LLMProvider } from '@reaatech/llm-judge-types';
import { ProviderError } from '@reaatech/llm-judge-types';

export interface ProviderFactoryOptions {
  name: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
}

const VALID_NAMES = new Set(['openai', 'anthropic', 'local']);

export class ProviderFactory {
  static create(options: ProviderFactoryOptions): LLMProvider {
    switch (options.name) {
      case 'openai': {
        const key = options.apiKey || process.env.OPENAI_API_KEY;
        if (!key) {
          throw new ProviderError(
            'OpenAI API key required. Use apiKey option or set OPENAI_API_KEY environment variable.',
            'openai',
          );
        }
        return new OpenAIProvider({
          apiKey: key,
          baseURL: options.baseURL,
          timeout: options.timeout,
        });
      }
      case 'anthropic': {
        const key = options.apiKey || process.env.ANTHROPIC_API_KEY;
        if (!key) {
          throw new ProviderError(
            'Anthropic API key required. Use apiKey option or set ANTHROPIC_API_KEY environment variable.',
            'anthropic',
          );
        }
        return new AnthropicProvider({
          apiKey: key,
          baseURL: options.baseURL,
          timeout: options.timeout,
        });
      }
      case 'local':
        return new LocalProvider({
          baseURL: options.baseURL,
          apiKey: options.apiKey,
          timeout: options.timeout,
        });
      default:
        throw new ProviderError(`Unknown provider: ${options.name}`, String(options.name));
    }
  }

  static fromEnv(providerName?: string): LLMProvider {
    const rawName = providerName || process.env.LLM_JUDGE_PROVIDER || 'openai';

    if (!VALID_NAMES.has(rawName)) {
      throw new ProviderError(
        `Invalid provider: ${rawName}. Must be one of: openai, anthropic, local`,
        rawName,
      );
    }

    const name = rawName as 'openai' | 'anthropic' | 'local';

    const timeoutRaw = process.env.LLM_JUDGE_TIMEOUT;
    let timeout: number | undefined;
    if (timeoutRaw && timeoutRaw.trim() !== '') {
      const parsed = Number(timeoutRaw);
      timeout = Number.isNaN(parsed) ? undefined : parsed;
    }

    return ProviderFactory.create({
      name,
      apiKey: process.env.LLM_JUDGE_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.LLM_JUDGE_BASE_URL,
      timeout,
    });
  }
}
