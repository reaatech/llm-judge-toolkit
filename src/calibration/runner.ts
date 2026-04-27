import { randomUUID } from 'crypto';
import type { JudgmentEngine } from '../engine/judge.js';
import { CalibrationMetrics } from './metrics.js';
import { DatasetManager } from './dataset.js';
import type { CalibrationDataset, CalibrationExample } from './dataset.js';
import type { CalibrationReport } from '../types/calibration.js';
import type { EvaluationCriteria } from '../types/criteria.js';
import { logError } from '../monitoring/logger.js';

export interface CalibrationRunnerOptions {
  engine: JudgmentEngine;
  criteria: EvaluationCriteria;
  datasetsDir?: string;
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
}

export interface CalibrationRunnerResult {
  report: CalibrationReport;
  dataset: CalibrationDataset;
  judgments: Array<{
    example: CalibrationExample;
    predicted: number;
    actual: number;
    match: boolean;
  }>;
  failed: number;
}

export class CalibrationRunner {
  private engine: JudgmentEngine;
  private criteria: EvaluationCriteria;
  private datasetsDir?: string;
  private concurrency: number;
  private onProgress?: (completed: number, total: number) => void;

  constructor(options: CalibrationRunnerOptions) {
    this.engine = options.engine;
    this.criteria = options.criteria;
    this.datasetsDir = options.datasetsDir;
    this.concurrency = options.concurrency ?? 3;
    this.onProgress = options.onProgress;
  }

  async run(): Promise<CalibrationRunnerResult> {
    const manager = new DatasetManager(this.datasetsDir);
    const dataset = manager.load(this.criteria);

    if (dataset.examples.length === 0) {
      throw new Error(`No calibration examples found for criteria: ${this.criteria}`);
    }

    const judgments: Array<{
      example: CalibrationExample;
      predicted: number;
      actual: number;
      match: boolean;
    }> = [];

    let completed = 0;

    const processExample = async (example: CalibrationExample) => {
      try {
        const judgment = await this.engine.judge(example.context);
        judgments.push({
          example,
          predicted: judgment.score,
          actual: example.humanLabel,
          match: this.scoresMatch(judgment.score, example.humanLabel),
        });
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), {
          exampleId: example.id,
          criteria: this.criteria,
        });
      }
      completed++;
      this.onProgress?.(completed, dataset.examples.length);
    };

    for (let i = 0; i < dataset.examples.length; i += this.concurrency) {
      const chunk = dataset.examples.slice(i, i + this.concurrency);
      await Promise.all(chunk.map(processExample));
    }

    const predictedScores = judgments.map((j) => j.predicted);
    const humanLabels = judgments.map((j) => j.actual);

    const report = CalibrationMetrics.generateReport(
      predictedScores.map((score) => ({
        id: `cal-${randomUUID()}`,
        criteria: this.criteria,
        score,
        reasoning: '',
        confidence: 1,
        cost: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          inputCost: 0,
          outputCost: 0,
          totalCost: 0,
          currency: 'USD',
        },
        metadata: { retries: 0, synthetic: true },
        timestamp: new Date(),
        provider: 'calibration-runner',
        model: 'calibration-runner',
        templateVersion: '1.0.0',
      })),
      humanLabels,
    );

    return {
      report,
      dataset,
      judgments,
      failed: dataset.examples.length - judgments.length,
    };
  }

  private scoresMatch(predicted: number, actual: number): boolean {
    const discretize = (score: number) => Math.min(2, Math.floor(score * 3));
    return discretize(predicted) === discretize(actual);
  }
}
