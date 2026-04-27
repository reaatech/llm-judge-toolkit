# LLM Judge Toolkit — Technical Architecture

> **Note:** This document describes the *aspirational* architecture and design goals. Some features described here (streaming, queue, API server, WebSocket, Docker support, etc.) are planned for future releases and may not yet be implemented. See the source code and `DEV_PLAN.md` for current status.

## System Overview

The LLM Judge Toolkit is designed as a modular, extensible architecture that separates concerns between judgment execution, provider abstraction, caching, calibration, and bias detection. The system follows clean architecture principles with clear dependency boundaries.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Application Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   CLI       │  │   SDK       │  │   API       │  │   Dashboard │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                         Core Services Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Judgment   │  │  Consensus  │  │ Calibration │  │    Bias     │ │
│  │   Engine    │  │   System    │  │    Suite    │  │  Detection  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │    Cost     │  │   Cache     │  │    Batch    │  │ Monitoring  │ │
│  │   Tracker   │  │   Manager   │  │  Processor  │  │   System    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                         Domain Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Templates  │  │    Types    │  │  Validators │  │   Events   │ │
│  │   System    │  │   & Schemas │  │   (Zod)     │  │   Bus      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                         Infrastructure Layer                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Provider Abstraction                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │ OpenAI   │  │ Anthropic│  │  Azure   │  │  Local   │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │    Cache    │  │    Rate     │  │    Token    │  │    Cost    │ │
│  │   Backends  │  │  Limiter    │  │   Counter   │  │ Calculator │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                         External Services                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  OpenAI API │  │Anthropic API│  │Azure OpenAI │  │Local Models│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Design Principles

### 1. Separation of Concerns
Each module has a single, well-defined responsibility. The judgment engine doesn't know about caching; the cache manager doesn't know about providers.

### 2. Dependency Inversion
High-level modules depend on abstractions, not concretions. Providers are pluggable through a common interface.

### 3. Immutability
All judgment results are immutable once created. This ensures reproducibility and simplifies caching.

### 4. Idempotency
All operations are idempotent where possible. Running the same judgment twice produces identical results (when cache is enabled).

### 5. Observability First
Every operation is instrumented with structured logging, metrics, and tracing from day one.

---

## Module Architecture

### 1. Types & Validation (`src/types/`)

**Purpose:** Define all domain models and validation schemas.

**Key Files:**
```
src/types/
├── index.ts              # Barrel exports
├── judgment.ts           # Judgment domain models
├── criteria.ts           # Evaluation criteria definitions
├── config.ts             # Configuration schemas
├── provider.ts           # Provider abstractions
├── cache.ts              # Caching interfaces
├── consensus.ts          # Consensus types
├── calibration.ts        # Calibration types
├── bias.ts               # Bias detection types
├── cost.ts               # Cost tracking types
├── events.ts             # Event system types
└── schemas/              # Zod validation schemas
    ├── judgment.schema.ts
    ├── criteria.schema.ts
    ├── config.schema.ts
    └── ...
```

**Core Types:**

```typescript
// src/types/judgment.ts
export interface Judgment {
  id: string;                    // UUID v4
  criteria: EvaluationCriteria;
  score: number;                 // 0-1 normalized
  reasoning: string;
  confidence: number;            // 0-1
  cost: CostBreakdown;
  metadata: JudgmentMetadata;
  timestamp: Date;
  provider: string;
  model: string;
  templateVersion: string;
  rawResponse: LLMResponse;
}

export interface ConsensusJudgment {
  id: string;
  individualJudgments: Judgment[];
  finalScore: number;
  agreementScore: number;        // 0-1 agreement among judges
  method: ConsensusMethod;
  tiebreakerUsed: boolean;
  timestamp: Date;
}

// src/types/criteria.ts
export enum EvaluationCriteria {
  FAITHFULNESS = 'faithfulness',
  RELEVANCE = 'relevance',
  COHERENCE = 'coherence',
  SAFETY = 'safety',
  TOOL_USE = 'tool-use',
  CUSTOM = 'custom'
}

export interface CriteriaConfig {
  criteria: EvaluationCriteria;
  weight?: number;               // For weighted consensus
  threshold?: number;            // Pass/fail threshold
  customPrompt?: string;         // For custom criteria
  rubric?: RubricItem[];
}
```

### 2. Provider Layer (`src/providers/`)

**Purpose:** Abstract LLM provider differences behind a unified interface.

