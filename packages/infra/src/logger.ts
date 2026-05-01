import pino from 'pino';
import type { Judgment } from '@reaatech/llm-judge-types';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export { logger };

export function logJudgment(judgment: Judgment, duration: number): void {
  logger.info({
    event: 'judgment:completed',
    judgmentId: judgment.id,
    criteria: judgment.criteria,
    score: judgment.score,
    confidence: judgment.confidence,
    cost: judgment.cost.totalCost,
    duration,
    provider: judgment.provider,
    model: judgment.model,
    cached: judgment.metadata?.cached || false,
  });
}

export function logError(error: Error, context?: Record<string, unknown>): void {
  logger.error({
    event: 'error',
    errorType: error.name,
    errorMessage: error.message,
    stack: error.stack,
    ...context,
  });
}

export function logCacheHit(judgmentId: string): void {
  logger.debug({
    event: 'cache:hit',
    judgmentId,
  });
}

export function logCacheMiss(key: string): void {
  logger.debug({
    event: 'cache:miss',
    cacheKey: key,
  });
}

export function logBudgetExceeded(current: number, limit: number): void {
  logger.warn({
    event: 'budget:exceeded',
    current,
    limit,
    ratio: current / limit,
  });
}
