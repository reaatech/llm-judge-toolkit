import { z } from 'zod';
import { ConsensusMethodSchema, JudgmentSchema } from './judgment.js';
import type { Judgment } from './judgment.js';

export const ConsensusResultSchema = z.object({
  finalScore: z.number().min(0).max(1),
  agreementScore: z.number().min(0).max(1),
  method: ConsensusMethodSchema,
  individualJudgments: z.array(JudgmentSchema).min(1),
  tiebreakerUsed: z.boolean().default(false),
});

export type ConsensusResult = z.infer<typeof ConsensusResultSchema>;

export interface ConsensusStrategy {
  name: string;
  execute(judgments: Judgment[]): ConsensusResult;
}
