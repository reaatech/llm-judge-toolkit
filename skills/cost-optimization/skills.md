# Cost Optimization Skill

## Description
Track and optimize LLM API costs with budget management, cost tracking per judgment, and optimization strategies. This skill provides real-time cost monitoring and intelligent cost-saving recommendations.

## Capabilities
- Track costs per judgment in real-time
- Implement budget limits and alerts
- Optimize model selection based on cost/quality tradeoffs
- Generate detailed cost reports and analytics
- Predict costs for batch operations
- Implement cost-saving strategies (caching, cheaper models)
- Monitor cost trends and anomalies
- Provide ROI analysis for judgment improvements

## Invocation
```yaml
skill: cost-optimization
action: track-costs
parameters:
  budget: 100
  alertThreshold: 0.8
  trackPerJudgment: true
  generateReport: true
```

## Examples

### Set Budget Alerts
```yaml
skill: cost-optimization
action: set-budget
parameters:
  amount: 500
  currency: USD
  period: monthly
  alertThresholds:
    - 0.5
    - 0.8
    - 1.0
```

### Optimize Costs
```yaml
skill: cost-optimization
action: optimize-costs
parameters:
  targetQuality: 0.8
  maxCost: 0.01
  strategies:
    - model-selection
    - caching
    - batch-processing
```

## Generated Code Examples

### Cost Tracker
```typescript
// src/cost/tracker.ts
export class CostTracker {
  private costs = new Map<string, CostBreakdown>();
  private budget: Budget | null = null;
  
  track(judgment: Judgment): void {
    this.costs.set(judgment.id, judgment.cost);
    
    if (this.budget && this.getTotalCost() > this.budget.limit * this.budget.alertThreshold) {
      this.emit('budget:warning', {
        current: this.getTotalCost(),
        limit: this.budget.limit,
        percentage: this.getTotalCost() / this.budget.limit
      });
    }
  }
  
  getTotalCost(): number {
    return Array.from(this.costs.values()).reduce((sum, cost) => sum + cost.totalCost, 0);
  }
  
  generateReport(period: DateRange): CostReport {
    const filtered = this.filterByPeriod(period);
    return {
      totalCost: this.calculateTotal(filtered),
      costByCriteria: this.groupByCriteria(filtered),
      costByProvider: this.groupByProvider(filtered),
      costByModel: this.groupByModel(filtered),
      averageCostPerJudgment: this.calculateAverage(filtered),
      projectedMonthlyCost: this.projectMonthly(filtered),
      savingsFromCache: this.calculateCacheSavings(filtered)
    };
  }
}
```

### Budget Manager
```typescript
// src/cost/budget.ts
export class BudgetManager {
  async checkBudget(cost: number): Promise<BudgetStatus> {
    const budget = await this.getCurrentBudget();
    const currentSpend = await this.getCurrentSpend();
    const projectedSpend = currentSpend + cost;
    
    if (projectedSpend > budget.limit) {
      return {
        allowed: false,
        reason: 'Budget limit exceeded',
        currentSpend,
        projectedSpend,
        budgetLimit: budget.limit
      };
    }
    
    if (projectedSpend > budget.limit * budget.alertThreshold) {
      await this.sendAlert({
        type: 'budget_warning',
        currentSpend,
        projectedSpend,
        budgetLimit: budget.limit
      });
    }
    
    return { allowed: true, currentSpend, projectedSpend };
  }
}
```

## Constraints
- Costs must be tracked in real-time
- Budget alerts must be immediate
- Cost calculations must be accurate to 4 decimal places
- Support multiple currencies and conversion rates
- Handle partial judgments and failures gracefully

## Best Practices
1. **Real-time Tracking**: Track costs as they occur
2. **Budget Controls**: Implement hard and soft budget limits
3. **Cost Alerts**: Alert before budget is exceeded
4. **Optimization**: Continuously look for cost savings
5. **Reporting**: Generate regular cost reports
6. **Forecasting**: Predict future costs based on usage patterns
7. **ROI Analysis**: Measure value vs cost
8. **Transparency**: Make costs visible to all stakeholders

## Related Skills
- `cache-implementation` - For reducing costs through caching
- `provider-integration` - For tracking provider-specific costs
- `documentation` - For generating cost reports
