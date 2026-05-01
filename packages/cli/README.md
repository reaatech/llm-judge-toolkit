# @reaatech/llm-judge-cli

[![npm version](https://img.shields.io/npm/v/@reaatech/llm-judge-cli.svg)](https://www.npmjs.com/package/@reaatech/llm-judge-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/reaatech/llm-judge-toolkit/ci.yml?branch=main&label=CI)](https://github.com/reaatech/llm-judge-toolkit/actions/workflows/ci.yml)

> **Status:** Pre-1.0 — APIs may change in minor versions. Pin to a specific version in production.

Command-line interface for LLM Judge Toolkit with evaluate and calibrate subcommands. Reads JSONL input, runs judgments through any provider+template combination, and outputs scored results.

## Installation

```bash
npm install @reaatech/llm-judge-cli
# or
pnpm add @reaatech/llm-judge-cli
```

## Feature Overview

- evaluate command for batch judgment evaluation
- calibrate command for calibration against human labels
- Multi-provider support (openai, anthropic, local) with env-var API keys
- JSONL input/output format compatible with jq and shell pipelines
- Configurable concurrency for batch processing
- Cache support for deduplication

## Quick Start

```bash
# Evaluate responses
llm-judge evaluate \
  --input ./input.jsonl \
  --output ./results.jsonl \
  --criteria faithfulness \
  --provider openai \
  --model gpt-4o-mini \
  --concurrency 5

# Calibrate against human labels
llm-judge calibrate \
  --input ./labeled.jsonl \
  --output ./report.json \
  --criteria faithfulness \
  --provider openai \
  --model gpt-4o-mini
```

### Input JSONL Format

**evaluate:**
```jsonl
{"id":"1","query":"What is X?","response":"X is...","context":"Source material..."}
{"id":"2","query":"What is Y?","response":"Y is...","context":"Source material..."}
```

**calibrate:**
```jsonl
{"id":"1","query":"What is X?","response":"X is...","context":"Source...","humanLabel":0.95}
{"id":"2","query":"What is Y?","response":"Y is...","context":"Source...","humanLabel":0.40}
```

## API Reference

### evaluate command

| Export | Description |
|--------|-------------|
| `--input` (`-i`) | Input JSONL file path (required) |
| `--output` (`-o`) | Output JSONL file path (default: stdout) |
| `--criteria` (`-c`) | Evaluation criteria: faithfulness, relevance, coherence, safety, tool-use |
| `--provider` (`-p`) | Provider: openai, anthropic, local (default: openai) |
| `--model` (`-m`) | Model name (default: gpt-4o-mini) |
| `--base-url` (`-b`) | Custom base URL for API endpoint |
| `--concurrency` (`-n`) | Concurrent evaluations (default: 3) |
| `--no-cache` | Disable caching |

| Environment Variable | Description |
|-----------------------|-------------|
| `OPENAI_API_KEY` | API key for OpenAI provider |
| `ANTHROPIC_API_KEY` | API key for Anthropic provider |
| `LLM_JUDGE_API_KEY` | Generic API key (fallback) |

### calibrate command

| Export | Description |
|--------|-------------|
| `--input` (`-i`) | Input JSONL file with humanLabel field (required) |
| `--output` (`-o`) | Output JSON report path (default: stdout) |
| `--criteria` (`-c`) | Evaluation criteria |
| `--provider` (`-p`) | Provider name (default: openai) |
| `--model` (`-m`) | Model name (default: gpt-4o-mini) |

### Programmatic API

| Export | Description |
|--------|-------------|
| `parseArgs()` | Parse CLI arguments into key-value record |
| `createProvider()` | Instantiate LLMProvider from parsed args |
| `createTemplate()` | Instantiate a JudgmentTemplate by criteria name |
| `readJsonlFile()` | Read and parse a JSONL file into an array |

## Related Packages

- [`@reaatech/llm-judge-engine`](https://www.npmjs.com/package/@reaatech/llm-judge-engine) — Judgment engine
- [`@reaatech/llm-judge-providers`](https://www.npmjs.com/package/@reaatech/llm-judge-providers) — Provider implementations
- [`@reaatech/llm-judge-calibration`](https://www.npmjs.com/package/@reaatech/llm-judge-calibration) — Calibration metrics
- [`@reaatech/llm-judge-cache`](https://www.npmjs.com/package/@reaatech/llm-judge-cache) — Caching for deduplication

## License

[MIT](https://github.com/reaatech/llm-judge-toolkit/blob/main/LICENSE)
