import type { JudgmentTemplate, TemplateContext, PromptRequest, ParsedJudgment } from './base.js';
import { EvaluationCriteriaSchema, TemplateError } from '@reaatech/llm-judge-types';
import { safeScore, cleanAndParse, parseFallback } from './utils.js';

const MAX_INPUT_LENGTH = 500_000;

export class CoherenceTemplate implements JudgmentTemplate {
  readonly name = 'coherence';
  readonly version = '1.0.0';
  readonly criteria = EvaluationCriteriaSchema.enum.coherence;

  buildPrompt(context: TemplateContext): PromptRequest {
    if (!context.response) {
      throw new TemplateError('Coherence evaluation requires a response');
    }

    if (context.response.length > MAX_INPUT_LENGTH) {
      throw new TemplateError(`Response too large (${context.response.length} chars). Maximum allowed: ${MAX_INPUT_LENGTH}`);
    }

    return {
      system: `You are an expert evaluator assessing the coherence of responses.
Your task is to evaluate logical flow, consistency, readability, and structure.
Detect contradictions, logical gaps, and disorganized presentation.
Score from 0.0 (completely incoherent) to 1.0 (perfectly coherent).

Respond ONLY with a JSON object in this exact format:
{
  "score": 0.0-1.0,
  "reasoning": "detailed explanation of your assessment",
  "confidence": 0.0-1.0,
  "contradictions": ["any contradictions found"]
}`,
      user: `## Response to Evaluate:
${context.response}

## Instructions:
1. Assess logical flow and transitions.
2. Check for internal consistency and contradictions.
3. Evaluate readability and structure.
4. Score based on overall coherence.
5. Provide detailed reasoning.`,
    };
  }

  parseResponse(response: string): ParsedJudgment {
    try {
      const parsed = cleanAndParse(response);

      const score = safeScore(parsed.score);
      const confidence = safeScore(parsed.confidence ?? 0.5);
      const reasoning = String(parsed.reasoning ?? 'No reasoning provided');

      return {
        score,
        reasoning,
        confidence,
        metadata: {
          contradictions: Array.isArray(parsed.contradictions) ? parsed.contradictions : [],
        },
      };
    } catch {
      return parseFallback(response);
    }
  }
}
