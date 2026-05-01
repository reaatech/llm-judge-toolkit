# Provider Integration Skill

## Description
Integrate LLM providers (OpenAI, Anthropic, local models) with unified abstraction layer. This skill implements provider-specific clients while maintaining a consistent interface across all providers. Uses `@reaatech/llm-judge-types` as a workspace dependency for shared types.

## Capabilities
- Implement unified provider abstraction layer
- Create provider-specific clients (OpenAI, Anthropic, local)
- Handle authentication and API key management
- Implement token counting and cost calculation
- Support streaming and non-streaming responses
- Handle rate limiting and retries
- Implement provider-specific error handling
- Support multiple model versions and capabilities

## Invocation
```yaml
skill: provider-integration
action: implement-provider
parameters:
  provider: openai
  features:
    - chat
    - embeddings
    - streaming
  models:
    - gpt-4
    - gpt-4-turbo
    - gpt-3.5-turbo
```

## Examples

### Implement OpenAI Provider
```yaml
skill: provider-integration
action: implement-provider
parameters:
  provider: openai
  features:
    - chat
    - streaming
    - function-calling
  models:
    - gpt-4
    - gpt-4-turbo
    - gpt-3.5-turbo
  config:
    baseURL: https://api.openai.com/v1
    timeout: 30000
```

### Implement Anthropic Provider
```yaml
skill: provider-integration
action: implement-provider
parameters:
  provider: anthropic
  features:
    - chat
    - streaming
    - claude-3
  models:
    - claude-3-opus
    - claude-3-sonnet
    - claude-3-haiku
  config:
    baseURL: https://api.anthropic.com
    timeout: 30000
```

### Implement Local Provider (Ollama)
```yaml
skill: provider-integration
action: implement-provider
parameters:
  provider: local
  features:
    - chat
    - streaming
    - local
  models:
    - llama2
    - mistral
    - codellama
  config:
    baseURL: http://localhost:11434
    timeout: 60000
```

## Generated Code Examples

### Base Provider Interface
```typescript
// packages/providers/src/base.ts
import { z } from 'zod';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
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
  responseFormat?: { type: 'text' | 'json_object' };
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface Choice {
  index: number;
  message: Message;
  finishReason: string | null;
}

export interface CompletionResponse {
  id: string;
  model: string;
  choices: Choice[];
  usage: TokenUsage;
  duration: number;
  rawResponse?: unknown;
}

export interface StreamChunk {
  delta: Partial<Message>;
  finishReason: string | null;
  index: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
}

export interface ModelCapabilities {
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  supportsStreaming: boolean;
  maxContextLength: number;
  maxOutputTokens: number;
}

export interface HealthStatus {
  healthy: boolean;
  latency: number;
  error?: string;
}

export abstract class LLMProvider {
  abstract readonly name: string;
  abstract readonly models: ModelInfo[];
  
  abstract generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
  abstract countTokens(text: string, model: string): number;
  abstract calculateCost(usage: TokenUsage, model: string): CostBreakdown;
  
  async streamCompletion(request: CompletionRequest): AsyncIterable<StreamChunk> {
    throw new Error('Streaming not implemented for this provider');
  }
  
  abstract getCapabilities(model: string): ModelCapabilities;
  abstract checkHealth(): Promise<HealthStatus>;
  
  protected validateRequest(request: CompletionRequest): void {
    if (!request.model) {
      throw new Error('Model is required');
    }
    if (!request.messages || request.messages.length === 0) {
      throw new Error('At least one message is required');
    }
    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2');
    }
  }
}
```