**Key Files:**
```
src/providers/
├── index.ts
├── base.ts              # Abstract base class
├── openai.ts            # OpenAI implementation
├── anthropic.ts         # Anthropic implementation
├── azure.ts             # Azure OpenAI implementation
├── local.ts             # Local models (Ollama, LM Studio)
├── registry.ts          # Provider registry
└── types.ts             # Provider-specific types
```

**Provider Interface:**

```typescript
// src/providers/base.ts
export abstract class LLMProvider {
  abstract readonly name: string;
  abstract readonly models: ModelInfo[];
  
  abstract generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
  abstract countTokens(text: string): number;
  abstract calculateCost(tokens: TokenCount): CostBreakdown;
  
  // Streaming support
  abstract streamCompletion(request: CompletionRequest): AsyncIterable<StreamChunk>;
  
  // Health and capabilities
  abstract getCapabilities(model: string): ModelCapabilities;
  abstract checkHealth(): Promise<HealthStatus>;
}

export interface CompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}

export interface CompletionResponse {
  id: string;
  model: string;
  choices: Choice[];
  usage: TokenUsage;
  duration: number;
}
```

**Token Counting Strategy:**

```typescript
// src/utils/tokens.ts
import { encoding_for_model, get_encoding } from 'tiktoken';

export class TokenCounter {
  private static cache = new Map<string, number>();
  
  static count(text: string, model: string = 'gpt-4'): number {
    const cacheKey = `${model}:${text.substring(0, 100)}...`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    let encoder;
    try {
      encoder = encoding_for_model(model as any);
    } catch {
      encoder = get_encoding('cl100k_base');
    }
    
    let tokens: number;
    try {
      tokens = encoder.encode(text).length;
    } finally {
      encoder?.free();
    }
    
    this.cache.set(cacheKey, tokens);
    return tokens;
  }
}
```

### 3. Template System (`src/templates/`)

**Purpose:** Manage prompt templates with versioning and customization.

**Key Files:**
```
src/templates/
├── index.ts
├── base.ts              # Base template class
├── faithfulness.ts      # Faithfulness template
├── relevance.ts         # Relevance template
├── coherence.ts         # Coherence template
├── safety.ts            # Safety template
├── tool-use.ts          # Tool use template
├── custom.ts            # Custom template builder
├── registry.ts          # Template registry
└── versions/            # Template versioning
    ├── v1/
    ├── v2/
    └── ...
```

**Template Interface:**

```typescript
// src/templates/base.ts
export abstract class JudgmentTemplate {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly criteria: EvaluationCriteria;
  
  abstract buildPrompt(context: TemplateContext): PromptRequest;
  abstract parseResponse(response: string): ParsedJudgment;
  abstract validateContext(context: TemplateContext): ValidationResult;
  
  // Template customization
  withSystemPrompt(systemPrompt: string): this;
  withExamples(examples: Example[]): this;
  withRubric(rubric: RubricItem[]): this;
}

export interface TemplateContext {
  query?: string;
  response?: string;
  context?: string;           // Source material for faithfulness
  candidates?: Candidate[];   // For comparison judgments
  toolCalls?: ToolCall[];     // For tool-use evaluation
  toolOutputs?: any[];
  conversation?: Message[];   // For multi-turn evaluation
}
```

**Example Template (Faithfulness):**

```typescript
// src/templates/faithfulness.ts
export class FaithfulnessTemplate extends JudgmentTemplate {
  readonly name = 'faithfulness';
  readonly version = '2.1.0';
  readonly criteria = EvaluationCriteria.FAITHFULNESS;
  
  buildPrompt(context: TemplateContext): PromptRequest {
    const { query, response, context: sourceMaterial } = context;
    
    return {
      system: `You are an expert evaluator assessing faithfulness of responses to source material.
Your task is to determine if the response is fully grounded in the provided context.
A response is faithful if every claim can be directly traced to the source material.
Score from 0 (completely unfaithful/hallucinated) to 1 (perfectly faithful).`,
      
      user: `## Source Material:
${sourceMaterial}

## Query:
${query}

## Response to Evaluate:
${response}

## Evaluation Instructions:
1. Identify each claim in the response
2. Check if each claim is supported by the source material
3. Score based on the proportion of supported claims
4. Provide detailed reasoning

## Output Format:
{
  "score": 0.0-1.0,
  "reasoning": "detailed explanation",
  "unsupported_claims": ["list of unsupported claims"],
  "confidence": 0.0-1.0
}`
    };
  }
  
  parseResponse(response: string): ParsedJudgment {
    try {
      const parsed = JSON.parse(response);
      return {
        score: Math.max(0, Math.min(1, parsed.score)),
        reasoning: parsed.reasoning,
        confidence: parsed.confidence || 0.5,
        metadata: {
          unsupportedClaims: parsed.unsupported_claims || []
        }
      };
    } catch {
      // Fallback parsing for non-JSON responses
      return this.parseFallback(response);
    }
  }
}
```

