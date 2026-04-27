export interface MetricsSnapshot {
  judgmentsTotal: number;
  judgmentsCached: number;
  judgmentsFailed: number;
  averageLatency: number;
  averageScore: number;
  totalCost: number;
  cacheHitRate: number;
}

export class MetricsCollector {
  private judgments = 0;
  private cached = 0;
  private failed = 0;
  private totalLatency = 0;
  private totalScore = 0;
  private scoredJudgments = 0;
  private totalCost = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  recordJudgment(score: number, latency: number, cost: number, cached: boolean): void {
    this.judgments++;
    this.totalLatency += latency;
    this.totalCost += cost;

    if (cached) {
      this.cached++;
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    this.totalScore += score;
    this.scoredJudgments++;
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  recordFailure(): void {
    this.failed++;
  }

  snapshot(): MetricsSnapshot {
    const totalCache = this.cacheHits + this.cacheMisses;

    return {
      judgmentsTotal: this.judgments,
      judgmentsCached: this.cached,
      judgmentsFailed: this.failed,
      averageLatency: this.judgments > 0 ? this.totalLatency / this.judgments : 0,
      averageScore: this.scoredJudgments > 0 ? this.totalScore / this.scoredJudgments : 0,
      totalCost: this.totalCost,
      cacheHitRate: totalCache > 0 ? this.cacheHits / totalCache : 0,
    };
  }

  reset(): void {
    this.judgments = 0;
    this.cached = 0;
    this.failed = 0;
    this.totalLatency = 0;
    this.totalScore = 0;
    this.scoredJudgments = 0;
    this.totalCost = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}
