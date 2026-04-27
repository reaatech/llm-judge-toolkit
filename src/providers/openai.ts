import type {
  LLMProvider,
  CompletionRequest,
  CompletionResponse,
  HealthStatus,
  ModelInfo,
  TokenUsage,
} from '../types/provider.js';
import type { CostBreakdown } from '../types/cost.js';
import { ProviderError } from '../errors.js';

interface OpenAIOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

interface OpenAICompletionsClient {
  chat: {
    completions: {
      create: (args: {
        model: string;
        messages: Array<{ role: string; content: string }>;
        temperature?: number;
        max_tokens?: number;
        top_p?: number;
        frequency_penalty?: number;
        presence_penalty?: number;
        stop?: string[];
      }) => Promise<{
        id: string;
        model: string;
        choices: Array<{ message: { content: string | null } }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      }>;
    };
  };
}

const MODELS: ModelInfo[] = [
  { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128_000, supportsStreaming: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128_000, supportsStreaming: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128_000, supportsStreaming: true },
];

const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
};

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  readonly models = MODELS;

  private client: OpenAICompletionsClient | null = null;

  private readonly apiKey: string;
  private readonly baseURL: string | undefined;
  private readonly timeout: number;

  constructor(options: OpenAIOptions) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL;
    this.timeout = options.timeout ?? 30000;
  }

  toString(): string {
    return `OpenAIProvider(maskedKey=${this.apiKey.slice(0, 7)}...)`;
  }

  toJSON(): object {
    return { name: this.name, models: this.models };
  }

  private async initClient(): Promise<void> {
    if (this.client) return;
    try {
      const { OpenAI } = await import('openai');
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
        timeout: this.timeout,
      }) as OpenAICompletionsClient;
    } catch (error) {
      throw new ProviderError(
        'OpenAI SDK not installed. Run: npm install openai',
        this.name,
        error,
      );
    }
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    await this.initClient();
    const start = Date.now();
    try {
      const openai = this.client!;

      const response = await openai.chat.completions.create({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.1,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        stop: request.stop,
      });

      const usage: TokenUsage = {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
        model: response.model,
      };

      return {
        id: response.id,
        model: response.model,
        content: response.choices[0]?.message?.content ?? '',
        usage,
        duration: Date.now() - start,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `OpenAI completion failed: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error,
      );
    }
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  calculateCost(usage: TokenUsage): CostBreakdown {
    const model = usage.model ?? '';
    const pricing = PRICING[model];
    if (!pricing) {
      throw new ProviderError(
        `Unknown model pricing for "${model}". Supported models: ${Object.keys(PRICING).join(', ')}`,
        this.name,
      );
    }
    const inputCost = (usage.promptTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;

    return {
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: 'USD',
    };
  }

  async checkHealth(): Promise<HealthStatus> {
    try {
      await this.initClient();
      const start = Date.now();
      const openai = this.client!;

      await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      });
      return { status: 'healthy', latency: Date.now() - start };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
