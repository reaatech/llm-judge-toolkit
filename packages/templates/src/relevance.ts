import { EvaluationCriteriaSchema, TemplateError } from '@reaatech/llm-judge-types';
import type { JudgmentTemplate, ParsedJudgment, PromptRequest, TemplateContext } from './base.js';
import { cleanAndParse, parseFallback, safeScore } from './utils.js';

const MAX_INPUT_LENGTH = 500_000;

export class RelevanceTemplate implements JudgmentTemplate {
  readonly name = 'relevance';
  readonly version = '1.0.0';
  readonly criteria = EvaluationCriteriaSchema.enum.relevance;

  buildPrompt(context: TemplateContext): PromptRequest {
    if (!context.query) {
      throw new TemplateError('Relevance evaluation requires a query');
    }
    if (!context.response) {
      throw new TemplateError('Relevance evaluation requires a response');
    }

    const totalLength =
      context.query.length + context.response.length + (context.context?.length ?? 0);
    if (totalLength > MAX_INPUT_LENGTH) {
      throw new TemplateError(
        `Input too large (${totalLength} chars). Maximum allowed: ${MAX_INPUT_LENGTH}`,
      );
    }

    return {
      system: `You are an expert evaluator assessing the relevance of responses to queries.
Your task is to determine how well the response addresses the query.
Consider completeness, topicality, and whether all parts of multi-part questions are answered.
Score from 0.0 (completely irrelevant) to 1.0 (perfectly relevant).

Respond ONLY with a JSON object in this exact format:
{
  "score": 0.0-1.0,
  "reasoning": "detailed explanation of your assessment",
  "confidence": 0.0-1.0,
  "missing_aspects": ["any aspects of the query not addressed"]
}`,
      user: `## Query:
${context.query}

## Response to Evaluate:
${context.response}

${context.context ? `## Source Context:\n${context.context}\n` : ''}
## Instructions:
1. Identify what the query is asking for.
2. Check if the response addresses each aspect.
3. Score based on completeness and topicality.
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
          missingAspects: Array.isArray(parsed.missing_aspects) ? parsed.missing_aspects : [],
        },
      };
    } catch {
      return parseFallback(response);
    }
  }
}
