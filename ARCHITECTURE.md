# LLM Judge Toolkit — Technical Architecture

## Monorepo Overview

```
llm-judge-toolkit/                   (private root, pnpm@10.22.0)
├── packages/
│   ├── types/         @reaatech/llm-judge-types        Core types, Zod schemas, errors
│   ├── providers/     @reaatech/llm-judge-providers    OpenAI, Anthropic, Local, Factory
│   ├── templates/     @reaatech/llm-judge-templates    5 criteria templates + base + utils
│   ├── engine/        @reaatech/llm-judge-engine       JudgmentEngine, EventBus, RateLimiter
│   ├── consensus/     @reaatech/llm-judge-consensus    3 voting strategies
│   ├── calibration/   @reaatech/llm-judge-calibration  Metrics, dataset, runner, drift + 5 JSON datasets
│   ├── bias/          @reaatech/llm-judge-bias         Position, length, style, comprehensive detectors
│   ├── cache/         @reaatech/llm-judge-cache        Manager, InMemory, File, Redis backends
│   ├── infra/         @reaatech/llm-judge-infra        Cost tracker, logger, metrics, batch processor
│   └── cli/           @reaatech/llm-judge-cli          evaluate + calibrate commands
├── examples/
│   └── 01-basic-judgment/                              Basic engine + provider + template usage
├── .github/workflows/
│   ├── ci.yml             Node 20+22 matrix, build → typecheck → lint → test
│   └── release.yml        Changesets release + GitHub Packages mirror
├── biome.json             Linting and formatting (Biome 1.9)
├── turbo.json             Task orchestration (Turborepo 2.5)
├── tsconfig.json          Base TypeScript config (NodeNext, ES2022, strict)
└── tsconfig.typecheck.json  Root-level typecheck with path aliases for all packages
```

Every package publishes dual CJS/ESM output via tsup with `--format cjs,esm --dts --clean`. All packages use `NodeNext` module resolution with `verbatimModuleSyntax`. The CLI package is the sole consumer of all other packages; it has a `bin` entry (`llm-judge`) for direct invocation.

## Package Dependency Graph

```
types
├── providers
├── templates
├── consensus
└── cache
     └── templates                  (CacheManager.buildCacheKey uses TemplateContext)

types + templates                     → engine
types + engine                        → bias, infra
types + engine + templates            → bias
types + engine + infra                → calibration
providers + templates + engine + calibration + cache + infra  → cli
```

Dependency edges confirmed from `package.json` files:

| Package      | Depends on                                              |
|-------------|---------------------------------------------------------|
| types       | zod                                                     |
| providers   | types, peerDeps: openai (optional), @anthropic-ai/sdk   |
| templates   | types                                                   |
| engine      | types, templates, cache                                 |
| consensus   | types                                                   |
| calibration | types, engine, infra, zod                               |
| bias        | types, engine, templates                                |
| cache       | types, templates                                        |
| infra       | types, engine, templates, pino                          |
| cli         | types, providers, templates, engine, calibration, cache, infra |

## Package Details

### 1. `@reaatech/llm-judge-types` (packages/types)

**Files:** `criteria.ts`, `provider.ts`, `cost.ts`, `cache.ts`, `judgment.ts`, `config.ts`, `consensus.ts`, `calibration.ts`, `bias.ts`, `events.ts`, `errors.ts`, `index.ts`

**Key exports:**

