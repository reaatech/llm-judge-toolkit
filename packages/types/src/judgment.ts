import { z } from 'zod';
import { CostBreakdownSchema } from './cost.js';
import { EvaluationCriteriaSchema } from './criteria.js';

export const JudgmentMetadataSchema = z.object({
  cached: z.boolean().optional(),
  cachedAt: z.date().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  templateVersion: z.string().optional(),
  duration: z.number().optional(),
  retries: z.number().int().min(0).default(0),
  custom: z.record(z.string(), z.unknown()).optional(),
});

export type JudgmentMetadata = z.infer<typeof JudgmentMetadataSchema>;

export const JudgmentSchema = z.object({
  id: z.string().uuid(),
  criteria: EvaluationCriteriaSchema,
  score: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(5000),
  confidence: z.number().min(0).max(1),
  cost: CostBreakdownSchema,
  metadata: JudgmentMetadataSchema,
  timestamp: z.date(),
  provider: z.string().min(1),
  model: z.string().min(1),
  templateVersion: z.string().min(1),
  rawResponse: z.unknown().optional(),
});

export type Judgment = z.infer<typeof JudgmentSchema>;

export const ConsensusMethodSchema = z.enum([
  'majority-voting',
  'weighted-voting',
  'confidence-weighted',
  'cheap-first-tiebreaker',
]);

export type ConsensusMethod = z.infer<typeof ConsensusMethodSchema>;

export const ConsensusJudgmentSchema = z.object({
  id: z.string().uuid(),
  individualJudgments: z.array(JudgmentSchema),
  finalScore: z.number().min(0).max(1),
  agreementScore: z.number().min(0).max(1),
  method: ConsensusMethodSchema,
  tiebreakerUsed: z.boolean(),
  timestamp: z.date(),
});

export type ConsensusJudgment = z.infer<typeof ConsensusJudgmentSchema>;
