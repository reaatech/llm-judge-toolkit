# Security Review Skill

## Description
Perform security reviews and implement safeguards for the LLM Judge Toolkit. This skill identifies potential security vulnerabilities and implements protective measures.

## Capabilities
- Audit API key handling and storage
- Review input validation and sanitization
- Implement rate limiting and abuse prevention
- Configure secure defaults
- Scan for dependency vulnerabilities
- Implement content filtering
- Review authentication and authorization
- Set up security monitoring and alerts

## Invocation
```yaml
skill: security-review
action: audit-project
parameters:
  scope:
    - api-keys
    - input-validation
    - rate-limiting
    - dependencies
  severity: medium
  generateReport: true
```

## Examples

### Full Security Audit
```yaml
skill: security-review
action: comprehensive-audit
parameters:
  areas:
    - secrets-management
    - input-validation
    - output-encoding
    - rate-limiting
    - dependency-security
    - network-security
  compliance:
    - owasp-top-10
    - cwe-top-25
```

### Implement Security Controls
```yaml
skill: security-review
action: implement-controls
parameters:
  controls:
    - rate-limiting
    - input-sanitization
    - api-key-validation
    - content-filtering
  strictness: high
```

## Generated Code Examples

### API Key Validation
```typescript
// packages/providers/src/factory.ts — API key handling lives in the provider factory
export class APIKeyValidator {
  static validate(key: string): ValidationResult {
    if (!key || key.length < 32) {
      return {
        valid: false,
        error: 'API key must be at least 32 characters'
      };
    }
    
    if (!/^[A-Za-z0-9_-]+$/.test(key)) {
      return {
        valid: false,
        error: 'API key contains invalid characters'
      };
    }
    
    return { valid: true };
  }
  
  static async checkUsage(key: string, limit: number = 1000): Promise<UsageStatus> {
    const usage = await this.getUsage(key);
    const remaining = limit - usage.count;
    
    return {
      valid: remaining > 0,
      remaining,
      limit,
      resetAt: usage.resetAt
    };
  }
}
```

### Input Sanitization
```typescript
// packages/infra/src/sanitization.ts — input sanitization is a cross-cutting concern in the infra package
export class InputSanitizer {
  static sanitizePrompt(prompt: string): string {
    // Remove potential prompt injection patterns
    const sanitized = prompt
      .replace(/ignore\s+previous\s+instructions/gi, '')
      .replace(/system\s+prompt/gi, '')
      .replace(/<\|.*?\|>/g, '')
      .trim();
    
    return sanitized;
  }
  
  static validateInput(input: any, schema: z.ZodSchema): ValidationResult {
    const result = schema.safeParse(input);
    
    if (!result.success) {
      return {
        valid: false,
        error: result.error.errors.map(e => e.message).join(', ')
      };
    }
    
    return { valid: true };
  }
}
```

### Rate Limiter
```typescript
// packages/engine/src/rate-limiter.ts
export class RateLimiter {
  private requests = new Map<string, number[]>();
  
  async checkLimit(key: string, limit: number = 100, window: number = 60000): Promise<boolean> {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => now - time < window);
    
    if (recentRequests.length >= limit) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }
  
  getRemaining(key: string, limit: number = 100, window: number = 60000): number {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(time => now - time < window);
    
    return Math.max(0, limit - recentRequests.length);
  }
}
```

### Security Middleware
```typescript
// packages/infra/src/middleware.ts — middleware is a cross-cutting concern in the infra package
export class SecurityMiddleware {
  constructor(
    private rateLimiter: RateLimiter,
    private validator: APIKeyValidator,
    private sanitizer: InputSanitizer
  ) {}
  
  async handleRequest(request: Request): Promise<SecurityResult> {
    // Validate API key
    const apiKey = request.headers['x-api-key'];
    if (!apiKey) {
      return { allowed: false, reason: 'Missing API key' };
    }
    
    const keyValidation = this.validator.validate(apiKey);
    if (!keyValidation.valid) {
      return { allowed: false, reason: keyValidation.error };
    }
    
    // Check rate limit
    const allowed = await this.rateLimiter.checkLimit(apiKey);
    if (!allowed) {
      return { allowed: false, reason: 'Rate limit exceeded' };
    }
    
    // Sanitize inputs
    if (request.body) {
      request.body = this.sanitizer.sanitizeInput(request.body);
    }
    
    return { allowed: true };
  }
}
```

## Constraints
- Security checks must not significantly impact performance
- API keys must never be logged or exposed
- Rate limits must be configurable
- Input validation must be strict but not overly restrictive
- Security failures must be logged for monitoring

## Best Practices
1. **Defense in Depth**: Multiple layers of security
2. **Fail Secure**: Default to denying access on errors
3. **Least Privilege**: Grant minimum necessary permissions
4. **Input Validation**: Validate all inputs strictly
5. **Output Encoding**: Encode outputs to prevent injection
6. **Secure Defaults**: Start with secure configurations
7. **Monitoring**: Log security events for analysis
8. **Regular Audits**: Conduct periodic security reviews

## Related Skills
- `provider-integration` - For securing API integrations
- `cost-optimization` - For preventing abuse and cost overruns
- `ci-cd-pipeline` - For security scanning in CI/CD
