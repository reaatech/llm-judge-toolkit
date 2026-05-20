#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { CacheManager } from '@reaatech/llm-judge-cache';
import { CalibrationMetrics } from '@reaatech/llm-judge-calibration';
import { JudgmentEngine } from '@reaatech/llm-judge-engine';
import { BatchProcessor } from '@reaatech/llm-judge-infra';
import { AnthropicProvider, LocalProvider, OpenAIProvider } from '@reaatech/llm-judge-providers';
import {
  CoherenceTemplate,
  FaithfulnessTemplate,
  RelevanceTemplate,
  SafetyTemplate,
  ToolUseTemplate,
} from '@reaatech/llm-judge-templates';
import type { Judgment, LLMProvider } from '@reaatech/llm-judge-types';

const usage = `
Usage: llm-judge <command> [options]

Commands:
  evaluate    Evaluate responses using LLM-as-judge
  calibrate   Run calibration against human labels

Evaluate options:
  --input, -i       Input JSONL file (required)
  --output, -o      Output JSONL file (default: stdout)
  --criteria, -c    Evaluation criteria: faithfulness | relevance | coherence | safety | tool-use (required)
  --provider, -p    Provider: openai | anthropic | local (default: openai)
  --model, -m       Model name (default: gpt-4o-mini)
  --base-url, -b    Base URL for provider (optional)
  --concurrency, -n Number of concurrent evaluations (default: 3)
  --no-cache        Disable caching
  --help, -h        Show this help

API keys must be set via environment variables:
  OPENAI_API_KEY    For OpenAI provider
  ANTHROPIC_API_KEY For Anthropic provider
  LLM_JUDGE_API_KEY Generic API key for all providers

Calibrate options:
  --input, -i       Input JSONL file with human labels (required)
  --output, -o      Output report JSON file (default: stdout)
  --criteria, -c    Evaluation criteria (required)
  --provider, -p    Provider (default: openai)
  --model, -m       Model name (default: gpt-4o-mini)
  --help, -h        Show this help

Input JSONL format for evaluate:
  {"id":"1","query":"...","response":"...","context":"..."}

Input JSONL format for calibrate:
  {"id":"1","query":"...","response":"...","context":"...","humanLabel":0.95}
`;

export function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === '-h' || arg === '--help') {
      args.help = true;
      continue;
    }
    if (arg === '--no-cache') {
      args.cache = false;
    } else if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx);
        const value = arg.slice(eqIdx + 1);
        args[key] = value;
      } else {
        const key = arg.replace(/^--/, '');
        const next = argv[i + 1];
        if (next && !next.startsWith('-')) {
          args[key] = next;
          i++;
        } else {
          args[key] = true;
        }
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const shortMap: Record<string, string> = {
        h: 'help',
        i: 'input',
        o: 'output',
        c: 'criteria',
        p: 'provider',
        m: 'model',
        b: 'base-url',
        n: 'concurrency',
      };
      const key = shortMap[arg[1] ?? ''];
      if (key) {
        if (key === 'help') {
          args[key] = true;
        } else {
          const next = argv[i + 1];
          if (next && !next.startsWith('-')) {
            args[key] = next;
            i++;
          }
        }
      }
    }
  }
  return args;
}

export function createProvider(args: Record<string, string | boolean>): LLMProvider {
  const providerName = String(args.provider ?? 'openai');
  const baseURL = args['base-url'] ? String(args['base-url']) : undefined;

  switch (providerName) {
    case 'openai': {
      const key = process.env.OPENAI_API_KEY || process.env.LLM_JUDGE_API_KEY || '';
      if (!key)
        throw new Error(
          'OpenAI API key required. Set OPENAI_API_KEY or LLM_JUDGE_API_KEY environment variable.',
        );
      return new OpenAIProvider({ apiKey: key, baseURL });
    }
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY || process.env.LLM_JUDGE_API_KEY || '';
      if (!key)
        throw new Error(
          'Anthropic API key required. Set ANTHROPIC_API_KEY or LLM_JUDGE_API_KEY environment variable.',
        );
      return new AnthropicProvider({ apiKey: key, baseURL });
    }
    case 'local':
      return new LocalProvider({ baseURL });
    default:
      throw new Error(`Unknown provider: ${providerName}`);
  }
}

export function createTemplate(criteria: string) {
  switch (criteria) {
    case 'faithfulness':
      return new FaithfulnessTemplate();
    case 'relevance':
      return new RelevanceTemplate();
    case 'coherence':
      return new CoherenceTemplate();
    case 'safety':
      return new SafetyTemplate();
    case 'tool-use':
      return new ToolUseTemplate();
    default:
      throw new Error(`Unknown criteria: ${criteria}`);
  }
}

