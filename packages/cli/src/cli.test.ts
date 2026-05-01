import { describe, it, expect } from 'vitest';
import {
  parseArgs,
  createProvider,
  createTemplate,
  readJsonlFile,
} from './index.js';

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
