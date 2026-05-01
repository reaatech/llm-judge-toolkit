# Test Generation Skill

## Description
Generate comprehensive test suites with Vitest for the LLM Judge Toolkit. This skill creates unit tests, integration tests, and E2E tests with proper mocking, fixtures, and coverage targets.

## Capabilities
- Generate unit tests for all modules
- Create integration tests for workflows
- Implement E2E tests for complete flows
- Set up mocking for external dependencies
- Create test fixtures and factories
- Generate performance benchmarks
- Implement snapshot testing
- Create test utilities and helpers

## Invocation
```yaml
skill: test-generation
action: generate-tests
parameters:
  target: JudgmentEngine
  coverage: 90
  types:
    - unit
    - integration
  mock:
    - providers
    - cache
```

## Examples

### Generate Unit Tests
```yaml
skill: test-generation
action: generate-unit-tests
parameters:
  module: packages/engine/src/judge.ts
  coverage: 90
  include:
    - happy-path
    - edge-cases
    - error-handling
```

### Generate Integration Tests
```yaml
skill: test-generation
action: generate-integration-tests
parameters:
  workflow: consensus-judgment
  providers:
    - openai
    - anthropic
  mockExternal: true
```

## Generated Code Examples

### Test Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
});
```

### Unit Tests Example
```typescript
// packages/engine/src/judge.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JudgmentEngine } from './judge';
import { LLMProvider, CompletionResponse } from '@reaatech/llm-judge-providers';
import { CacheManager } from '@reaatech/llm-judge-cache';
import { FaithfulnessTemplate } from '@reaatech/llm-judge-templates';

// Mock provider
class MockProvider extends LLMProvider {
  name = 'mock';
  models = [];
  
  async generateCompletion(): Promise<CompletionResponse> {
    return {
      id: 'test-123',
      model: 'mock-model',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: '{"score": 0.8, "reasoning": "Test reasoning", "confidence": 0.9}' },
        finishReason: 'stop'
      }],
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      duration: 100
    };
  }
  
  countTokens(): number { return 100; }
  calculateCost(): any { return { totalCost: 0.01 }; }
  getCapabilities(): any { return { supportsStreaming: false }; }
  async checkHealth(): Promise<any> { return { healthy: true, latency: 10 }; }
}

describe('JudgmentEngine', () => {
  let engine: JudgmentEngine;
  let mockProvider: MockProvider;
  let mockCache: CacheManager;
  
  beforeEach(() => {
    mockProvider = new MockProvider();
    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    } as any;
    
    engine = new JudgmentEngine({
      provider: mockProvider,
      template: new FaithfulnessTemplate(),
      cache: mockCache,
      config: { cacheEnabled: false }
    });
  });
  
  describe('judge', () => {
    it('should return a valid judgment', async () => {
      const result = await engine.judge({
        query: 'Test query',
        response: 'Test response',
        context: 'Test context'
      });
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.reasoning).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
    
    it('should use cache when enabled', async () => {
      const cachedJudgment = {
        id: 'cached-123',
        score: 0.5,
        reasoning: 'Cached reasoning',
        confidence: 0.8
      };
      
      (mockCache.get as any).mockResolvedValue(cachedJudgment);
      engine = new JudgmentEngine({
        provider: mockProvider,
        template: new FaithfulnessTemplate(),
        cache: mockCache,
        config: { cacheEnabled: true }
      });
      
      const result = await engine.judge({
        query: 'Test query',
        response: 'Test response',
        context: 'Test context'
      });
      
      expect(result).toBe(cachedJudgment);
      expect(mockCache.get).toHaveBeenCalled();
    });
    
    it('should handle invalid responses gracefully', async () => {
      // Test error handling
      const invalidProvider = new (class extends MockProvider {
        async generateCompletion(): Promise<CompletionResponse> {
          return {
            id: 'test-123',
            model: 'mock-model',
            choices: [{
              index: 0,
              message: { role: 'assistant', content: 'Invalid JSON' },
              finishReason: 'stop'
            }],
            usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
            duration: 100
          };
        }
      })();
      
      engine = new JudgmentEngine({
        provider: invalidProvider,
        template: new FaithfulnessTemplate(),
        cache: mockCache,
        config: { cacheEnabled: false }
      });
      
      const result = await engine.judge({
        query: 'Test query',
        response: 'Test response',
        context: 'Test context'
      });
      
      // Should still return a valid result with fallback parsing
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });
});
```

## Constraints
- All tests must be independent and runnable in isolation
- Use descriptive test names that explain the expected behavior
- Mock external dependencies to avoid flaky tests
- Test both happy paths and error conditions
- Maintain ≥90% code coverage

## Best Practices
1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Test names should describe the behavior
3. **Arrange-Act-Assert**: Follow AAA pattern for test structure
4. **Mock External Services**: Don't rely on external APIs in unit tests
5. **Test Edge Cases**: Cover boundary conditions and error cases
6. **Use Fixtures**: Create reusable test data factories
7. **Snapshot Testing**: Use snapshots for complex output validation
8. **Parallel Execution**: Enable parallel test execution for speed

## Related Skills
- `project-setup` - For initial test configuration
- `type-design` - For creating test types and fixtures
- `provider-integration` - For mocking providers in tests