### 4. Judgment Engine (`src/engine/`)

**Purpose:** Execute judgments with retry logic, error handling, and streaming support.

**Key Files:**
```
src/engine/
├── index.ts
├── judge.ts               # Main judgment executor
├── batch.ts               # Batch processing
├── stream.ts              # Streaming judgments
├── retry.ts               # Retry logic
├── queue.ts               # Internal job queue
└── middleware.ts          # Middleware pipeline
```

**Core Judge Implementation:**

```typescript
// src/engine/judge.ts
export class JudgmentEngine {
  constructor(
    private provider: LLMProvider,
    private template: JudgmentTemplate,
    private cache: CacheManager,
    private config: EngineConfig,
    private eventBus?: EventEmitter
  ) {}
  
  async judge(context: TemplateContext): Promise<Judgment> {
    const cacheKey = this.buildCacheKey(context);
    
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;
    }
    
    // Build and validate prompt
    const prompt = this.template.buildPrompt(context);
    this.validatePrompt(prompt);
    
    // Execute with retries
    const response = await this.executeWithRetry(prompt);
    
    // Parse and validate response
    const parsed = this.template.parseResponse(response.content);
    const judgment = this.createJudgment(context, parsed, response);
    
    // Cache result
    if (this.config.cacheEnabled) {
      await this.cache.set(cacheKey, judgment);
    }
    
    // Emit event if event bus is configured
    this.eventBus?.emit('judgment:completed', judgment);
    
    return judgment;
  }
  
  private async executeWithRetry(prompt: PromptRequest): Promise<CompletionResponse> {
    const maxRetries = this.config.maxRetries || 3;
    const baseDelay = this.config.retryDelay || 1000;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.provider.generateCompletion({
          ...prompt,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens
        });
      } catch (error) {
        if (attempt === maxRetries) throw error;
        
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        await this.sleep(delay);
      }
    }
    throw new Error('Unreachable');
  }
}
```

### 5. Consensus System (`src/consensus/`)

**Purpose:** Combine multiple judgments for improved reliability.

**Key Files:**
```
src/consensus/
├── index.ts
├── strategies.ts          # Consensus algorithms
├── tiebreaker.ts          # Tiebreaker logic
├── config.ts              # Consensus configuration
└── optimizer.ts           # Cost/accuracy optimization
```

**Consensus Strategies:**

```typescript
// src/consensus/strategies.ts
export interface ConsensusStrategy {
  name: string;
  execute(judgments: Judgment[]): ConsensusResult;
}

export class MajorityVoting implements ConsensusStrategy {
  readonly name = 'majority-voting';
  
  execute(judgments: Judgment[]): ConsensusResult {
    const scores = judgments.map(j => j.score);
    const weights = judgments.map(j => j.confidence);
    
    // Weighted average
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weightedSum = scores.reduce((sum, score, i) => 
      sum + score * weights[i], 0);
    
    const finalScore = weightedSum / totalWeight;
    
    // Calculate agreement (standard deviation)
    const mean = finalScore;
    const variance = scores.reduce((sum, score) => 
      sum + Math.pow(score - mean, 2), 0) / scores.length;
    const agreement = 1 - Math.min(1, Math.sqrt(variance) * 2);
    
    return {
      finalScore,
      agreementScore: agreement,
      method: this.name,
      individualJudgments: judgments
    };
  }
}

export class CheapFirstTiebreaker implements ConsensusStrategy {
  readonly name = 'cheap-first-tiebreaker';
  
  async execute(
    context: TemplateContext,
    cheapJudge1: JudgmentEngine,
    cheapJudge2: JudgmentEngine,
    expensiveJudge: JudgmentEngine,
    agreementThreshold: number = 0.8
  ): Promise<ConsensusResult> {
    // Run two distinct cheap judges (different instances or configurations)
    const [j1, j2] = await Promise.all([
      cheapJudge1.judge(context),
      cheapJudge2.judge(context)
    ]);
    
    const agreement = 1 - Math.abs(j1.score - j2.score);
    
    if (agreement >= agreementThreshold) {
      return {
        finalScore: (j1.score + j2.score) / 2,
        agreementScore: agreement,
        method: this.name,
        individualJudgments: [j1, j2],
        tiebreakerUsed: false
      };
    }
    
    // Run expensive tiebreaker
    const j3 = await expensiveJudge.judge(context);
    const allJudgments = [j1, j2, j3];
    
    // Majority voting among all three
    const scores = allJudgments.map(j => j.score);
    const finalScore = scores.reduce((a, b) => a + b, 0) / 3;
    
    return {
      finalScore,
      agreementScore: agreement,
      method: this.name,
      individualJudgments: allJudgments,
      tiebreakerUsed: true
    };
  }
}
```

