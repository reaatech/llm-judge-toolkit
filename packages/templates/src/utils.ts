import type { ParsedJudgment } from './base.js';

export function safeScore(value: unknown): number {
  if (value === null || value === undefined) return 0.5;
  const num = Number(value);
  if (Number.isNaN(num)) return 0.5;
  return Math.max(0, Math.min(1, num));
}

export function cleanAndParse(response: string): Record<string, unknown> {
  const cleaned = response
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/gi, '')
    .trim();
  return JSON.parse(cleaned);
}

export function parseFallback(response: string): ParsedJudgment {
  const scoreMatch = response.match(/(?:score|rating)\D*?([01]?\.?\d+)/i);
  const rawScore = scoreMatch ? parseFloat(scoreMatch[1]!) : 0.5;
  const score = Number.isNaN(rawScore) ? 0.5 : Math.max(0, Math.min(1, rawScore));

  return {
    score,
    reasoning: response.slice(0, 2000),
    confidence: 0.3,
    metadata: { parsedFallback: true },
  };
}
