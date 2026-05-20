import type { CalibrationReport, ConfusionMatrix, Judgment } from '@reaatech/llm-judge-types';

const discretize = (score: number) => Math.min(2, Math.floor(score * 3));

// biome-ignore lint/complexity/noStaticOnlyClass: static utility class is intentional public API
export class CalibrationMetrics {
  static cohensKappa(judgments: Judgment[], humanLabels: number[]): number {
    const n = judgments.length;
    if (n === 0) return 0;

    let observed = 0;
    const judgeDist = new Map<number, number>();
    const humanDist = new Map<number, number>();

    for (let i = 0; i < n; i++) {
      const judgment = judgments[i];
      const label = humanLabels[i];
      const jCat = discretize(judgment.score);
      const hCat = discretize(label);

      if (jCat === hCat) observed++;

      judgeDist.set(jCat, (judgeDist.get(jCat) || 0) + 1);
      humanDist.set(hCat, (humanDist.get(hCat) || 0) + 1);
    }

    const po = observed / n;

    let pe = 0;
    for (const [cat, count] of judgeDist) {
      const humanCount = humanDist.get(cat) || 0;
      pe += (count / n) * (humanCount / n);
    }

    if (pe === 1) return 1;
    return (po - pe) / (1 - pe);
  }

  static confusionMatrix(
    judgments: Judgment[],
    humanLabels: number[],
    thresholds: number[] = [0.33, 0.66],
  ): ConfusionMatrix {
    const categories = thresholds.length + 1;
    const matrix = Array.from({ length: categories }, () => Array(categories).fill(0));

    const categorize = (score: number) => {
      for (let i = 0; i < thresholds.length; i++) {
        if (score <= thresholds[i]) return i;
      }
      return thresholds.length;
    };

    for (let i = 0; i < judgments.length; i++) {
      const judgment = judgments[i];
      const label = humanLabels[i];
      const pred = categorize(judgment.score);
      const actual = categorize(label);
      const row = matrix[pred];
      const col = row?.[actual];
      if (col !== undefined && row) row[actual] = col + 1;
    }

    return { matrix, categories, thresholds };
  }

  static accuracy(confusionMatrix: ConfusionMatrix): number {
    let correct = 0;
    let total = 0;

    for (let i = 0; i < confusionMatrix.categories; i++) {
      const row = confusionMatrix.matrix[i];
      for (let j = 0; j < confusionMatrix.categories; j++) {
        const val = row[j];
        if (i === j) correct += val;
        total += val;
      }
    }

    return total === 0 ? 0 : correct / total;
  }

  static precisionRecallF1(
    confusionMatrix: ConfusionMatrix,
    positiveClass = 2,
  ): { precision: number; recall: number; f1Score: number } {
    const cm = confusionMatrix;
    const numCats = cm.categories;

    if (positiveClass < 0 || positiveClass >= numCats) {
      return { precision: 0, recall: 0, f1Score: 0 };
    }

    const row = cm.matrix[positiveClass];
    if (!row) return { precision: 0, recall: 0, f1Score: 0 };

    const tp = row[positiveClass] ?? 0;
    const fp = row.reduce((a, b, j) => (j === positiveClass ? a : a + b), 0);
    const fn = cm.matrix.reduce(
      (a, r, i) => (i === positiveClass ? a : a + (r[positiveClass] ?? 0)),
      0,
    );

    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1Score = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    return { precision, recall, f1Score };
  }

  static generateReport(judgments: Judgment[], humanLabels: number[]): CalibrationReport {
    const cm = CalibrationMetrics.confusionMatrix(judgments, humanLabels);
    const { precision, recall, f1Score } = CalibrationMetrics.precisionRecallF1(cm);

    return {
      cohensKappa: CalibrationMetrics.cohensKappa(judgments, humanLabels),
      accuracy: CalibrationMetrics.accuracy(cm),
      precision,
      recall,
      f1Score,
      confusionMatrix: cm,
      sampleSize: judgments.length,
      timestamp: new Date(),
    };
  }
}
