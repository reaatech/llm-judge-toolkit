export interface RateLimiterConfig {
  tokensPerInterval: number;
  intervalMs: number;
  maxTokens?: number;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private tokensPerInterval: number;
  private intervalMs: number;
  private maxTokens: number;
  private queue: Array<{
    tokens: number;
    resolve: () => void;
  }> = [];
  private processing = false;

  constructor(config: RateLimiterConfig) {
    if (config.tokensPerInterval <= 0 || config.intervalMs <= 0) {
      throw new Error('tokensPerInterval and intervalMs must be positive');
    }
    this.tokensPerInterval = config.tokensPerInterval;
    this.intervalMs = config.intervalMs;
    this.maxTokens = config.maxTokens ?? config.tokensPerInterval;
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(tokens = 1): Promise<void> {
    if (tokens <= 0) return;

    return new Promise<void>((resolve) => {
      this.queue.push({ tokens, resolve });
      this.processQueue();
    });
  }

  tryAcquire(tokens = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  getRemainingTokens(): number {
    this.refill();
    return this.tokens;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      this.refill();
      const next = this.queue[0];
      if (!next) break;

      if (this.tokens >= next.tokens) {
        this.tokens -= next.tokens;
        this.queue.shift();
        next.resolve();
      } else {
        const needed = next.tokens - this.tokens;
        const waitMs = (needed / this.tokensPerInterval) * this.intervalMs;
        await this.sleep(Math.max(1, Math.ceil(waitMs)));
      }
    }

    this.processing = false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / this.intervalMs) * this.tokensPerInterval;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
