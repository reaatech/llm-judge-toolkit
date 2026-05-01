import type { Judgment } from '@reaatech/llm-judge-types';
import type { JudgmentEngine } from '@reaatech/llm-judge-engine';
import type { TemplateContext } from '@reaatech/llm-judge-templates';

export interface LengthBiasReport {
  hasBias: boolean;
  correlation: number;
  recommendation: string;
  details: Array<{
    responseLength: number;
    score: number;
  }>;
}

export class LengthBiasDetector {
  constructor(private threshold: number = 0.3) {}

  async detect(
    judge: JudgmentEngine,
    responses: Array<{ id: string; content: string; context?: TemplateContext }>,
  ): Promise<LengthBiasReport> {
    const judgments: Judgment[] = [];
    const lengths: number[] = [];

    for (const item of responses) {
      const ctx = item.context ?? { response: item.content };
      const judgment = await judge.judge(ctx);
      judgments.push(judgment);
      lengths.push(item.content.length);
    }

    const correlation = pearsonCorrelation(
      lengths,
      judgments.map((j) => j.score),
    );

    const hasBias = Math.abs(correlation) > this.threshold;

    return {
      hasBias,
      correlation,
      recommendation: hasBias
        ? `Length bias detected (r=${correlation.toFixed(2)}). Consider normalizing by response length or using length-aware templates.`
        : 'No significant length bias detected.',
      details: responses.map((r, i) => ({
        responseLength: r.content.length,
        score: judgments[i]!.score,
      })),
    };
  }
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || n !== y.length) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i]!, 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}
