import { z } from 'zod';
import { CacheConfigSchema } from './cache.js';
import { EvaluationCriteriaSchema } from './criteria.js';
import { ProviderNameSchema } from './provider.js';

export const ProviderConfigSchema = z.object({
  name: ProviderNameSchema,
  apiKey: z.string().min(1).optional(),
  baseURL: z.string().url().optional(),
  timeout: z.number().positive().default(30000),
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryDelay: z.number().positive().default(1000),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

export const EngineConfigSchema = z.object({
  criteria: EvaluationCriteriaSchema,
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.1),
  maxTokens: z.number().int().positive().default(2000),
  topP: z.number().min(0).max(1).optional(),
  cacheEnabled: z.boolean().default(true),
  maxRetries: z.number().int().min(0).default(3),
  retryDelay: z.number().positive().default(1000),
});

export type EngineConfig = z.infer<typeof EngineConfigSchema>;

export const JudgeConfigSchema = z.object({
  provider: ProviderConfigSchema,
  model: z.object({
    name: z.string().min(1),
    temperature: z.number().min(0).max(2).default(0.1),
    maxTokens: z.number().int().positive().default(2000),
    topP: z.number().min(0).max(1).optional(),
  }),
  cache: CacheConfigSchema,
  cost: z.object({
    budget: z.number().positive().optional(),
    alertThreshold: z.number().min(0).max(1).default(0.8),
    trackPerJudgment: z.boolean().default(true),
  }),
  calibration: z.object({
    enabled: z.boolean().default(true),
    minKappa: z.number().min(-1).max(1).default(0.7),
    recalibrateOnDrift: z.boolean().default(true),
  }),
  bias: z.object({
    detectPositionBias: z.boolean().default(true),
    positionBiasThreshold: z.number().min(0).max(1).default(0.1),
    autoDebias: z.boolean().default(false),
  }),
  monitoring: z.object({
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    enableTracing: z.boolean().default(false),
  }),
});

export type JudgeConfig = z.infer<typeof JudgeConfigSchema>;
