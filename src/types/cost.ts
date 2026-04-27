import { z } from 'zod';

export const CostBreakdownSchema = z.object({
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  inputCost: z.number().min(0),
  outputCost: z.number().min(0),
  totalCost: z.number().min(0),
  currency: z.string().default('USD'),
});

export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;

export const BudgetSchema = z.object({
  limit: z.number().positive(),
  alertThreshold: z.number().min(0).max(1).default(0.8),
  period: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export type Budget = z.infer<typeof BudgetSchema>;