- **Error hierarchy** (`errors.ts`): `JudgeError` (base, with `code` string and optional `cause`) → `ProviderError`, `ValidationError`, `BudgetExceededError`, `TemplateError`, `CacheError`
- **Criteria** (`criteria.ts`): `EvaluationCriteriaSchema` — Zod enum of `faithfulness | relevance | coherence | safety | tool-use | custom`. `CriteriaConfigSchema` with weight, threshold, customPrompt, rubric.
- **Provider** (`provider.ts`): `LLMProvider` interface — `generateCompletion()`, `countTokens()`, `calculateCost()`, `checkHealth()`. `ProviderNameSchema` — `openai | anthropic | local`. `CompletionRequestSchema`, `CompletionResponseSchema`, `TokenUsageSchema`, `ModelInfoSchema`, `HealthStatusSchema`.
- **Judgment** (`judgment.ts`): `JudgmentSchema` — id (UUID), criteria, score (0-1), reasoning, confidence, cost, metadata, timestamp, provider, model, templateVersion, rawResponse. `ConsensusJudgmentSchema` — id, individualJudgments, finalScore, agreementScore, method, tiebreakerUsed.
- **Cache** (`cache.ts`): `CacheConfigSchema` — enabled, backend (`memory | file | redis | database`), ttl, maxSize, prefix. `CacheItemSchema` — judgment, cachedAt, expiresAt, accessCount, lastAccessed. `CacheBackend` interface — get, set, delete, touch, clear.
- **Consensus** (`consensus.ts`): `ConsensusStrategy` interface — `name` + `execute(judgments: Judgment[]): ConsensusResult`. `ConsensusResultSchema`.
- **Calibration** (`calibration.ts`): `CalibrationReportSchema` — cohensKappa, accuracy, precision, recall, f1Score, confusionMatrix, sampleSize, timestamp. `ConfusionMatrixSchema`.
- **Bias** (`bias.ts`): `PositionBiasReportSchema` — hasBias, averageBias, biasByPosition, recommendation.
- **Events** (`events.ts`): `JudgmentEvent` discriminated union — `judgment:completed`, `judgment:cached`, `judgment:error`, `consensus:completed`, `budget:exceeded`, `calibration:completed`, `bias:detected`. `EventBus` interface — `emit`, `on`, `off`.
- **Config** (`config.ts`): `JudgeConfigSchema` — provider, model, cache, cost, calibration, bias, monitoring sub-objects.

### 2. `@reaatech/llm-judge-providers` (packages/providers)

**Files:** `openai.ts`, `anthropic.ts`, `local.ts`, `factory.ts`, `index.ts`

All providers implement the `LLMProvider` interface from `@reaatech/llm-judge-types`. Each uses lazy client initialization (dynamic `import()` for SDK dependencies) and wraps errors in `ProviderError`.

- **`OpenAIProvider`**: Wraps the `openai` SDK (v4), lazy-loaded. Models: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`. Per-model pricing (per million tokens). `countTokens()` uses a character-count heuristic (`ceil(length/4)`). `checkHealth()` fires a minimal completion to `gpt-4o-mini`.
- **`AnthropicProvider`**: Wraps `@anthropic-ai/sdk`, lazy-loaded. Models: `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`. Extracts `system` messages separately (Anthropic API has a dedicated system field). Converts non-`user`/`assistant` roles to errors. Validates that the response contains text content (not tool-use only).
- **`LocalProvider`**: OpenAI-compatible HTTP client via `fetch`. Defaults to `http://localhost:11434/v1`. Supports `Authorization: Bearer` header if API key is provided. Handles AbortController timeouts. `calculateCost()` always returns zero cost.
- **`ProviderFactory`**: Static factory with `create()` and `fromEnv()` methods. `create()` accepts `name`, `apiKey`, `baseURL`, `timeout`. `fromEnv()` reads `LLM_JUDGE_PROVIDER` (defaults to `openai`), `LLM_JUDGE_API_KEY`, `LLM_JUDGE_BASE_URL`, `LLM_JUDGE_TIMEOUT`. Falls back to `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` as appropriate. Validates unknown providers.

### 3. `@reaatech/llm-judge-templates` (packages/templates)

**Files:** `base.ts`, `utils.ts`, `faithfulness.ts`, `relevance.ts`, `coherence.ts`, `safety.ts`, `tool-use.ts`, `index.ts`

All templates implement `JudgmentTemplate`: `name`, `version`, `criteria`, `buildPrompt(context)`, `parseResponse(response)`. Each template has a 500 KB `MAX_INPUT_LENGTH` limit.