### 6. Calibration Suite (`src/calibration/`)

**Purpose:** Measure and improve judgment reliability through statistical analysis.

**Key Files:**
```
src/calibration/
├── index.ts
├── dataset.ts             # Dataset management
├── gold-standards.ts      # Pre-built gold standards
├── metrics.ts             # Statistical metrics
├── report.ts              # Report generation
├── drift.ts               # Drift detection
└── data/                  # Gold standard datasets
    ├── faithfulness.json
    ├── relevance.json
    ├── coherence.json
    ├── safety.json
    └── tool-use.json
```

**Statistical Metrics:**

```typescript
// src/calibration/metrics.ts
export class CalibrationMetrics {
  static cohensKappa(judgments: Judgment[], humanLabels: number[]): number {
    const n = judgments.length;
    let observed = 0;
    const judgeDist = new Map<number, number>();
    const humanDist = new Map<number, number>();
    
    // Discretize scores to 3 categories (0-0.33, 0.34-0.66, 0.67-1.0)
    const discretize = (score: number) => Math.min(2, Math.floor(score * 3));
    
    for (let i = 0; i < n; i++) {
      const jCat = discretize(judgments[i].score);
      const hCat = discretize(humanLabels[i]);
      
      if (jCat === hCat) observed++;
      
      judgeDist.set(jCat, (judgeDist.get(jCat) || 0) + 1);
      humanDist.set(hCat, (humanDist.get(hCat) || 0) + 1);
    }
    
    const po = observed / n;
    
    // Expected agreement by chance
    let pe = 0;
    for (const [cat, count] of judgeDist) {
      const humanCount = humanDist.get(cat) || 0;
      pe += (count / n) * (humanCount / n);
    }
    
    return (po - pe) / (1 - pe);
  }
  
  static confusionMatrix(
    judgments: Judgment[], 
    humanLabels: number[],
    thresholds: number[] = [0.33, 0.66]
  ): ConfusionMatrix {
    const categories = thresholds.length + 1;
    const matrix = Array(categories).fill(null).map(() => Array(categories).fill(0));
    
    const categorize = (score: number) => {
      for (let i = 0; i < thresholds.length; i++) {
        if (score <= thresholds[i]) return i;
      }
      return thresholds.length;
    };
    
    for (let i = 0; i < judgments.length; i++) {
      const pred = categorize(judgments[i].score);
      const actual = categorize(humanLabels[i]);
      matrix[pred][actual]++;
    }
    
    return { matrix, categories, thresholds };
  }
}
```

### 7. Bias Detection (`src/bias/`)

**Purpose:** Detect and mitigate systematic biases in judgments.

**Key Files:**
```
src/bias/
├── index.ts
├── position.ts            # Position bias detection
├── swap-test.ts           # Swap testing
├── length.ts              # Length bias
├── style.ts               # Style bias
├── mitigation.ts          # Mitigation strategies
└── report.ts              # Bias reports
```

**Position Bias Detection:**

