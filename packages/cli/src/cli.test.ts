import { describe, expect, it } from 'vitest';
import { createProvider, createTemplate, parseArgs, readJsonlFile } from './index.js';

describe('@reaatech/llm-judge-cli', () => {
  it('should export parseArgs', () => {
    expect(parseArgs).toBeDefined();
  });

  it('should export createProvider', () => {
    expect(createProvider).toBeDefined();
  });

  it('should export createTemplate', () => {
    expect(createTemplate).toBeDefined();
  });

  it('should export readJsonlFile', () => {
    expect(readJsonlFile).toBeDefined();
  });
});