### OpenAI Provider Implementation
```typescript
// packages/providers/src/openai.ts
import OpenAI from 'openai';
import { LLMProvider, CompletionRequest, CompletionResponse, ModelInfo, ModelCapabilities, HealthStatus, Message, StreamChunk } from './base';
import { TokenCounter } from '../utils/tokens';

export interface OpenAIConfig {
  apiKey?: string;
  baseURL?: string;
  organization?: string;
  timeout?: number;
  maxRetries?: number;
}

export class OpenAIProvider extends LLMProvider {
  readonly name = 'openai';
  private client: OpenAI;
  
  readonly models: ModelInfo[] = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      inputCostPerMillion: 30,
      outputCostPerMillion: 60,
      supportsStreaming: true,
      supportsFunctionCalling: true
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      contextWindow: 128000,
      maxOutputTokens: 4096,
      inputCostPerMillion: 10,
      outputCostPerMillion: 30,
      supportsStreaming: true,
      supportsFunctionCalling: true
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      contextWindow: 16385,
      maxOutputTokens: 4096,
      inputCostPerMillion: 0.5,
      outputCostPerMillion: 1.5,
      supportsStreaming: true,
      supportsFunctionCalling: true
    },
    {
      id: 'gpt-4-mini',
      name: 'GPT-4 Mini',
      provider: 'openai',
      contextWindow: 128000,
      maxOutputTokens: 16384,
      inputCostPerMillion: 0.15,
      outputCostPerMillion: 0.6,
      supportsStreaming: true,
      supportsFunctionCalling: true
    }
  ];
  
  constructor(config: OpenAIConfig = {}) {
    super();
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      baseURL: config.baseURL,
      organization: config.organization,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3
    });
  }
  
  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    this.validateRequest(request);
    
    const startTime = Date.now();
    
    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages as OpenAI.ChatCompletionMessageParam[],
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        stop: request.stop,
        response_format: request.responseFormat,
        stream: false
      });
      
      const duration = Date.now() - startTime;
      
      return {
        id: response.id,
        model: response.model,
        choices: response.choices.map(choice => ({
          index: choice.index,
          message: {
            role: choice.message.role as Message['role'],
            content: choice.message.content || ''
          },
          finishReason: choice.finish_reason
        })),
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        duration,
        rawResponse: response
      };
    } catch (error) {
      throw this.handleError(error, startTime);
    }
  }
  
  async *streamCompletion(request: CompletionRequest): AsyncIterable<StreamChunk> {
    this.validateRequest(request);
    
    const stream = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages as OpenAI.ChatCompletionMessageParam[],
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true
    });
    
    for await (const chunk of stream) {
      for (const choice of chunk.choices) {
        yield {
          delta: {
            role: choice.delta.role as Message['role'],
            content: choice.delta.content || ''
          },
          finishReason: choice.finish_reason,
          index: choice.index
        };
      }
    }
  }
  
  countTokens(text: string, model: string = 'gpt-4'): number {
    return TokenCounter.count(text, model);
  }
  
  calculateCost(usage: { promptTokens: number; completionTokens: number }, model: string) {
    const modelInfo = this.models.find(m => m.id === model);
    if (!modelInfo) {
      throw new Error(`Unknown model: ${model}`);
    }
    
    const inputCost = (usage.promptTokens / 1_000_000) * modelInfo.inputCostPerMillion;
    const outputCost = (usage.completionTokens / 1_000_000) * modelInfo.outputCostPerMillion;
    
    return {
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      totalTokens: usage.promptTokens + usage.completionTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: 'USD'
    };
  }
  
  getCapabilities(model: string): ModelCapabilities {
    const modelInfo = this.models.find(m => m.id === model);
    if (!modelInfo) {
      throw new Error(`Unknown model: ${model}`);
    }
    
    return {
      supportsVision: ['gpt-4-turbo', 'gpt-4-vision'].includes(model),
      supportsFunctionCalling: modelInfo.supportsFunctionCalling,
      supportsStreaming: modelInfo.supportsStreaming,
      maxContextLength: modelInfo.contextWindow,
      maxOutputTokens: modelInfo.maxOutputTokens
    };
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      await this.client.models.list();
      return {
        healthy: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private handleError(error: unknown, startTime: number): never {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error: ${error.status} - ${error.message}`);
    }
    if (error instanceof OpenAI.AuthenticationError) {
      throw new Error('OpenAI authentication failed. Check your API key.');
    }
    if (error instanceof OpenAI.RateLimitError) {
      throw new Error('OpenAI rate limit exceeded. Consider implementing retry logic.');
    }
    throw error;
  }
}
```

### Anthropic Provider Implementation
```typescript
// packages/providers/src/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, CompletionRequest, CompletionResponse, ModelInfo, ModelCapabilities, HealthStatus, Message } from './base';
import { TokenCounter } from '../utils/tokens';

