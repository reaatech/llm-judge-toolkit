import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import type { EvaluationCriteria } from '@reaatech/llm-judge-types';

const CalibrationExampleSchema = z.object({
  id: z.string().min(1),
  context: z.object({}).passthrough(),
  humanLabel: z.number().min(0).max(1),
  expectedCategory: z.enum(['good', 'bad', 'borderline']).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

const CalibrationDatasetSchema = z.object({
  criteria: z.string().min(1),
  version: z.string().min(1),
  description: z.string(),
  examples: z.array(CalibrationExampleSchema),
});

export type CalibrationExample = z.infer<typeof CalibrationExampleSchema>;

export interface CalibrationDataset {
  criteria: EvaluationCriteria;
  version: string;
  description: string;
  examples: CalibrationExample[];
}

function getDefaultDatasetsDir(): string {
  try {
    const filename = fileURLToPath(import.meta.url);
    return join(dirname(filename), 'datasets');
  } catch {
    if (typeof __dirname !== 'undefined') {
      return join(__dirname, 'datasets');
    }
    return join(process.cwd(), 'datasets');
  }
}

export class DatasetManager {
  private datasetsDir: string;

  constructor(datasetsDir?: string) {
    this.datasetsDir = datasetsDir ?? getDefaultDatasetsDir();
  }

  load(criteria: EvaluationCriteria): CalibrationDataset {
    if (criteria.includes('..') || criteria.includes('/') || criteria.includes('\\')) {
      throw new Error(`Invalid criteria name: ${criteria}`);
    }
    const filePath = join(this.datasetsDir, `${criteria}.json`);

    if (!existsSync(filePath)) {
      return {
        criteria,
        version: '0.0.0',
        description: `Empty dataset for ${criteria}`,
        examples: [],
      };
    }

    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const result = CalibrationDatasetSchema.safeParse(parsed);

    if (!result.success) {
      throw new Error(
        `Invalid dataset file ${filePath}: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
      );
    }

    return result.data as CalibrationDataset;
  }

  loadAll(): Map<EvaluationCriteria, CalibrationDataset> {
    const all = new Map<EvaluationCriteria, CalibrationDataset>();
    const criteria: EvaluationCriteria[] = [
      'faithfulness',
      'relevance',
      'coherence',
      'safety',
      'tool-use',
    ];

    for (const c of criteria) {
      all.set(c, this.load(c));
    }

    return all;
  }

  getStats(dataset: CalibrationDataset): {
    total: number;
    good: number;
    bad: number;
    borderline: number;
    averageLabel: number;
  } {
    let total = 0;
    let good = 0;
    let bad = 0;
    let borderline = 0;
    let labelSum = 0;

    for (const e of dataset.examples) {
      total++;
      labelSum += e.humanLabel;
      if (e.expectedCategory === 'good') good++;
      else if (e.expectedCategory === 'bad') bad++;
      else if (e.expectedCategory === 'borderline') borderline++;
    }

    const averageLabel = total === 0 ? 0 : labelSum / total;

    return { total, good, bad, borderline, averageLabel };
  }
}
