import { randomUUID } from 'node:crypto';
import type { CacheManager } from '@reaatech/llm-judge-cache';
import type {
  JudgmentTemplate,
  ParsedJudgment,
  TemplateContext,
} from '@reaatech/llm-judge-templates';
import type { CompletionRequest, LLMProvider } from '@reaatech/llm-judge-types';
import type { Judgment, JudgmentMetadata } from '@reaatech/llm-judge-types';
import type { EngineConfig } from '@reaatech/llm-judge-types';
import type { EventBus } from '@reaatech/llm-judge-types';
import { JudgeError, ProviderError } from '@reaatech/llm-judge-types';
import type { RateLimiter } from './rate-limiter.js';

export interface JudgmentEngineOptions {
  provider: LLMProvider;
  template: JudgmentTemplate;
  cache?: CacheManager;
  config?: Partial<EngineConfig>;
  eventBus?: EventBus;
  rateLimiter?: RateLimiter;
}

export class JudgmentEngine {
  private provider: LLMProvider;
  private template: JudgmentTemplate;
  private cache: CacheManager | null;
  private config: EngineConfig;
  private eventBus?: EventBus;
  private rateLimiter?: RateLimiter;

  constructor(options: JudgmentEngineOptions) {
    this.provider = options.provider;
    this.template = options.template;
    this.cache = options.cache ?? null;
    this.eventBus = options.eventBus;
    this.rateLimiter = options.rateLimiter;
    this.config = {
      criteria: options.template.criteria,
      model: 'gpt-4o-mini',
      temperature: 0.1,
      maxTokens: 2000,
      cacheEnabled: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...options.config,
    };
  }

  async judge(context: TemplateContext): Promise<Judgment> {
    const startTime = Date.now();

    if (this.cache && this.config.cacheEnabled) {
      const cacheKey = this.getCacheKey(context);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.eventBus?.emit('judgment:cached', { judgment: cached });
        return cached;
      }
    }

    const prompt = this.template.buildPrompt(context);
    this.validatePrompt(prompt);

    const response = await this.executeWithRetry(prompt);

    const parsed = this.template.parseResponse(response.content);
    const judgment = this.createJudgment(context, parsed, response, startTime);

    if (this.cache && this.config.cacheEnabled) {
      const cacheKey = this.getCacheKey(context);
      await this.cache.set(cacheKey, judgment);
    }

    this.eventBus?.emit('judgment:completed', { judgment });

    return judgment;
  }

  private getCacheKey(context: TemplateContext): string {
    if (!this.cache) {
      throw new JudgeError('Cache not available', 'CACHE_ERROR');
    }
    return this.cache.buildCacheKey({
      provider: this.provider.name,
      model: this.config.model,
      templateName: this.template.name,
      templateVersion: this.template.version,
      context,
      temperature: this.config.temperature,
    });
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof ProviderError) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('rate limit') ||
        msg.includes('rate_limit') ||
        msg.includes('429') ||
        msg.includes('timeout') ||
        msg.includes('service unavailable') ||
        msg.includes('503') ||
        msg.includes('server error') ||
        msg.includes('500') ||
        msg.includes('overloaded') ||
        msg.includes('capacity') ||
        msg.includes('connection') ||
        msg.includes('econnrefused') ||
        msg.includes('econnreset') ||
        msg.includes('etimedout') ||
        msg.includes('network')
      );
    }
    return false;
  }

  private async executeWithRetry(prompt: { system: string; user: string }): Promise<{
    id: string;
    model: string;
    content: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
    duration: number;
    retries: number;
  }> {
    const maxRetries = this.config.maxRetries ?? 3;
    const baseDelay = this.config.retryDelay ?? 1000;

    const request: CompletionRequest = {
      model: this.config.model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    };

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (this.rateLimiter) {
          await this.rateLimiter.acquire(1);
        }
        const response = await this.provider.generateCompletion(request);
        return { ...response, retries: attempt };
      } catch (error) {
        if (attempt === maxRetries) {
          this.eventBus?.emit('judgment:error', {
            error: error instanceof Error ? error : new Error(String(error)),
            context: request,
          });
          throw new ProviderError(
            `All ${maxRetries + 1} attempts failed: ${error instanceof Error ? error.message : String(error)}`,
            this.provider.name,
            error,
          );
        }

        if (!this.isRetryableError(error)) {
          this.eventBus?.emit('judgment:error', {
            error: error instanceof Error ? error : new Error(String(error)),
            context: request,
          });
          throw error instanceof Error ? error : new Error(String(error));
        }

        const delay = baseDelay * 2 ** attempt;
        await this.sleep(delay);
      }
    }

    throw new JudgeError('Unreachable', 'UNKNOWN');
  }

  private validatePrompt(prompt: { system: string; user: string }): void {
    if (typeof prompt.system !== 'string' || typeof prompt.user !== 'string') {
      throw new JudgeError('Prompt must have string system and user fields', 'VALIDATION_ERROR');
    }
    if (!prompt.system.trim() || !prompt.user.trim()) {
      throw new JudgeError('Prompt cannot be empty', 'VALIDATION_ERROR');
    }
  }

  private createJudgment(
    _context: TemplateContext,
    parsed: ParsedJudgment,
    response: {
      id: string;
      model: string;
      content: string;
      usage: { promptTokens: number; completionTokens: number; totalTokens: number };
      duration: number;
      retries: number;
    },
    startTime: number,
  ): Judgment {
    const cost = this.provider.calculateCost({
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      model: response.model,
    });

    const metadata: JudgmentMetadata = {
      ...parsed.metadata,
      provider: this.provider.name,
      model: response.model,
      templateVersion: this.template.version,
      duration: Date.now() - startTime,
      retries: response.retries,
    };

    return {
      id: randomUUID(),
      criteria: this.template.criteria,
      score: Number.isNaN(parsed.score) ? 0.5 : Math.max(0, Math.min(1, parsed.score)),
      reasoning: parsed.reasoning,
      confidence: Number.isNaN(parsed.confidence)
        ? 0.3
        : Math.max(0, Math.min(1, parsed.confidence)),
      cost,
      metadata,
      timestamp: new Date(),
      provider: this.provider.name,
      model: response.model,
      templateVersion: this.template.version,
      rawResponse: response,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