```typescript
// src/bias/position.ts
export class PositionBiasDetector {
  async detect(
    judge: JudgmentEngine,
    candidates: Candidate[]
  ): Promise<PositionBiasReport> {
    if (candidates.length < 2) {
      throw new Error('Position bias detection requires at least 2 candidates');
    }
    
    // Original order
    const originalOrder = await judge.judge({
      candidates: candidates
    });
    
    // Swapped order
    const swappedCandidates = [...candidates].reverse();
    const swappedOrder = await judge.judge({
      candidates: swappedCandidates
    });
    
    // Calculate bias
    const originalScores = candidates.map((_, i) => 
      this.extractScoreForCandidate(originalOrder, candidates[i].id)
    );
    const swappedScores = swappedCandidates.map((_, i) => 
      this.extractScoreForCandidate(swappedOrder, swappedCandidates[i].id)
    );
    
    const biasScores = originalScores.map((orig, i) => ({
      candidateId: candidates[i].id,
      originalPosition: i,
      originalScore: orig,
      swappedScore: swappedScores[candidates.length - 1 - i],
      positionEffect: Math.abs(orig - swappedScores[candidates.length - 1 - i])
    }));
    
    const averageBias = biasScores.reduce((sum, b) => sum + b.positionEffect, 0) / biasScores.length;
    const hasBias = averageBias > 0.1; // 10% threshold
    
    return {
      hasBias,
      averageBias,
      biasByPosition: biasScores,
      recommendation: hasBias 
        ? 'Use position debiasing: average scores from both orders'
        : 'No significant position bias detected'
    };
  }
  
  async debias(
    judge: JudgmentEngine,
    candidates: Candidate[]
  ): Promise<Judgment> {
    // Run both orders and average
    const [original, swapped] = await Promise.all([
      judge.judge({ candidates }),
      judge.judge({ candidates: [...candidates].reverse() })
    ]);
    
    // Average the scores for each candidate
    const debiasedScores = candidates.map(candidate => {
      const origScore = this.extractScoreForCandidate(original, candidate.id);
      const swappedScore = this.extractScoreForCandidate(swapped, candidate.id);
      return (origScore + swappedScore) / 2;
    });
    
    return {
      ...original,
      score: debiasedScores.reduce((a, b) => a + b, 0) / debiasedScores.length,
      metadata: {
        ...original.metadata,
        debiased: true,
        originalScores: debiasedScores
      }
    };
  }
}
```

### 8. Caching System (`src/cache/`)

**Purpose:** Eliminate redundant API calls and reduce costs.

**Key Files:**
```
src/cache/
├── index.ts
├── manager.ts             # Cache management
├── backends.ts            # Backend implementations
├── invalidation.ts        # Invalidation strategies
├── warmup.ts              # Cache warming
├── analytics.ts           # Cache analytics
└── strategies.ts          # Caching strategies
```

**Cache Manager:**

```typescript
// src/cache/manager.ts
export class CacheManager {
  constructor(
    private backend: CacheBackend,
    private config: CacheConfig
  ) {}
  
  async get(key: string): Promise<Judgment | null> {
    const cached = await this.backend.get(key);
    if (!cached) return null;
    
    // Check expiration
    if (this.isExpired(cached)) {
      await this.backend.delete(key);
      return null;
    }
    
    // Update access time for LRU
    await this.backend.touch(key);
    
    return cached;
  }
  
  async set(key: string, judgment: Judgment): Promise<void> {
    const item: CacheItem = {
      ...judgment,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.ttl),
      accessCount: 0
    };
    
    await this.backend.set(key, item);
  }
  
  private buildCacheKey(context: TemplateContext): string {
    const normalized = this.normalizeContext(context);
    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
    return `judgment:${this.template.name}:${this.template.version}:${hash}`;
  }
}
```

**Cache Backends:**

```typescript
// src/cache/backends.ts
export interface CacheBackend {
  get(key: string): Promise<CacheItem | null>;
  set(key: string, item: CacheItem): Promise<void>;
  delete(key: string): Promise<void>;
  touch(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class InMemoryCache implements CacheBackend {
  private store = new Map<string, CacheItem>();
  
  async get(key: string): Promise<CacheItem | null> {
    return this.store.get(key) || null;
  }
  
  async set(key: string, item: CacheItem): Promise<void> {
    this.store.set(key, item);
  }
  
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  async touch(key: string): Promise<void> {
    const item = this.store.get(key);
    if (item) {
      item.lastAccessed = new Date();
      this.store.set(key, item);
    }
  }
  
  async clear(): Promise<void> {
    this.store.clear();
  }
}

export class RedisCache implements CacheBackend {
  constructor(private redis: Redis) {}
  
  async get(key: string): Promise<CacheItem | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set(key: string, item: CacheItem): Promise<void> {
    await this.redis.setex(key, 86400, JSON.stringify(item)); // 24h TTL
  }
  
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
  
  async touch(key: string): Promise<void> {
    await this.redis.expire(key, 86400);
  }
  
  async clear(): Promise<void> {
    await this.redis.flushdb();
  }
}
```

### 9. Cost Tracking (`src/cost/`)

**Purpose:** Track and optimize costs across all judgments.

**Key Files:**
```
src/cost/
├── index.ts
├── tracker.ts             # Cost tracking
├── budget.ts              # Budget management
├── optimizer.ts           # Cost optimization
└── reporting.ts           # Cost reports
```

**Cost Tracker:**