export function readJsonlFile(path: string): unknown[] {
  const lines = readFileSync(path, 'utf-8')
    .split('\n')
    .filter((l) => l.trim());
  const results: unknown[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    try {
      results.push(JSON.parse(line));
    } catch {
      throw new Error(`Invalid JSON at line ${i + 1} in ${path}: ${line.slice(0, 200)}`);
    }
  }
  return results;
}

async function evaluateCommand(args: Record<string, string | boolean>) {
  if (!args.input) throw new Error('--input required');
  if (!args.criteria) throw new Error('--criteria required');

  const provider = createProvider(args);
  const template = createTemplate(String(args.criteria));
  const cache = args.cache === false ? undefined : new CacheManager();
  const engine = new JudgmentEngine({
    provider,
    template,
    cache,
    config: { model: String(args.model ?? 'gpt-4o-mini') },
  });

  const concurrency = Number.parseInt(String(args.concurrency ?? '3'), 10);
  const processor = new BatchProcessor({ engine, concurrency });

  const raw = readJsonlFile(String(args.input));
  const items = raw.map((row: unknown) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? createHash('sha256').update(JSON.stringify(r)).digest('hex').slice(0, 16)),
      context: {
        query: r.query ? String(r.query) : undefined,
        response: r.response ? String(r.response) : undefined,
        context: r.context ? String(r.context) : undefined,
        candidates: Array.isArray(r.candidates) ? r.candidates : undefined,
        toolCalls: Array.isArray(r.toolCalls) ? r.toolCalls : undefined,
        toolOutputs: Array.isArray(r.toolOutputs) ? r.toolOutputs : undefined,
      },
    };
  });

  const results = await processor.process(items);

  const outputLines = results.map((r) =>
    JSON.stringify({
      id: r.id,
      score: r.judgment?.score ?? null,
      reasoning: r.judgment?.reasoning ?? null,
      confidence: r.judgment?.confidence ?? null,
      cost: r.judgment?.cost ?? null,
      error: r.error ? r.error.message : null,
      duration: r.duration,
    }),
  );

  const failedCount = results.filter((r) => r.error !== null).length;

  if (args.output) {
    writeFileSync(String(args.output), `${outputLines.join('\n')}\n`, 'utf-8');
    console.error(`Wrote ${results.length} results to ${args.output}`);
  } else {
    for (const line of outputLines) {
      console.log(line);
    }
  }

  if (failedCount > 0) {
    console.error(`${failedCount}/${results.length} evaluations failed`);
    process.exitCode = 1;
  }
}

async function calibrateCommand(args: Record<string, string | boolean>) {
  if (!args.input) throw new Error('--input required');
  if (!args.criteria) throw new Error('--criteria required');

  const provider = createProvider(args);
  const template = createTemplate(String(args.criteria));
  const engine = new JudgmentEngine({
    provider,
    template,
    config: { model: String(args.model ?? 'gpt-4o-mini') },
  });

  const raw = readJsonlFile(String(args.input));
  const items = raw.map((row: unknown) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? 'unknown'),
      context: {
        query: r.query ? String(r.query) : undefined,
        response: r.response ? String(r.response) : undefined,
        context: r.context ? String(r.context) : undefined,
      },
      humanLabel: Number(r.humanLabel ?? 0),
    };
  });

  const judgments: Array<{ judgment: Judgment; humanLabel: number }> = [];
  for (const item of items) {
    try {
      const judgment = await engine.judge(item.context);
      judgments.push({ judgment, humanLabel: item.humanLabel });
    } catch (error) {
      console.error(
        `Failed to judge ${item.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (judgments.length === 0) {
    console.error('No successful judgments to calibrate against');
    process.exit(1);
  }

  const report = CalibrationMetrics.generateReport(
    judgments.map((j) => j.judgment),
    judgments.map((j) => j.humanLabel),
  );

  const output = JSON.stringify(report, null, 2);

  if (args.output) {
    writeFileSync(String(args.output), output, 'utf-8');
    console.error(`Wrote calibration report to ${args.output}`);
  } else {
    console.log(output);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.error(usage);
    process.exit(0);
  }

  const command = process.argv[2]?.replace(/^-+/, '').toLowerCase();

  let aborted = false;
  process.on('SIGINT', () => {
    if (!aborted) {
      aborted = true;
      console.error('\nInterrupted. Shutting down...');
      process.exit(130);
    }
  });
  process.on('SIGTERM', () => {
    if (!aborted) {
      aborted = true;
      console.error('\nTerminated. Shutting down...');
      process.exit(143);
    }
  });

  if (command === 'evaluate') {
    await evaluateCommand(args);
  } else if (command === 'calibrate') {
    await calibrateCommand(args);
  } else {
    console.error(usage);
    process.exit(1);
  }
}

const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('cli.js') ||
  process.argv[1]?.endsWith('cli.cjs') ||
  process.argv[1]?.endsWith('cli.mjs') ||
  process.argv[1]?.endsWith('cli.ts');
if (isMainModule) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
