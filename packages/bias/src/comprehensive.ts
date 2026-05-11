import type { JudgmentEngine } from '@reaatech/llm-judge-engine';
import type { TemplateContext } from '@reaatech/llm-judge-templates';
import type { PositionBiasReport } from '@reaatech/llm-judge-types';
import type { LengthBiasReport } from './length.js';
import { LengthBiasDetector } from './length.js';
import { PositionBiasDetector } from './position.js';
import type { StyleBiasReport } from './style.js';
import { StyleBiasDetector } from './style.js';

export interface ComprehensiveBiasReport {
  hasBias: boolean;
  positionBias?: PositionBiasReport;
  lengthBias?: LengthBiasReport;
  styleBias?: StyleBiasReport;
  recommendation: string;
}

export class ComprehensiveBiasDetector {
  private positionDetector: PositionBiasDetector;
  private lengthDetector: LengthBiasDetector;
  private styleDetector: StyleBiasDetector;

  constructor(options?: {
    positionThreshold?: number;
    lengthThreshold?: number;
    styleThreshold?: number;
  }) {
    this.positionDetector = new PositionBiasDetector(options?.positionThreshold ?? 0.1);
    this.lengthDetector = new LengthBiasDetector(options?.lengthThreshold ?? 0.3);
    this.styleDetector = new StyleBiasDetector(options?.styleThreshold ?? 0.1);
  }

  async detectPosition(
    judge: JudgmentEngine,
    candidates: Array<{ id: string; content: string }>,
    context?: Omit<TemplateContext, 'candidates'>,
  ): Promise<PositionBiasReport> {
    return this.positionDetector.detect(judge, candidates, context);
  }

  async detectLength(
    judge: JudgmentEngine,
    responses: Array<{ id: string; content: string; context?: TemplateContext }>,
  ): Promise<LengthBiasReport> {
    return this.lengthDetector.detect(judge, responses);
  }

  async detectStyle(
    judge: JudgmentEngine,
    baseResponse: string,
    context: TemplateContext,
  ): Promise<StyleBiasReport> {
    return this.styleDetector.detect(judge, baseResponse, context);
  }

  async runAll(
    judge: JudgmentEngine,
    options: {
      candidates?: Array<{ id: string; content: string }>;
      candidateContext?: Omit<TemplateContext, 'candidates'>;
      responses?: Array<{ id: string; content: string; context?: TemplateContext }>;
      styleBaseResponse?: string;
      styleContext?: TemplateContext;
    },
  ): Promise<ComprehensiveBiasReport> {
    const report: ComprehensiveBiasReport = {
      hasBias: false,
      recommendation: '',
    };

    const recommendations: string[] = [];

    if (options.candidates && options.candidates.length >= 2) {
      report.positionBias = await this.detectPosition(
        judge,
        options.candidates,
        options.candidateContext,
      );
      if (report.positionBias.hasBias) {
        report.hasBias = true;
        recommendations.push(report.positionBias.recommendation);
      }
    }

    if (options.responses && options.responses.length > 0) {
      report.lengthBias = await this.detectLength(judge, options.responses);
      if (report.lengthBias.hasBias) {
        report.hasBias = true;
        recommendations.push(report.lengthBias.recommendation);
      }
    }

    if (options.styleBaseResponse && options.styleContext) {
      report.styleBias = await this.detectStyle(
        judge,
        options.styleBaseResponse,
        options.styleContext,
      );
      if (report.styleBias.hasBias) {
        report.hasBias = true;
        recommendations.push(report.styleBias.recommendation);
      }
    }

    report.recommendation = report.hasBias
      ? recommendations.join(' ')
      : 'No significant biases detected across all tested dimensions.';

    return report;
  }
}