```typescript
// src/cost/tracker.ts
export class CostTracker {
  private costs = new Map<string, CostBreakdown>();
  private budget: Budget | null = null;
  
  track(judgment: Judgment): void {
    this.costs.set(judgment.id, judgment.cost);
    
    // Check budget
    if (this.budget && this.getTotalCost() > this.budget.limit) {
      this.emit('budget:exceeded', {
        current: this.getTotalCost(),
        limit: this.budget.limit
      });
    }
  }
  
  getTotalCost(): number {
    let total = 0;
    for (const cost of this.costs.values()) {
      total += cost.total;
    }
    return total;
  }
  
  getCostByCriteria(criteria: EvaluationCriteria): number {
    let total = 0;
    for (const [id, cost] of this.costs.entries()) {
      const judgment = this.getJudgment(id);
      if (judgment?.criteria === criteria) {
        total += cost.total;
      }
    }
    return total;
  }
  
  generateReport(period: DateRange): CostReport {
    const filtered = this.filterByPeriod(period);
    return {
      totalCost: this.calculateTotal(filtered),
      costByCriteria: this.groupByCriteria(filtered),
      costByProvider: this.groupByProvider(filtered),
      costByModel: this.groupByModel(filtered),
      averageCostPerJudgment: this.calculateAverage(filtered),
      projectedMonthlyCost: this.projectMonthly(filtered),
      savingsFromCache: this.calculateCacheSavings(filtered)
    };
  }
}
```

### 10. Monitoring & Observability (`src/monitoring/`)

**Purpose:** Provide comprehensive visibility into system behavior.

**Key Files:**
```
src/monitoring/
├── index.ts
├── logger.ts              # Structured logging
├── metrics.ts             # Metrics collection
├── tracing.ts             # Distributed tracing
├── alerts.ts              # Alerting
└── health.ts              # Health checks
```

**Structured Logging:**

```typescript
// src/monitoring/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function logJudgment(judgment: Judgment, duration: number): void {
  logger.info({
    event: 'judgment:completed',
    judgmentId: judgment.id,
    criteria: judgment.criteria,
    score: judgment.score,
    confidence: judgment.confidence,
    cost: judgment.cost.total,
    duration,
    provider: judgment.provider,
    model: judgment.model,
    cached: judgment.metadata?.cached || false
  });
}

export function logError(error: Error, context: ErrorContext): void {
  logger.error({
    event: 'error',
    errorType: error.name,
    errorMessage: error.message,
    stack: error.stack,
    ...context
  });
}
```

---

## Data Flow Diagrams

### Single Judgment Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│ Judgment │────▶│ Template │────▶│ Provider │
│          │     │  Engine  │     │  System  │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                     │                                  │
                     ▼                                  ▼
               ┌──────────┐                       ┌──────────┐
               │  Cache   │◀────── Cache Hit ─────│  Cache   │
               │ Manager  │                       │ Backend  │
               └──────────┘                       └──────────┘
                     │                                  │
                     ▼                                  ▼
               ┌──────────┐                       ┌──────────┐
               │  Cost    │                       │  Token   │
               │ Tracker  │                       │ Counter  │
               └──────────┘                       └──────────┘
```

### Consensus Flow (Cheap-First with Tiebreaker)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│ Consensus│────▶│ Cheap    │
│          │     │ Strategy │     │ Judge 1  │
└──────────┘     └──────────┘     └──────────┘
                     │                  │
                     │                  ▼
                     │            ┌──────────┐
                     │            │ Cheap    │
                     │            │ Judge 2  │
                     │            └──────────┘
                     │                  │
                     │                  ▼
                     │            ┌──────────┐
                     │            │ Check    │
                     │            │Agreement │
                     │            └──────────┘
                     │                  │
                     │         ┌────────┴────────┐
                     │         │                 │
                     │    ┌────▼────┐      ┌────▼────┐
                     │    │Agreement│      │Disagree │
                     │    │≥Threshold│     │<Threshold│
                     │    └────┬────┘      └────┬────┘
                     │         │                 │
                     │         │            ┌────▼────┐
                     │         │            │Expensive│
                     │         │            │Tiebreaker│
                     │         │            └────┬────┘
                     │         │                 │
                     └─────────┴─────────────────┘
                               │
                               ▼
                         ┌──────────┐
                         │ Consensus│
                         │ Result   │
                         └──────────┘
```

