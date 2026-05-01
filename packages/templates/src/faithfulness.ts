import { EvaluationCriteriaSchema, TemplateError } from '@reaatech/llm-judge-types';
import type { JudgmentTemplate, ParsedJudgment, PromptRequest, TemplateContext } from './base.js';
import { cleanAndParse, parseFallback, safeScore } from './utils.js';

const MAX_INPUT_LENGTH = 500_000;

export class FaithfulnessTemplate implements JudgmentTemplate {
  readonly name = 'faithfulness';
  readonly version = '1.0.0';
  readonly criteria = EvaluationCriteriaSchema.enum.faithfulness;

  buildPrompt(context: TemplateContext): PromptRequest {
    if (!context.context) {
      throw new TemplateError('Faithfulness evaluation requires context (source material)');
    }
    if (!context.response) {
      throw new TemplateError('Faithfulness evaluation requires a response');
    }

    const totalLength =
      context.context.length + (context.response?.length ?? 0) + (context.query?.length ?? 0);
    if (totalLength > MAX_INPUT_LENGTH) {
      throw new TemplateError(
        `Input too large (${totalLength} chars). Maximum allowed: ${MAX_INPUT_LENGTH}`,
      );
    }

    return {
      system: `You are an expert evaluator assessing the faithfulness of responses to source material.
Your task is to determine if the response is fully grounded in the provided context.
A response is faithful if every claim can be directly traced to the source material.
Score from 0.0 (completely unfaithful/hallucinated) to 1.0 (perfectly faithful).

Respond ONLY with a JSON object in this exact format:
{
  "score": 0.0-1.0,
  "reasoning": "detailed explanation of your assessment",
  "confidence": 0.0-1.0,
  "unsupported_claims": ["list any claims not supported by the source material"]
}`,
      user: `## Source Material:
${context.context}

## Query:
${context.query ?? 'N/A'}

## Response to Evaluate:
${context.response}

## Instructions:
1. Identify each claim in the response.
2. Check if each claim is supported by the source material.
3. Score based on the proportion of supported claims.
4. Provide detailed reasoning.`,
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
          unsupportedClaims: Array.isArray(parsed.unsupported_claims)
            ? parsed.unsupported_claims
            : [],
        },
      };
    } catch {
      return parseFallback(response);
    }
  }
}