- **`FaithfulnessTemplate`** (v1.0.0): Requires both `context` (source material) and `response`. Produces a JSON response with `score`, `reasoning`, `confidence`, and `unsupported_claims`.
- **`RelevanceTemplate`** (v1.0.0): Evaluates whether a response directly addresses the query.
- **`CoherenceTemplate`** (v1.0.0): Evaluates logical flow, structure, and readability.
- **`SafetyTemplate`** (v1.0.0): Requires only `response`. Checks for harmful content, bias, privacy violations, and misinformation. JSON output includes `violations` array.
- **`ToolUseTemplate`** (v1.0.0): Evaluates tool call selection and argument correctness.

**Utility functions** (`utils.ts`):
- `safeScore(value)` — Clamps to 0-1, defaults to 0.5 for NaN/null/undefined.
- `cleanAndParse(response)` — Strips markdown code fences, then `JSON.parse`.
- `parseFallback(response)` — Regex extract from score/rating patterns, low confidence (0.3), truncates reasoning to 2000 chars.

Key interfaces in `base.ts`: `Candidate` (id + content), `ToolCall` (name + arguments + output), `TemplateContext` (query, response, context, candidates, toolCalls, toolOutputs, conversation, custom), `PromptRequest` (system + user strings), `ParsedJudgment` (score, reasoning, confidence, optional metadata).

### 4. `@reaatech/llm-judge-engine` (packages/engine)

**Files:** `judge.ts`, `bus.ts`, `rate-limiter.ts`, `index.ts`

- **`JudgmentEngine`**: Takes `provider` (LLMProvider), `template` (JudgmentTemplate), and optional `cache` (CacheManager), `eventBus` (EventBus), `rateLimiter` (RateLimiter), `config` (Partial\<EngineConfig>). Default config: `model: 'gpt-4o-mini'`, `temperature: 0.1`, `maxTokens: 2000`, `cacheEnabled: true`, `maxRetries: 3`, `retryDelay: 1000`.

  `judge(context)` flow:
  1. Check cache (SHA-256 content-addressed key, built via `CacheManager.buildCacheKey`). On hit, emit `judgment:cached`.
  2. Call `template.buildPrompt(context)`.
  3. Validate prompt (non-empty strings).
  4. `executeWithRetry(prompt)` — with exponential backoff and opt-in `rateLimiter.acquire()`. Retries on rate limits, timeouts, server errors (429, 500, 503, connection errors). Non-retryable errors are re-thrown immediately.
  5. Call `template.parseResponse(response.content)`.
  6. `createJudgment()` — normalizes score and confidence to 0-1, calls `provider.calculateCost()`, assembles full `Judgment` with UUID, metadata.
  7. Cache result (if enabled), emit `judgment:completed`.
  8. Return `Judgment`.

- **`InMemoryEventBus`**: Implements `EventBus` interface. In-memory `Map<string, Set<EventHandler>>`. Supports `emit`, `on`, `off`, `removeAllListeners`, `listenerCount`.

- **`RateLimiter`**: Token bucket algorithm. Configurable `tokensPerInterval`, `intervalMs`, optional `maxTokens`. `acquire(tokens)` returns a Promise that resolves when tokens are available. `tryAcquire()` is non-blocking. Tokens refill continuously based on elapsed time.

### 5. `@reaatech/llm-judge-consensus` (packages/consensus)

**Files:** `strategies.ts`, `index.ts`

Three strategies implementing `ConsensusStrategy`:

- **`MajorityVoting`**: Confidence-weighted average. Computes agreement as `1 - min(1, sqrt(variance) * 2)`. Returns `finalScore` clamped to 0-1.
- **`CheapFirstTiebreaker`**: Splits judgments into N cheap + remaining tiebreakers. If cheap judges (first two) agree within threshold (score diff ≤ 0.2), returns their average without tiebreakers. Otherwise averages all judges including tiebreakers. Configurable `cheapCount` (defaults to 2).
- **`WeightedVoting`**: User-provided weight array matched to judgments. Same confidence-weighted computation but with explicit external weights instead of judgment confidence. Validates non-negative weights and length match.

All strategies use a shared `computeAgreement()` helper based on score variance.

### 6. `@reaatech/llm-judge-calibration` (packages/calibration)