### Calibration Workflow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│Calibration│────▶│  Load    │
│          │     │  Suite   │     │Gold Data │
└──────────┘     └──────────┘     └──────────┘
                     │                  │
                     ▼                  ▼
               ┌──────────┐       ┌──────────┐
               │  Run     │       │ Run      │
               │ Judge on │──────▶│Human     │
               │Gold Data │       │Labels    │
               └──────────┘       └──────────┘
                     │                  │
                     ▼                  ▼
               ┌──────────┐       ┌──────────┐
               │ Judge    │       │Calculate │
               │ Scores   │──────▶│Metrics   │
               └──────────┘       └──────────┘
                     │                  │
                     ▼                  ▼
               ┌──────────┐       ┌──────────┐
               │ Compare  │──────▶│Cohen's   │
               │Scores    │       │Kappa     │
               └──────────┘       └──────────┘
                     │
                     ▼
               ┌──────────┐
               │Calibration│
               │ Report   │
               └──────────┘
```

---

## API Design

### Public API Surface

```typescript
// src/index.ts
export { JudgmentEngine } from './engine/judge';
export { ConsensusJudge } from './consensus/strategies';
export { CalibrationSuite } from './calibration/dataset';
export { PositionBiasDetector } from './bias/position';
export { CacheManager } from './cache/manager';
export { CostTracker } from './cost/tracker';

export * from './types';
export * from './templates';
```

### Usage Examples

**Basic Judgment:**
```typescript
import { JudgmentEngine, EvaluationCriteria, OpenAIProvider } from 'llm-judge-toolkit';

const provider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
const judge = new JudgmentEngine({
  provider,
  criteria: EvaluationCriteria.FAITHFULNESS,
  cache: true
});

const result = await judge.evaluate({
  query: "What is the capital of France?",
  response: "The capital of France is Paris.",
  context: "Paris is the capital and largest city of France."
});

console.log(result.score); // 0.95
console.log(result.reasoning); // "The response is fully supported..."
```

**Multi-Judge Consensus:**
```typescript
import { ConsensusJudge, ConsensusStrategy } from 'llm-judge-toolkit';

const consensus = new ConsensusJudge({
  strategy: ConsensusStrategy.CHEAP_FIRST_TIEBREAKER,
  cheapModel: 'gpt-4-mini',
  expensiveModel: 'gpt-4',
  agreementThreshold: 0.8
});

const result = await consensus.evaluate({
  candidates: [responseA, responseB],
  criteria: EvaluationCriteria.RELEVANCE
});

console.log(result.finalScore);
console.log(result.agreementScore);
console.log(result.tiebreakerUsed);
```

**Calibration:**
```typescript
import { CalibrationSuite } from 'llm-judge-toolkit';

const calibration = new CalibrationSuite({
  provider: openaiProvider,
  criteria: EvaluationCriteria.FAITHFULNESS
});

const report = await calibration.run();
console.log(`Cohen's Kappa: ${report.cohensKappa}`);
console.log(`Accuracy: ${report.accuracy}`);
```

**Bias Detection:**
```typescript
import { PositionBiasDetector } from 'llm-judge-toolkit';

const detector = new PositionBiasDetector({
  provider: openaiProvider
});

const biasReport = await detector.detect({
  candidates: [responseA, responseB]
});

if (biasReport.hasBias) {
  console.log(`Position bias detected: ${biasReport.averageBias}`);
  const debiased = await detector.debias({
    candidates: [responseA, responseB]
  });
}
```

---

## Configuration System

### Configuration Schema

```typescript
// src/config/schema.ts
export const configSchema = z.object({
  // Provider configuration
  provider: z.object({
    name: z.enum(['openai', 'anthropic', 'azure', 'local']),
    apiKey: z.string().optional(),
    baseURL: z.string().optional(),
    timeout: z.number().default(30000),
    maxRetries: z.number().default(3)
  }),
  
  // Model configuration
  model: z.object({
    name: z.string(),
    temperature: z.number().min(0).max(2).default(0.1),
    maxTokens: z.number().default(2000),
    topP: z.number().min(0).max(1).optional()
  }),
  
  // Cache configuration
  cache: z.object({
    enabled: z.boolean().default(true),
    backend: z.enum(['memory', 'redis', 'file', 'database']).default('memory'),
    ttl: z.number().default(86400000), // 24 hours
    maxSize: z.number().default(10000)
  }),
  
  // Cost configuration
  cost: z.object({
    budget: z.number().optional(),
    alertThreshold: z.number().default(0.8), // 80% of budget
    trackPerJudgment: z.boolean().default(true)
  }),
  
  // Calibration configuration
  calibration: z.object({
    enabled: z.boolean().default(true),
    minKappa: z.number().default(0.7),
    recalibrateOnDrift: z.boolean().default(true)
  }),
  
  // Bias detection configuration
  bias: z.object({
    detectPositionBias: z.boolean().default(true),
    positionBiasThreshold: z.number().default(0.1),
    autoDebias: z.boolean().default(false)
  }),
  
  // Monitoring configuration
  monitoring: z.object({
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    enableTracing: z.boolean().default(false),
    metricsBackend: z.enum(['prometheus', 'datadog', 'none']).default('none')
  })
});
```

### Environment Variables

```bash
# Provider Configuration
LLM_JUDGE_PROVIDER=openai
LLM_JUDGE_API_KEY=sk-...
LLM_JUDGE_MODEL=gpt-4

