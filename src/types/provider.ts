import { z } from 'zod';

export const ProviderNameSchema = z.enum(['openai', 'anthropic', 'local']);
export type ProviderName = z.infer<typeof ProviderNameSchema>;

export const ModelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  contextWindow: z.number().int().positive(),
  supportsStreaming: z.boolean().default(false),
});

export type ModelInfo = z.infer<typeof ModelInfoSchema>;

export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

export const CompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(MessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
});

export type CompletionRequest = z.infer<typeof CompletionRequestSchema>;

export const TokenUsageSchema = z.object({
  promptTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  model: z.string().optional(),
});

export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export const CompletionResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  content: z.string(),
  usage: TokenUsageSchema,
  duration: z.number().min(0),
});

export type CompletionResponse = z.infer<typeof CompletionResponseSchema>;

export const HealthStatusSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  latency: z.number().optional(),
  message: z.string().optional(),
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export interface LLMProvider {
  readonly name: string;
  readonly models: ModelInfo[];

  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
  countTokens(text: string): number;
  calculateCost(usage: TokenUsage): CostBreakdown;

  checkHealth(): Promise<HealthStatus>;
}

import type { CostBreakdown } from './cost.js';