**Files:** `metrics.ts`, `dataset.ts`, `runner.ts`, `drift.ts`, `index.ts`

**Gold-standard datasets:** `src/datasets/faithfulness.json`, `relevance.json`, `coherence.json`, `safety.json`, `tool-use.json` (5 JSON files).

- **`CalibrationMetrics`**: Static methods. `cohensKappa()` — discretizes scores into 3 bins (0-0.33, 0.34-0.66, 0.67-1.0), computes observed vs expected agreement. `confusionMatrix()` — multi-class matrix with configurable thresholds. `accuracy()`, `precisionRecallF1()` — per-class metrics on the highest bin (positiveClass=2). `generateReport()` — combines all metrics into a `CalibrationReport`.

- **`DatasetManager`**: Loads JSON gold-standard datasets from a configurable directory. Validates with Zod (`CalibrationDatasetSchema`). Handles missing files gracefully (returns empty dataset). `loadAll()` loads all 5 criteria. `getStats()` computes total/good/bad/borderline counts and average label.

- **`CalibrationRunner`**: Takes an `engine` (JudgmentEngine), `criteria`, optional `datasetsDir`, `concurrency` (default 3), and `onProgress` callback. `run()`: loads dataset → processes examples in chunks with `Promise.all` → builds synthetic Judgment objects from scores → calls `CalibrationMetrics.generateReport()`. Returns predictions vs actuals per example plus failed count.

- **`DriftDetector`**: Compares two `CalibrationReport` objects (baseline vs current). Computes `cohensKappaDelta` and `accuracyDelta`. Flags drift if either delta exceeds configurable thresholds (default 0.1). Produces a recommendation with context (degradation vs improvement).

### 7. `@reaatech/llm-judge-bias` (packages/bias)

**Files:** `position.ts`, `length.ts`, `style.ts`, `comprehensive.ts`, `index.ts`

- **`PositionBiasDetector`**: Runs two judgments — original candidate order and reversed order — then compares aggregate scores. Position effect is the absolute difference. `detect()` returns a `PositionBiasReport` with `hasBias` flag, average bias, and recommendation. `debias()` runs both orders in parallel and returns a judgment with averaged score and confidence.

- **`LengthBiasDetector`**: Evaluates multiple responses, collecting scores and character lengths. Computes Pearson correlation between length and score. If |r| exceeds threshold (default 0.3), flags as biased. Returns `LengthBiasReport` with correlation, per-item detail, and recommendation.

- **`StyleBiasDetector`**: Transforms a base response through three style profiles — formal (contractions expanded, exclamation points removed), casual (contractions added, periods → exclamation points), bullet-points (sentences split into list). Then evaluates each variant against the original. Max style effect above threshold (default 0.1) triggers a bias flag.

- **`ComprehensiveBiasDetector`**: Orchestrates all three detectors via `runAll()`. Accepts optional input for each detector dimension. Aggregates findings into a `ComprehensiveBiasReport` with combined `hasBias` flag and concatenated recommendations.

### 8. `@reaatech/llm-judge-cache` (packages/cache)

**Files:** `manager.ts`, `backends.ts`, `redis.ts`, `index.ts`

- **`CacheManager`**: Wraps a `CacheBackend`. `get(key)` — checks enabled flag, validates expiration, touches access time, returns `CacheItem.judgment`. `set(key, judgment)` — creates `CacheItem` with TTL-based `expiresAt`. `delete()`, `clear()`. `buildCacheKey(params)` — SHA-256 hash of provider + model + template name/version + normalized context + temperature. Returns format: `{templateName}:{templateVersion}:{hash}`. Normalization trims strings, sorts candidates by ID, sorts tool calls by name.

- **`InMemoryCache`**: `Map`-based store with LRU eviction at `maxSize` (default 10000). On set when full, evicts the oldest entry by `cachedAt`. Checks expiration on get.

- **`FileCache`**: Filesystem backend (`~/.cache/llm-judge/` or configurable path). SHA-256 hashed filenames. Atomic writes via temp file + rename. JSON serialization with Date reviver. Handles ENOENT on clear gracefully.

