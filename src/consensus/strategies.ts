import type { Judgment } from '../types/judgment.js';
import type { ConsensusResult, ConsensusStrategy } from '../types/consensus.js';

function computeAgreement(scores: number[]): number {
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  return 1 - Math.min(1, Math.sqrt(variance) * 2);
}

export class MajorityVoting implements ConsensusStrategy {
  readonly name = 'majority-voting';

  execute(judgments: Judgment[]): ConsensusResult {
    if (judgments.length === 0) {
      throw new Error('Cannot compute consensus on empty judgments array');
    }

    const scores = judgments.map((j) => j.score);
    const weights = judgments.map((j) => j.confidence);

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight === 0) {
      throw new Error('Total confidence weight is zero; cannot compute weighted average');
    }

    const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i]!, 0);
    const finalScore = Math.max(0, Math.min(1, weightedSum / totalWeight));

    const agreement = computeAgreement(scores);

    return {
      finalScore,
      agreementScore: agreement,
      method: this.name,
      individualJudgments: judgments,
      tiebreakerUsed: false,
    };
  }
}

export class CheapFirstTiebreaker implements ConsensusStrategy {
  readonly name = 'cheap-first-tiebreaker';

  constructor(private cheapCount: number = 2) {
    if (cheapCount < 1) {
      throw new Error('cheapCount must be at least 1');
    }
  }

  execute(judgments: Judgment[]): ConsensusResult {
    if (judgments.length < 2) {
      throw new Error('CheapFirstTiebreaker requires at least 2 judgments');
    }

    const cheapJudgments = judgments.slice(0, this.cheapCount);
    const tiebreakers = judgments.slice(this.cheapCount);

    if (cheapJudgments.length < 2) {
      throw new Error(
        `Need at least 2 cheap judgments, got ${cheapJudgments.length}. Increase cheapCount or provide more judgments.`,
      );
    }

    const j1 = cheapJudgments[0]!;
    const j2 = cheapJudgments[1]!;

    const agreement = 1 - Math.abs(j1.score - j2.score);
    const agreementThreshold = 0.8;

    if (agreement >= agreementThreshold && tiebreakers.length === 0) {
      return {
        finalScore: (j1.score + j2.score) / 2,
        agreementScore: agreement,
        method: this.name,
        individualJudgments: cheapJudgments,
        tiebreakerUsed: false,
      };
    }

    const allJudgments = [...cheapJudgments, ...tiebreakers];
    const scores = allJudgments.map((j) => j.score);
    const finalScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const allAgreement =
      tiebreakers.length > 0 ? computeAgreement(scores) : agreement;

    return {
      finalScore: Math.max(0, Math.min(1, finalScore)),
      agreementScore: allAgreement,
      method: this.name,
      individualJudgments: allJudgments,
      tiebreakerUsed: tiebreakers.length > 0,
    };
  }
}

export class WeightedVoting implements ConsensusStrategy {
  readonly name = 'weighted-voting';

  constructor(private weights: number[]) {}

  execute(judgments: Judgment[]): ConsensusResult {
    if (judgments.length === 0) {
      throw new Error('Cannot compute consensus on empty judgments array');
    }

    if (this.weights.length !== judgments.length) {
      throw new Error('Weights array must match judgments array length');
    }

    for (const w of this.weights) {
      if (w < 0) {
        throw new Error('Weights must be non-negative');
      }
    }

    const totalWeight = this.weights.reduce((a, b) => a + b, 0);
    if (totalWeight === 0) {
      throw new Error('Total weight is zero; cannot compute weighted average');
    }

    const scores = judgments.map((j) => j.score);
    const weightedSum = scores.reduce((sum, score, i) => sum + score * this.weights[i]!, 0);
    const finalScore = Math.max(0, Math.min(1, weightedSum / totalWeight));

    const agreement = computeAgreement(scores);

    return {
      finalScore,
      agreementScore: agreement,
      method: this.name,
      individualJudgments: judgments,
      tiebreakerUsed: false,
    };
  }
}
