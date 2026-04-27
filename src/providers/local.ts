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

interface LocalOptions {
  baseURL?: string;
  apiKey?: string;
  timeout?: number;
}

export class LocalProvider implements LLMProvider {
  readonly name = 'local';
  readonly models: ModelInfo[] = [];

  private baseURL: string;
  private timeout: number;
  private apiKey?: string;

  constructor(options: LocalOptions = {}) {
    this.baseURL = options.baseURL ?? 'http://localhost:11434';
    this.timeout = options.timeout ?? 30000;
    this.apiKey = options.apiKey;
  }

  toString(): string {
    return this.apiKey
      ? `LocalProvider(maskedKey=${this.apiKey.slice(0, 7)}...)`
      : 'LocalProvider(baseURL=' + this.baseURL + ')';
  }

  toJSON(): object {
    return { name: this.name, models: this.models };
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.1,
          max_tokens: request.maxTokens,
          top_p: request.topP,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON response, got: ${contentType}`);
      }

      const data = (await response.json()) as {
        id: string;
        model: string;
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      const usage: TokenUsage = {
        promptTokens:
          data.usage?.prompt_tokens ??
          this.countTokens(request.messages.map((m) => m.content).join('')),
        completionTokens:
          data.usage?.completion_tokens ??
          this.countTokens(data.choices[0]?.message?.content ?? ''),
        totalTokens: 0,
        model: data.model,
      };

      if (data.usage?.total_tokens != null) {
        usage.totalTokens = data.usage.total_tokens;
      } else {
        usage.totalTokens = usage.promptTokens + usage.completionTokens;
      }

      return {
        id: data.id,
        model: data.model,
        content: data.choices[0]?.message?.content ?? '',
        usage,
        duration: Date.now() - start,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderError(
          `Local provider request timed out after ${this.timeout}ms`,
          this.name,
        );
      }
      throw new ProviderError(
        `Local provider completion failed: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error,
      );
    }
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  calculateCost(_usage: TokenUsage): CostBreakdown {
    return {
      inputTokens: _usage.promptTokens,
      outputTokens: _usage.completionTokens,
      totalTokens: _usage.totalTokens,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  async checkHealth(): Promise<HealthStatus> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const start = Date.now();
      const response = await fetch(`${this.baseURL}/v1/models`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        return { status: 'healthy', latency: Date.now() - start };
      }
      return {
        status: 'degraded',
        message: `Local server responded with ${response.status}`,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return { status: 'unhealthy', message: 'Connection to local server timed out' };
      }
      return {
        status: 'unhealthy',
        message: `Cannot connect to local server: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