- **`RedisCache`**: Takes a RedisLike interface (compatible with `ioredis`/`node-redis`). Configurable TTL in seconds (default 86400) and key prefix. Expires on set via `setex`. Clear uses `keys` pattern match + `del` batch.

### 9. `@reaatech/llm-judge-infra` (packages/infra)

**Files:** `tracker.ts`, `logger.ts`, `metrics.ts`, `processor.ts`, `index.ts`

- **`CostTracker`**: Stores judgments in a Map. Optional budget with period (`daily | weekly | monthly`) and alert threshold. `track()` throws `BudgetExceededError` on overflow and emits `budget:exceeded` event. `generateReport()` produces totalCost, judgmentCount, averageCostPerJudgment, and breakdowns by criteria/provider/model.

- **Logger** (`logger.ts`): Pino instance (`LOG_LEVEL` env, ISO timestamps). Helper functions: `logJudgment()`, `logError()`, `logCacheHit()`, `logCacheMiss()`, `logBudgetExceeded()` — all structured with event names.

- **`MetricsCollector`**: Counts judgments, cache hits/misses, failures, total latency, total score, total cost. `recordJudgment(score, latency, cost, cached)` increments counters. `snapshot()` returns `MetricsSnapshot`: judgmentsTotal, judgmentsCached, judgmentsFailed, averageLatency, averageScore, totalCost, cacheHitRate.

- **`BatchProcessor`**: Takes `engine` (JudgmentEngine), `concurrency` (default 3), optional `onProgress` and `onError` callbacks. `process(items)` — processes `BatchItem[]` in concurrent chunks with `Promise.all`, returns `BatchResult[]` (each with judgment or error + duration). `processWithRetry()` — recursive retry of failed items (maxRetries default 2), only retrying retryable errors (rate limit, timeout, 503, server error).

### 10. `@reaatech/llm-judge-cli` (packages/cli)

**Files:** `cli.ts`, `index.ts`

`cli.ts` serves as both the `bin` entrypoint (`#!/usr/bin/env node`) and an exported module. The binary is `llm-judge`.

**Helper functions exported for reuse:**
- `parseArgs(argv)` — Simple `--key value` / `-k value` / `--no-cache` parser. Supports short flags: `-i` (input), `-o` (output), `-c` (criteria), `-p` (provider), `-m` (model), `-b` (base-url), `-n` (concurrency), `-h` (help).
- `createProvider(args)` — Maps `openai`/`anthropic`/`local` to concrete provider instances using `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `LLM_JUDGE_API_KEY` env vars.
- `createTemplate(criteria)` — Maps criteria string to template class.
- `readJsonlFile(path)` — Reads and parses JSONL, throws on invalid JSON with line number.

**Commands:**

`evaluate` — Reads input JSONL (`id`, `query`, `response`, `context`, optional `candidates`/`toolCalls`/`toolOutputs`). Creates `JudgmentEngine` + `BatchProcessor`. Outputs scored JSONL with `id`, `score`, `reasoning`, `confidence`, `cost`, `error`, `duration`. Exit code 1 if any evaluations fail.

`calibrate` — Reads input JSONL with `humanLabel` field. Iterates serially through items (no batch), collects judgments. Calls `CalibrationMetrics.generateReport()`. Outputs JSON calibration report with cohensKappa, accuracy, precision, recall, f1Score, confusionMatrix, sampleSize.

Both commands handle SIGINT (exit 130) and SIGTERM (exit 143) for graceful shutdown.

## Data Flow

### Judgment Flow

```
Client
  └→ JudgmentEngine.judge(context)
       ├→ CacheManager.buildCacheKey(context)           — SHA-256 content-addressed key
       ├→ CacheManager.get(key)                         — check InMemory/File/Redis
       │   └→ [hit] InMemoryEventBus.emit("judgment:cached") → return cached Judgment
       ├→ template.buildPrompt(context)                  — criteria-specific prompt
       ├→ validatePrompt(prompt)                         — non-empty string check
       ├→ executeWithRetry(prompt)
       │   ├→ rateLimiter?.acquire(1)                    — token bucket wait
       │   ├→ provider.generateCompletion(request)       — OpenAI/Anthropic/Local HTTP
       │   │   └→ calculateCost(usage)                   — per-model pricing
       │   └→ [error] exponential backoff, max 3 retries (rate-limit/timeout/5xx only)
       ├→ template.parseResponse(response.content)      — JSON parse with fallback
       ├→ createJudgment(context, parsed, response)      — normalize score+confidence, UUID
       ├→ CacheManager.set(key, judgment)                — store with TTL
       └→ InMemoryEventBus.emit("judgment:completed")    — notify listeners
