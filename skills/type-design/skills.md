# Type Design Skill

## Description
Design and implement TypeScript type systems with Zod validation. This skill creates type-safe domain models, validation schemas, and type utilities for enterprise-grade applications.

## Capabilities
- Design comprehensive TypeScript interfaces and types
- Create Zod validation schemas with proper error handling
- Implement type guards and type narrowing utilities
- Generate types from OpenAPI/GraphQL schemas
- Create utility types for common patterns
- Design discriminated unions for complex state management
- Implement generic types with proper constraints
- Create type-safe API clients and SDKs

## Invocation
```yaml
skill: type-design
action: create-schema
parameters:
  typeName: Judgment
  validation: zod
  strict: true
  generateTypes: true
```

## Examples

### Create Core Domain Types
```yaml
skill: type-design
action: create-types
parameters:
  types:
    - name: Judgment
      fields:
        - name: id
          type: string
          required: true
        - name: score
          type: number
          required: true
        - name: reasoning
          type: string
          required: true
        - name: confidence
          type: number
          required: true
    - name: EvaluationCriteria
      type: enum
      values:
        - FAITHFULNESS
        - RELEVANCE
        - COHERENCE
        - SAFETY
        - TOOL_USE
```

### Create Zod Schema with Validation
```yaml
skill: type-design
action: create-schema
parameters:
  typeName: Judgment
  validation: zod
  rules:
    score:
      min: 0
      max: 1
    confidence:
      min: 0
      max: 1
    reasoning:
      minLength: 10
      maxLength: 2000
```

### Create Type-Safe Configuration
```yaml
skill: type-design
action: create-config-types
parameters:
  configName: JudgeConfig
  environments:
    - development
    - staging
    - production
  secrets:
    - apiKey
    - databaseUrl
```

## Generated Code Examples

### Core Judgment Types
```typescript
// src/types/judgment.ts
import { z } from 'zod';

// Evaluation criteria enumeration
export const EvaluationCriteriaSchema = z.enum([
  'faithfulness',
  'relevance', 
  'coherence',
  'safety',
  'tool-use',
  'custom'
]);

export type EvaluationCriteria = z.infer<typeof EvaluationCriteriaSchema>;

// Cost breakdown for tracking
export const CostBreakdownSchema = z.object({
  inputTokens: z.number().min(0),
  outputTokens: z.number().min(0),
  totalTokens: z.number().min(0),
  inputCost: z.number().min(0),
  outputCost: z.number().min(0),
  totalCost: z.number().min(0),
  currency: z.string().default('USD')
});

export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;

// Judgment metadata
export const JudgmentMetadataSchema = z.object({
  cached: z.boolean().optional(),
  cachedAt: z.date().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  templateVersion: z.string().optional(),
  duration: z.number().optional(),
  retries: z.number().min(0).default(0),
  custom: z.record(z.unknown()).optional()
});

export type JudgmentMetadata = z.infer<typeof JudgmentMetadataSchema>;

// Main judgment schema
export const JudgmentSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
  criteria: EvaluationCriteriaSchema,
  score: z.number()
    .min(0, 'Score must be at least 0')
    .max(1, 'Score must be at most 1'),
  reasoning: z.string()
    .min(10, 'Reasoning must be at least 10 characters')
    .max(2000, 'Reasoning must not exceed 2000 characters'),
  confidence: z.number()
    .min(0, 'Confidence must be at least 0')
    .max(1, 'Confidence must be at most 1'),
  cost: CostBreakdownSchema,
  metadata: JudgmentMetadataSchema,
  timestamp: z.date(),
  provider: z.string().min(1),
  model: z.string().min(1),
  templateVersion: z.string().min(1),
  rawResponse: z.unknown().optional()
});

export type Judgment = z.infer<typeof JudgmentSchema>;

// Validation helper
export function validateJudgment(data: unknown): Judgment {
  return JudgmentSchema.parse(data);
}

export function validateJudgmentSafe(data: unknown): z.SafeParseReturnType<unknown, Judgment> {
  return JudgmentSchema.safeParse(data);
}
```

