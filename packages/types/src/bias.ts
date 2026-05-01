import { z } from 'zod';

export const PositionBiasScoreSchema = z.object({
  candidateId: z.string(),
  originalPosition: z.number().int().min(0),
  originalScore: z.number().min(0).max(1),
  swappedScore: z.number().min(0).max(1),
  positionEffect: z.number().min(0).max(1),
});

export type PositionBiasScore = z.infer<typeof PositionBiasScoreSchema>;

export const PositionBiasReportSchema = z.object({
  hasBias: z.boolean(),
  averageBias: z.number().min(0).max(1),
  biasByPosition: z.array(PositionBiasScoreSchema).min(1),
  recommendation: z.string(),
});

export type PositionBiasReport = z.infer<typeof PositionBiasReportSchema>;