```

### Consensus Flow

```
Client
  └→ strategy.execute(judgments: Judgment[])
       ├─ MajorityVoting
       │   └→ weightedSum(scores, confidences) / totalWeight → finalScore
       │   └→ agreement = 1 − min(1, √variance × 2)
       │
       ├─ CheapFirstTiebreaker (cheapCount=N)
       │   ├→ cheapJudgments = judgments[0..N]
       │   ├→ tiebreakers = judgments[N..]
       │   ├→ [|cheap[0].score − cheap[1].score| < 0.2 && no tiebreakers]
       │   │   └→ return (cheap[0] + cheap[1]) / 2, tiebreakerUsed=false
       │   └→ [else]
       │       └→ average(all cheap + tiebreakers), tiebreakerUsed=true
       │
       └─ WeightedVoting (weights[])
           └→ weightedSum(scores, weights) / totalWeight → finalScore
           └→ agreement based on score variance
```

### Calibration Flow

```
Client
  └→ CalibrationRunner.run()
       ├→ DatasetManager.load(criteria)                  — load {criteria}.json
       ├→ for each chunk of examples (concurrency=3):
       │   └→ engine.judge(example.context)
       │       ├→ [success] collect {predicted, actual, match}
       │       └→ [failure] logError, skip
       ├→ Build synthetic Judgment[] from predictions
       └→ CalibrationMetrics.generateReport(predictions, humanLabels)
           ├→ confusionMatrix → accuracy
           ├→ precisionRecallF1
           ├→ cohensKappa
           └→ return CalibrationReport
```

## Key Interfaces

```typescript
// @reaatech/llm-judge-types — provider.ts
interface LLMProvider {
  readonly name: string;
  readonly models: ModelInfo[];
  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
  countTokens(text: string): number;
  calculateCost(usage: TokenUsage): CostBreakdown;
  checkHealth(): Promise<HealthStatus>;
}

// @reaatech/llm-judge-templates — base.ts
interface JudgmentTemplate {
  readonly name: string;
  readonly version: string;
  readonly criteria: EvaluationCriteria;
  buildPrompt(context: TemplateContext): PromptRequest;
  parseResponse(response: string): ParsedJudgment;
}

// @reaatech/llm-judge-types — cache.ts
interface CacheBackend {
  get(key: string): Promise<CacheItem | null>;
  set(key: string, item: CacheItem): Promise<void>;
  delete(key: string): Promise<void>;
  touch(key: string): Promise<void>;
  clear(): Promise<void>;
}

// @reaatech/llm-judge-types — events.ts
interface EventBus {
  emit<T extends JudgmentEvent['type']>(
    event: T,
    payload: Omit<Extract<JudgmentEvent, { type: T }>, 'type'>,
  ): void;
  on<T extends JudgmentEvent['type']>(
    event: T,
    handler: (payload: Omit<Extract<JudgmentEvent, { type: T }>, 'type'>) => void,
  ): void;
  off<T extends JudgmentEvent['type']>(
    event: T,
    handler: (payload: Omit<Extract<JudgmentEvent, { type: T }>, 'type'>) => void,
  ): void;
}

