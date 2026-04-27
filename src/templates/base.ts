import type { EvaluationCriteria } from '../types/criteria.js';

export interface Candidate {
  id: string;
  content: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  output?: unknown;
}

export interface TemplateContext {
  query?: string;
  response?: string;
  context?: string;
  candidates?: Candidate[];
  toolCalls?: ToolCall[];
  toolOutputs?: unknown[];
  conversation?: Array<{ role: 'user' | 'assistant'; content: string }>;
  custom?: Record<string, unknown>;
}

export interface PromptRequest {
  system: string;
  user: string;
}

export interface ParsedJudgment {
  score: number;
  reasoning: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface JudgmentTemplate {
  readonly name: string;
  readonly version: string;
  readonly criteria: EvaluationCriteria;

  buildPrompt(context: TemplateContext): PromptRequest;
  parseResponse(response: string): ParsedJudgment;
}