### Configuration Types
```typescript
// src/types/config.ts
import { z } from 'zod';

// Provider configuration
export const ProviderConfigSchema = z.object({
  name: z.enum(['openai', 'anthropic', 'azure', 'local']),
  apiKey: z.string().min(1, 'API key is required').optional(),
  baseURL: z.string().url().optional(),
  timeout: z.number().positive().default(30000),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelay: z.number().positive().default(1000)
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// Cache configuration
export const CacheConfigSchema = z.object({
  enabled: z.boolean().default(true),
  backend: z.enum(['memory', 'redis', 'file', 'database']).default('memory'),
  ttl: z.number().positive().default(86400000), // 24 hours
  maxSize: z.number().positive().default(10000),
  prefix: z.string().default('llm-judge:')
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;

// Main configuration
export const JudgeConfigSchema = z.object({
  provider: ProviderConfigSchema,
  model: z.object({
    name: z.string().min(1),
    temperature: z.number().min(0).max(2).default(0.1),
    maxTokens: z.number().positive().default(2000),
    topP: z.number().min(0).max(1).optional()
  }),
  cache: CacheConfigSchema,
  cost: z.object({
    budget: z.number().positive().optional(),
    alertThreshold: z.number().min(0).max(1).default(0.8),
    trackPerJudgment: z.boolean().default(true)
  }),
  calibration: z.object({
    enabled: z.boolean().default(true),
    minKappa: z.number().min(-1).max(1).default(0.7),
    recalibrateOnDrift: z.boolean().default(true)
  }),
  bias: z.object({
    detectPositionBias: z.boolean().default(true),
    positionBiasThreshold: z.number().min(0).max(1).default(0.1),
    autoDebias: z.boolean().default(false)
  }),
  monitoring: z.object({
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    enableTracing: z.boolean().default(false),
    metricsBackend: z.enum(['prometheus', 'datadog', 'none']).default('none')
  })
});

export type JudgeConfig = z.infer<typeof JudgeConfigSchema>;

// Environment-specific configurations
export const DevConfigSchema = JudgeConfigSchema.extend({
  provider: ProviderConfigSchema.extend({
    name: z.literal('local').default('local')
  }),
  monitoring: z.object({
    logLevel: z.literal('debug').default('debug'),
    enableTracing: z.literal(true).default(true)
  })
});

export const ProdConfigSchema = JudgeConfigSchema.extend({
  cache: CacheConfigSchema.extend({
    backend: z.literal('redis').default('redis'),
    ttl: z.number().positive().default(604800000) // 7 days
  }),
  monitoring: z.object({
    logLevel: z.literal('info').default('info'),
    metricsBackend: z.literal('prometheus').default('prometheus')
  })
});

export type DevConfig = z.infer<typeof DevConfigSchema>;
export type ProdConfig = z.infer<typeof ProdConfigSchema>;
```

### Utility Types
```typescript
// src/types/utils.ts
import { z } from 'zod';

// Partial type for updates
export type UpdatePayload<T> = Partial<T> & { id: string };

// Paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Result type for operations
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Async iterator type
export type AsyncIterableResult<T> = AsyncIterableIterator<Result<T>>;

// Type guards
export function isJudgment(value: unknown): value is Judgment {
  return JudgmentSchema.safeParse(value).success;
}

export function isConsensusJudgment(value: unknown): value is ConsensusJudgment {
  return ConsensusJudgmentSchema.safeParse(value).success;
}

// Discriminated union for different judgment types
export type SingleJudgment = {
  type: 'single';
  judgment: Judgment;
};

export type ConsensusJudgment = {
  type: 'consensus';
  individualJudgments: Judgment[];
  finalScore: number;
  agreementScore: number;
  method: string;
  tiebreakerUsed: boolean;
};

export type AnyJudgment = SingleJudgment | ConsensusJudgment;

// Type narrowing functions
export function isSingleJudgment(judgment: AnyJudgment): judgment is SingleJudgment {
  return judgment.type === 'single';
}

export function isConsensusJudgmentType(judgment: AnyJudgment): judgment is ConsensusJudgment {
  return judgment.type === 'consensus';
}
```

### API Response Types
```typescript
// src/types/api.ts
import { z } from 'zod';
import { JudgmentSchema } from './judgment';

// API error response
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional()
  }),
  timestamp: z.date(),
  path: z.string()
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// Paginated judgment list
export const JudgmentListSchema = z.object({
  judgments: z.array(JudgmentSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    hasMore: z.boolean()
  })
});

export type JudgmentList = z.infer<typeof JudgmentListSchema>;

// Calibration report
export const CalibrationReportSchema = z.object({
  cohensKappa: z.number().min(-1).max(1),
  accuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1Score: z.number().min(0).max(1),
  confusionMatrix: z.array(z.array(z.number())),
  sampleSize: z.number().min(1),
  timestamp: z.date()
});

export type CalibrationReport = z.infer<typeof CalibrationReportSchema>;

// Bias detection report
export const BiasReportSchema = z.object({
  hasBias: z.boolean(),
  averageBias: z.number().min(0).max(1),
  biasByPosition: z.array(z.object({
    candidateId: z.string(),
    originalPosition: z.number(),
    originalScore: z.number(),
    swappedScore: z.number(),
    positionEffect: z.number()
  })),
  recommendation: z.string()
});

export type BiasReport = z.infer<typeof BiasReportSchema>;
```

## Constraints
- All types must have corresponding Zod schemas for runtime validation
- Use strict mode for object schemas to catch unknown properties
- Provide both sync and async validation where appropriate
- Include comprehensive error messages in schemas
- Use branded types for nominal typing when needed
- Avoid `any` type; use `unknown` with proper type guards
- Document all public types with JSDoc comments

## Best Practices
1. **Schema-First Design**: Define Zod schemas first, then derive TypeScript types
2. **Error Messages**: Provide user-friendly error messages in validation schemas
3. **Type Safety**: Use TypeScript's strict mode and avoid type assertions
4. **Documentation**: Document complex types and their intended usage
5. **Versioning**: Version your schemas for API compatibility
6. **Testing**: Test validation logic with edge cases and invalid inputs
7. **Performance**: Consider validation performance for large datasets
8. **Composition**: Compose schemas from smaller, reusable parts

## Related Skills
- `provider-integration` - For creating provider-specific types
- `test-generation` - For generating type validation tests
- `documentation` - For generating type documentation with TypeDoc