// @reaatech/llm-judge-types — consensus.ts
interface ConsensusStrategy {
  name: string;
  execute(judgments: Judgment[]): ConsensusResult;
}
```

## Build System and Tooling

| Tool | Purpose | Configuration |
|------|---------|--------------|
| **pnpm 10.22.0** | Package manager, workspace orchestration | `pnpm-workspace.yaml` (packages/*, examples/*) |
| **Turborepo 2.5** | Task orchestration, caching | `turbo.json` — build depends on ^build, test depends on build |
| **tsup 8.4** | Build tool (ESBuild-based) | Per-package: `tsup src/index.ts --format cjs,esm --dts --clean` |
| **TypeScript 5.8** | Type checking | `tsconfig.json` — target ES2022, module NodeNext, strict, verbatimModuleSyntax |
| **Biome 1.9** | Linting and formatting | `biome.json` — recommended rules + noExplicitAny + noNonNullAssertion, single quotes, trailing commas |
| **Vitest 3.1** | Testing | Per-package `vitest run`, coverage via `@vitest/coverage-v8` |
| **Changesets 2.28** | Versioning and changelog | `.changeset/config.json` with GitHub changelog generator |
| **Zod 3.24** | Schema validation | Used in types, templates, calibration, cached throughout |
| **Pino 9.6** | Structured logging | In infra package, `LOG_LEVEL` env, ISO timestamps |

**tsconfig.typecheck.json** provides root-level type checking with path aliases mapping each `@reaatech/llm-judge-*` package to its `src/index.ts`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@reaatech/llm-judge-types": ["./packages/types/src/index.ts"],
      "@reaatech/llm-judge-providers": ["./packages/providers/src/index.ts"],
      // ... all 10 packages
    }
  }
}
```

## Testing Strategy

Tests are colocated with source using `*.test.ts` naming, run via Vitest. The CI pipeline (`.github/workflows/ci.yml`) runs on Ubuntu with Node 20 and 22 in a matrix:

```
checkout → pnpm setup → pnpm install --frozen-lockfile → pnpm build → pnpm typecheck → pnpm lint → pnpm test
```

Key patterns:
- Unit tests with mocked providers and templates for isolated logic testing
- `vitest run` in each package, with `test:coverage` using V8 coverage provider
- Root-level `turbo run test` orchestration with build dependencies
- No end-to-end tests requiring live API keys in CI (tests use mocked clients)

## CI/CD Pipeline

- **CI (`ci.yml`)**: Runs on push/PR to `main`. Node 20 + 22 matrix. Steps: install → build → typecheck → lint → test. Uses `pnpm/action-setup` and `actions/setup-node` with pnpm cache.
- **Release (`release.yml`)**: Manual trigger via `workflow_dispatch`. Runs on Node 22. Uses `changesets/action` to create release PRs and publish to npm registry. After publishing, mirrors all published packages to GitHub Packages (`https://npm.pkg.github.com`) using a generated `.npmrc`.

## Environment Variables

| Variable | Used By | Default |
|----------|---------|---------|
| `OPENAI_API_KEY` | OpenAIProvider, ProviderFactory, CLI | — |
| `ANTHROPIC_API_KEY` | AnthropicProvider, ProviderFactory, CLI | — |
| `LLM_JUDGE_PROVIDER` | ProviderFactory.fromEnv() | `openai` |
| `LLM_JUDGE_API_KEY` | ProviderFactory.fromEnv(), CLI | — |
| `LLM_JUDGE_BASE_URL` | ProviderFactory.fromEnv() | — |
| `LLM_JUDGE_TIMEOUT` | ProviderFactory.fromEnv() | — |
| `LOG_LEVEL` | Pino logger (infra) | `info` |

## Security Considerations

- API keys are never logged — provider `toString()` masks keys to 7 characters.
- Provider SDKs (`openai`, `@anthropic-ai/sdk`) are optional peer dependencies, lazy-loaded via dynamic `import()` only when actually used.
- FileCache uses atomic writes (write temp, rename) to prevent corruption.
- DatasetManager validates paths to prevent directory traversal (`..`, `/`, `\` are rejected).
- Input sizes are restricted: templates enforce a 500 KB input limit, file cache files are SHA-256 hashed by key.
- Biome enforces `noExplicitAny` and `noNonNullAssertion` lint rules.
