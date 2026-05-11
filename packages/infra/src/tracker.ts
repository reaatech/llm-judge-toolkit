import type { Budget, EventBus, Judgment } from '@reaatech/llm-judge-types';
import { BudgetExceededError } from '@reaatech/llm-judge-types';

function isWithinPeriod(timestamp: Date, period: string): boolean {
  const now = Date.now();
  const ts = timestamp.getTime();
  switch (period) {
    case 'daily':
      return now - ts < 24 * 60 * 60 * 1000;
    case 'weekly':
      return now - ts < 7 * 24 * 60 * 60 * 1000;
    case 'monthly':
      return now - ts < 30 * 24 * 60 * 60 * 1000;
    default:
      return true;
  }
}

export class CostTracker {
  private judgments = new Map<string, Judgment>();
  private budget: Budget | null = null;
  private eventBus?: EventBus;

  constructor(options?: { budget?: Budget; eventBus?: EventBus }) {
    this.budget = options?.budget ?? null;
    this.eventBus = options?.eventBus;
  }

  track(judgment: Judgment): void {
    if (this.budget) {
      const periodTotal = this.budget.period
        ? this.getPeriodCost(this.budget.period)
        : this.getTotalCost();
      const total = periodTotal + judgment.cost.totalCost;
      if (total > this.budget.limit) {
        this.eventBus?.emit('budget:exceeded', {
          current: total,
          limit: this.budget.limit,
        });
        throw new BudgetExceededError(
          `Budget exceeded: $${total.toFixed(4)} / $${this.budget.limit.toFixed(4)}`,
          total,
          this.budget.limit,
        );
      }
    }

    this.judgments.set(judgment.id, judgment);
  }

  getTotalCost(): number {
    let total = 0;
    for (const judgment of this.judgments.values()) {
      total += judgment.cost.totalCost;
    }
    return total;
  }

  getPeriodCost(period: string): number {
    let total = 0;
    for (const judgment of this.judgments.values()) {
      if (isWithinPeriod(judgment.timestamp, period)) {
        total += judgment.cost.totalCost;
      }
    }
    return total;
  }

  getCostByCriteria(criteria: string): number {
    let total = 0;
    for (const judgment of this.judgments.values()) {
      if (judgment.criteria === criteria) {
        total += judgment.cost.totalCost;
      }
    }
    return total;
  }

  getCostByProvider(provider: string): number {
    let total = 0;
    for (const judgment of this.judgments.values()) {
      if (judgment.provider === provider) {
        total += judgment.cost.totalCost;
      }
    }
    return total;
  }

  getCostByModel(model: string): number {
    let total = 0;
    for (const judgment of this.judgments.values()) {
      if (judgment.model === model) {
        total += judgment.cost.totalCost;
      }
    }
    return total;
  }

  getJudgmentCount(): number {
    return this.judgments.size;
  }

  generateReport(): {
    totalCost: number;
    judgmentCount: number;
    averageCostPerJudgment: number;
    costByCriteria: Record<string, number>;
    costByProvider: Record<string, number>;
    costByModel: Record<string, number>;
  } {
    let totalCost = 0;
    const costByCriteria: Record<string, number> = {};
    const costByProvider: Record<string, number> = {};
    const costByModel: Record<string, number> = {};

    for (const judgment of this.judgments.values()) {
      totalCost += judgment.cost.totalCost;
      costByCriteria[judgment.criteria] =
        (costByCriteria[judgment.criteria] ?? 0) + judgment.cost.totalCost;
      costByProvider[judgment.provider] =
        (costByProvider[judgment.provider] ?? 0) + judgment.cost.totalCost;
      costByModel[judgment.model] = (costByModel[judgment.model] ?? 0) + judgment.cost.totalCost;
    }

    const judgmentCount = this.judgments.size;

    return {
      totalCost,
      judgmentCount,
      averageCostPerJudgment: judgmentCount > 0 ? totalCost / judgmentCount : 0,
      costByCriteria,
      costByProvider,
      costByModel,
    };
  }
}