export interface AnthropicConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export class AnthropicProvider extends LLMProvider {
  readonly name = 'anthropic';
  private client: Anthropic;
  
  readonly models: ModelInfo[] = [
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputCostPerMillion: 15,
      outputCostPerMillion: 75,
      supportsStreaming: true,
      supportsFunctionCalling: true
    },
    {
      id: 'claude-3-sonnet-20240229',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputCostPerMillion: 3,
      outputCostPerMillion: 15,
      supportsStreaming: true,
      supportsFunctionCalling: true
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      contextWindow: 200000,
      maxOutputTokens: 4096,
      inputCostPerMillion: 0.25,
      outputCostPerMillion: 1.25,
      supportsStreaming: true,
      supportsFunctionCalling: true
    }
  ];
  
  constructor(config: AnthropicConfig = {}) {
    super();
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3
    });
  }
  
  async generateCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    this.validateRequest(request);
    
    const startTime = Date.now();
    
    try {
      // Convert messages to Anthropic format
      const systemMessage = request.messages.find(m => m.role === 'system');
      const otherMessages = request.messages.filter(m => m.role !== 'system');
      
      const response = await this.client.messages.create({
        model: request.model,
        messages: otherMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        system: systemMessage?.content,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature,
        top_p: request.topP,
        stream: false
      });
      
      const duration = Date.now() - startTime;
      
      return {
        id: response.id,
        model: response.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: response.content[0].type === 'text' ? response.content[0].text : ''
          },
          finishReason: response.stop_reason
        }],
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        },
        duration,
        rawResponse: response
      };
    } catch (error) {
      throw this.handleError(error, startTime);
    }
  }
  
  countTokens(text: string): number {
    // Anthropic uses a different tokenizer, approximate for now
    return Math.ceil(text.length / 4);
  }
  
  calculateCost(usage: { promptTokens: number; completionTokens: number }, model: string) {
    const modelInfo = this.models.find(m => m.id === model);
    if (!modelInfo) {
      throw new Error(`Unknown model: ${model}`);
    }
    
    const inputCost = (usage.promptTokens / 1_000_000) * modelInfo.inputCostPerMillion;
    const outputCost = (usage.completionTokens / 1_000_000) * modelInfo.outputCostPerMillion;
    
    return {
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      totalTokens: usage.promptTokens + usage.completionTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: 'USD'
    };
  }
  
  getCapabilities(model: string): ModelCapabilities {
    const modelInfo = this.models.find(m => m.id === model);
    if (!modelInfo) {
      throw new Error(`Unknown model: ${model}`);
    }
    
    return {
      supportsVision: true, // All Claude 3 models support vision
      supportsFunctionCalling: modelInfo.supportsFunctionCalling,
      supportsStreaming: modelInfo.supportsStreaming,
      maxContextLength: modelInfo.contextWindow,
      maxOutputTokens: modelInfo.maxOutputTokens
    };
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      // Simple health check by listing models
      await this.client.models.list();
      return {
        healthy: true,
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private handleError(error: unknown, startTime: number): never {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API Error: ${error.status} - ${error.message}`);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      throw new Error('Anthropic authentication failed. Check your API key.');
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error('Anthropic rate limit exceeded. Consider implementing retry logic.');
    }
    throw error;
  }
}
```

## Constraints
- Each provider must implement the base LLMProvider interface
- API keys must be handled securely and never logged
- Rate limiting must be respected with proper backoff
- Token counting should be accurate for cost calculation
- Streaming must be supported where available
- Error handling must be provider-specific but consistent

## Best Practices
1. **Abstraction**: Keep provider-specific logic isolated in provider classes
2. **Error Handling**: Provide clear, actionable error messages
3. **Retry Logic**: Implement exponential backoff for transient failures
4. **Token Counting**: Use accurate tokenizers for each provider
5. **Cost Tracking**: Calculate costs in real-time for budget management
6. **Health Checks**: Implement health checks for monitoring
7. **Configuration**: Support environment variables and config files
8. **Testing**: Mock providers for unit testing

## Related Skills
- `type-design` - For creating provider-specific types
- `cost-optimization` - For implementing cost tracking
- `cache-implementation` - For caching provider responses
- `security-review` - For securing API keys and credentials
