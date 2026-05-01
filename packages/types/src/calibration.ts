import { z } from 'zod';

export const ConfusionMatrixSchema = z.object({
  matrix: z.array(z.array(z.number().int().min(0))),
  categories: z.number().int().positive(),
  thresholds: z.array(z.number()),
});

export type ConfusionMatrix = z.infer<typeof ConfusionMatrixSchema>;

export const CalibrationReportSchema = z.object({
  cohensKappa: z.number().min(-1).max(1),
  fleissKappa: z.number().min(-1).max(1).optional(),
  krippendorffAlpha: z.number().min(-1).max(1).optional(),
  accuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1Score: z.number().min(0).max(1),
  confusionMatrix: ConfusionMatrixSchema,
  sampleSize: z.number().int().positive(),
  timestamp: z.date(),
});

export type CalibrationReport = z.infer<typeof CalibrationReportSchema>;
