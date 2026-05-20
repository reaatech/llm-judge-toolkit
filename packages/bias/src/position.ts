import type { JudgmentEngine } from '@reaatech/llm-judge-engine';
import type { TemplateContext } from '@reaatech/llm-judge-templates';
import type { Judgment, PositionBiasReport } from '@reaatech/llm-judge-types';

export class PositionBiasDetector {
  constructor(private threshold = 0.1) {}

  async detect(
    judge: JudgmentEngine,
    candidates: Array<{ id: string; content: string }>,
    context?: Omit<TemplateContext, 'candidates'>,
  ): Promise<PositionBiasReport> {
    if (candidates.length < 2) {
      throw new Error('Position bias detection requires at least 2 candidates');
    }

    // Original order
    const originalOrder = await judge.judge({
      ...context,
      candidates,
    });

    // Swapped order
    const swappedCandidates = [...candidates].reverse();
    const swappedOrder = await judge.judge({
      ...context,
      candidates: swappedCandidates,
    });

    // Position bias is measured at the aggregate evaluation level.
    // Comparing overall scores between original and swapped candidate orders
    // reveals whether the LLM judge's evaluation is order-dependent.
    const originalScore = originalOrder.score;
    const swappedScore = swappedOrder.score;
    const positionEffect = Math.abs(originalScore - swappedScore);

    const biasByPosition = [
      {
        candidateId: 'aggregate',
        originalPosition: 0,
        originalScore,
        swappedScore,
        positionEffect,
      },
    ];

    const averageBias = positionEffect;
    const hasBias = averageBias > this.threshold;

    return {
      hasBias,
      averageBias,
      biasByPosition,
      recommendation: hasBias
        ? 'Use position debiasing: average scores from both orders'
        : 'No significant position bias detected',
    };
  }

  async debias(
    judge: JudgmentEngine,
    candidates: Array<{ id: string; content: string }>,
    context?: Omit<TemplateContext, 'candidates'>,
  ): Promise<Judgment> {
    const [original, swapped] = await Promise.all([
      judge.judge({ ...context, candidates }),
      judge.judge({ ...context, candidates: [...candidates].reverse() }),
    ]);

    const avgScore = (original.score + swapped.score) / 2;
    const avgConfidence = (original.confidence + swapped.confidence) / 2;

    return {
      ...original,
      score: avgScore,
      confidence: avgConfidence,
      metadata: {
        ...original.metadata,
        custom: {
          ...(original.metadata?.custom ?? {}),
          debiased: true,
          originalScore: original.score,
          swappedScore: swapped.score,
        },
      },
    };
  }
}
