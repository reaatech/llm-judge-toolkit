import { z } from 'zod';

export const EvaluationCriteriaSchema = z.enum([
  'faithfulness',
  'relevance',
  'coherence',
  'safety',
  'tool-use',
  'custom',
]);

export type EvaluationCriteria = z.infer<typeof EvaluationCriteriaSchema>;

export const RubricItemSchema = z.object({
  level: z.number().int().min(1),
  description: z.string().min(1),
  score: z.number().min(0).max(1).default(0.5),
});

export type RubricItem = z.infer<typeof RubricItemSchema>;

export const CriteriaConfigSchema = z.object({
  criteria: EvaluationCriteriaSchema,
  weight: z.number().min(0).max(1).optional(),
  threshold: z.number().min(0).max(1).optional(),
  customPrompt: z.string().optional(),
  rubric: z.array(RubricItemSchema).optional(),
});

export type CriteriaConfig = z.infer<typeof CriteriaConfigSchema>;
