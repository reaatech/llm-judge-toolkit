import type { JudgmentTemplate, TemplateContext, PromptRequest, ParsedJudgment } from './base.js';
import { EvaluationCriteriaSchema } from '../types/criteria.js';
import { TemplateError } from '../errors.js';
import { safeScore, cleanAndParse, parseFallback } from './utils.js';

const MAX_INPUT_LENGTH = 500_000;

export class ToolUseTemplate implements JudgmentTemplate {
  readonly name = 'tool-use';
  readonly version = '1.0.0';
  readonly criteria = EvaluationCriteriaSchema.enum['tool-use'] as 'tool-use';

  buildPrompt(context: TemplateContext): PromptRequest {
    if (!context.query) {
      throw new TemplateError('Tool-use evaluation requires a query');
    }
    if (!context.toolCalls || context.toolCalls.length === 0) {
      throw new TemplateError('Tool-use evaluation requires tool calls');
    }

    const toolCallsJson = JSON.stringify(context.toolCalls);
    const toolOutputsJson = context.toolOutputs ? JSON.stringify(context.toolOutputs) : '';
    const totalLength = context.query.length + toolCallsJson.length + toolOutputsJson.length;
    if (totalLength > MAX_INPUT_LENGTH) {
      throw new TemplateError(`Input too large (${totalLength} chars). Maximum allowed: ${MAX_INPUT_LENGTH}`);
    }

    return {
      system: `You are an expert evaluator assessing the correctness of tool use.
Your task is to validate tool selection appropriateness, parameter correctness, and output integration.
Score from 0.0 (completely incorrect) to 1.0 (perfectly correct).

Respond ONLY with a JSON object in this exact format:
{
  "score": 0.0-1.0,
  "reasoning": "detailed explanation of your assessment",
  "confidence": 0.0-1.0,
  "parameter_errors": ["any parameter errors found"]
}`,
      user: `## Query:
${context.query}

## Tool Calls:
${JSON.stringify(context.toolCalls, null, 2)}

## Tool Outputs:
${context.toolOutputs ? JSON.stringify(context.toolOutputs, null, 2) : 'N/A'}

## Instructions:
1. Check if the selected tools are appropriate for the query.
2. Validate parameter correctness and completeness.
3. Check if tool outputs are integrated correctly.
4. Score based on overall correctness.
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
          parameterErrors: Array.isArray(parsed.parameter_errors) ? parsed.parameter_errors : [],
        },
      };
    } catch {
      return parseFallback(response);
    }
  }
}
