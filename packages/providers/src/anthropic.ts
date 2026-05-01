import type {
  LLMProvider,
  CompletionRequest,
  CompletionResponse,
  HealthStatus,
  ModelInfo,
  TokenUsage,
} from '@reaatech/llm-judge-types';
import type { CostBreakdown } from '@reaatech/llm-judge-types';
import { ProviderError } from '@reaatech/llm-judge-types';

interface AnthropicOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

interface AnthropicMessagesClient {
  messages: {
    create: (args: {
      model: string;
      max_tokens: number;
      temperature?: number;
      top_p?: number;
      system?: string;
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    }) => Promise<{
      id: string;
      model: string;
      content: Array<{ type: string; text: string }>;
      usage?: { input_tokens: number; output_tokens: number };
    }>;
  };
}

const MODELS: ModelInfo[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    contextWindow: 200_000,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    contextWindow: 200_000,
    supportsStreaming: true,
  },
];

const PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
};

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  readonly models = MODELS;

  private client: AnthropicMessagesClient | null = null;

  private readonly apiKey: string;
  private readonly baseURL: string | undefined;
  private readonly timeout: number;

  constructor(options: AnthropicOptions) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL;
    this.timeout = options.timeout ?? 30000;
  }

  toString(): string {
    return `AnthropicProvider(maskedKey=${this.apiKey.slice(0, 7)}...)`;
  }

  toJSON(): object {
    return { name: this.name, models: this.models };
  }

  private async initClient(): Promise<void> {
    if (this.client) return;
    try {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      this.client = new Anthropic({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
        timeout: this.timeout,
      }) as AnthropicMessagesClient;
    } catch (error) {
      throw new ProviderError(
        'Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk',
        this.name,
        error,
      );
    }
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    await this.initClient();
    const start = Date.now();
    try {
      const anthropic = this.client!;

      const systemMessage = request.messages.find((m) => m.role === 'system');
      const userMessages = request.messages.filter((m) => m.role !== 'system');

      for (const m of userMessages) {
        const role = m.role;
        if (role !== 'user' && role !== 'assistant') {
          throw new ProviderError(
            `Unsupported message role for Anthropic: ${role}. Only 'user' and 'assistant' are supported.`,
            this.name,
          );
        }
      }

      const response = await anthropic.messages.create({
        model: request.model,
        max_tokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0.1,
        top_p: request.topP,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      });

      const usage: TokenUsage = {
        promptTokens: response.usage?.input_tokens ?? 0,
        completionTokens: response.usage?.output_tokens ?? 0,
        totalTokens:
          (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
        model: response.model,
      };

      const textContent = response.content.find((c) => c.type === 'text')?.text;
      if (!textContent) {
        throw new ProviderError(
          'Anthropic returned no text content in response (may contain only tool-use blocks)',
          this.name,
        );
      }

      return {
        id: response.id,
        model: response.model,
        content: textContent,
        usage,
        duration: Date.now() - start,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `Anthropic completion failed: ${error instanceof Error ? error.message : String(error)}`,
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
      const anthropic = this.client!;

      await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
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
