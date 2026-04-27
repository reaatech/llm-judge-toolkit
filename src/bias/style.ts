import type { JudgmentEngine } from '../engine/judge.js';
import type { TemplateContext } from '../templates/base.js';

export interface StyleBiasReport {
  hasBias: boolean;
  recommendation: string;
  details: Array<{
    style: string;
    originalScore: number;
    neutralScore: number;
    styleEffect: number;
  }>;
}

export class StyleBiasDetector {
  constructor(private threshold: number = 0.1) {}

  async detect(
    judge: JudgmentEngine,
    baseResponse: string,
    context: TemplateContext,
    styles: Array<{ name: string; transform: (text: string) => string }> = defaultStyleTransforms,
  ): Promise<StyleBiasReport> {
    const original = await judge.judge({ ...context, response: baseResponse });

    const details = [];
    for (const style of styles) {
      const styledResponse = style.transform(baseResponse);
      const styled = await judge.judge({ ...context, response: styledResponse });

      const styleEffect = Math.abs(original.score - styled.score);
      details.push({
        style: style.name,
        originalScore: original.score,
        neutralScore: styled.score,
        styleEffect,
      });
    }

    const maxEffect = Math.max(...details.map((d) => d.styleEffect));
    const hasBias = maxEffect > this.threshold;

    return {
      hasBias,
      recommendation: hasBias
        ? `Style bias detected (max effect=${maxEffect.toFixed(2)}). Consider style-normalized evaluation.`
        : 'No significant style bias detected.',
      details,
    };
  }
}

const defaultStyleTransforms = [
  {
    name: 'formal',
    transform: (text: string) =>
      text
        .replace(/\bdon't\b/gi, 'do not')
        .replace(/\bcan't\b/gi, 'cannot')
        .replace(/\bwon't\b/gi, 'will not')
        .replace(/!+/g, '.'),
  },
  {
    name: 'casual',
    transform: (text: string) =>
      text
        .replace(/\bdo not\b/gi, "don't")
        .replace(/\bcannot\b/gi, "can't")
        .replace(/(?<![0-9])\.(?![0-9])/g, '!'),
  },
  {
    name: 'bullet-points',
    transform: (text: string) =>
      text
        .split(/\.\s+/)
        .filter((s) => s.trim())
        .map((s) => `- ${s.trim()}`)
        .join('\n'),
  },
];
