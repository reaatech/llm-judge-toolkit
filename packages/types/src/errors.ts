export class JudgeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    cause?: unknown,
  ) {
    super(message, { cause: cause instanceof Error ? cause : undefined });
    this.name = 'JudgeError';
  }
}

export class ProviderError extends JudgeError {
  constructor(
    message: string,
    public readonly provider: string,
    cause?: unknown,
  ) {
    super(message, 'PROVIDER_ERROR', cause);
    this.name = 'ProviderError';
  }
}

export class ValidationError extends JudgeError {
  constructor(message: string, cause?: unknown) {
    super(message, 'VALIDATION_ERROR', cause);
    this.name = 'ValidationError';
  }
}

export class BudgetExceededError extends JudgeError {
  constructor(
    message: string,
    public readonly current: number,
    public readonly limit: number,
    cause?: unknown,
  ) {
    super(message, 'BUDGET_EXCEEDED', cause);
    this.name = 'BudgetExceededError';
  }
}

export class TemplateError extends JudgeError {
  constructor(message: string, cause?: unknown) {
    super(message, 'TEMPLATE_ERROR', cause);
    this.name = 'TemplateError';
  }
}

export class CacheError extends JudgeError {
  constructor(message: string, cause?: unknown) {
    super(message, 'CACHE_ERROR', cause);
    this.name = 'CacheError';
  }
}