# Cache Configuration
LLM_JUDGE_CACHE_ENABLED=true
LLM_JUDGE_CACHE_BACKEND=redis
LLM_JUDGE_CACHE_TTL=86400

# Cost Configuration
LLM_JUDGE_BUDGET=100.00
LLM_JUDGE_COST_ALERT_THRESHOLD=0.8

# Monitoring Configuration
LLM_JUDGE_LOG_LEVEL=info
LLM_JUDGE_ENABLE_TRACING=false
```

---

## Security Considerations

### 1. API Key Management
- Never log API keys
- Support environment variables and secure vaults
- Rotate keys regularly
- Use principle of least privilege

### 2. Input Validation
- Validate all inputs with Zod schemas
- Sanitize user-provided prompts
- Limit input sizes to prevent abuse
- Rate limit API calls

### 3. Data Privacy
- Don't store sensitive data in caches
- Support data encryption at rest
- Implement data retention policies
- Provide data deletion capabilities

### 4. Supply Chain Security
- Pin all dependencies
- Use security scanning in CI/CD
- Monitor for vulnerabilities
- Sign releases with GPG

---

## Performance Considerations

### 1. Latency Optimization
- Parallel processing where possible
- Streaming responses for large outputs
- Connection pooling for API calls
- Intelligent batching

### 2. Memory Management
- Stream large datasets
- Implement pagination
- Use generators for iteration
- Clean up resources properly

### 3. Throughput Optimization
- Concurrent request handling
- Connection pooling
- Request deduplication
- Intelligent queuing

---

## Deployment Architecture

### Single Server Deployment

```
┌─────────────────────────────────────┐
│         Application Server          │
│  ┌───────────────────────────────┐  │
│  │    LLM Judge Toolkit          │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   In-Memory Cache       │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│        External LLM Providers       │
│  (OpenAI, Anthropic, Azure, etc.)   │
└─────────────────────────────────────┘
```

### Distributed Deployment

```
┌─────────────────────────────────────────────────────┐
│                    Load Balancer                    │
└─────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   App Server 1  │  │   App Server 2  │  │   App Server 3  │
│                 │  │                 │  │                 │
│ LLM Judge       │  │ LLM Judge       │  │ LLM Judge       │
│ Toolkit         │  │ Toolkit         │  │ Toolkit         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
           │                    │                    │
           └────────────────────┼────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │    Redis Cluster    │
                    │   (Shared Cache)    │
                    └─────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │  PostgreSQL/SQLite  │
                    │  (Persistent Cache) │
                    └─────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │  External LLM APIs  │
                    └─────────────────────┘
```

---

## Testing Strategy

### Unit Tests
- Test each module in isolation
- Mock external dependencies
- Target ≥90% code coverage
- Test edge cases and error conditions

### Integration Tests
- Test module interactions
- Use test doubles for external services
- Test database and cache operations
- Test error recovery

### End-to-End Tests
- Test complete workflows
- Use real (but cheap) models
- Test with gold standard datasets
- Validate against human judgments

### Performance Tests
- Load testing with concurrent requests
- Latency benchmarks
- Memory usage profiling
- Cost analysis under load

---

## Future Considerations

### Extensibility Points

1. **Custom Templates** — Users can create and register custom evaluation templates
2. **Custom Providers** — Support for additional LLM providers
3. **Custom Consensus Strategies** — Pluggable consensus algorithms
4. **Custom Cache Backends** — Support for additional caching solutions
5. **Custom Metrics** — Extensible monitoring and metrics system

### Roadmap Beyond v1.0

1. **Multi-modal Evaluation** — Support for image and video evaluation
2. **Real-time Dashboards** — Web UI for monitoring and analysis
3. **Automated Prompt Optimization** — ML-based prompt improvement
4. **Cross-lingual Support** — Evaluation in multiple languages
5. **Domain-specific Templates** — Industry-specific evaluation criteria

---

*This architecture document is a living specification and will evolve as the project develops. All major architectural changes should be documented through Architecture Decision Records (ADRs).*
