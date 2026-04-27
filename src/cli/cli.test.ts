import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseArgs, createProvider, createTemplate, readJsonlFile } from './cli.js';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('parseArgs', () => {
  it('parses long flags with values', () => {
    const args = parseArgs(['--input', 'data.jsonl', '--criteria', 'faithfulness']);
    expect(args.input).toBe('data.jsonl');
    expect(args.criteria).toBe('faithfulness');
  });

  it('parses boolean long flags', () => {
    const args = parseArgs(['--no-cache']);
    expect(args.cache).toBe(false);
  });

  it('parses short flags', () => {
    const args = parseArgs(['-i', 'in.jsonl', '-c', 'relevance', '-p', 'openai', '-m', 'gpt-4o']);
    expect(args.input).toBe('in.jsonl');
    expect(args.criteria).toBe('relevance');
    expect(args.provider).toBe('openai');
    expect(args.model).toBe('gpt-4o');
  });

  it('ignores unknown short flags', () => {
    const args = parseArgs(['-x', 'ignored']);
    expect(args['x']).toBeUndefined();
  });

  it('handles flag without value as true', () => {
    const args = parseArgs(['--verbose']);
    expect(args.verbose).toBe(true);
  });
});

describe('createProvider', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-openai-test');
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-anthropic-test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates OpenAI provider by default', () => {
    const p = createProvider({});
    expect(p.name).toBe('openai');
  });

  it('creates OpenAI provider with explicit key', () => {
    const p = createProvider({ provider: 'openai', 'api-key': 'explicit' });
    expect(p.name).toBe('openai');
  });

  it('creates Anthropic provider', () => {
    const p = createProvider({ provider: 'anthropic' });
    expect(p.name).toBe('anthropic');
  });

  it('creates Local provider', () => {
    const p = createProvider({ provider: 'local' });
    expect(p.name).toBe('local');
  });

  it('throws for missing OpenAI key', () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    expect(() => createProvider({ provider: 'openai', 'api-key': '' })).toThrow(
      'OpenAI API key required',
    );
  });

  it('throws for missing Anthropic key', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    expect(() => createProvider({ provider: 'anthropic', 'api-key': '' })).toThrow(
      'Anthropic API key required',
    );
  });

  it('throws for unknown provider', () => {
    expect(() => createProvider({ provider: 'unknown' })).toThrow('Unknown provider');
  });
});

describe('createTemplate', () => {
  it('creates each known template', () => {
    expect(createTemplate('faithfulness').criteria).toBe('faithfulness');
    expect(createTemplate('relevance').criteria).toBe('relevance');
    expect(createTemplate('coherence').criteria).toBe('coherence');
    expect(createTemplate('safety').criteria).toBe('safety');
    expect(createTemplate('tool-use').criteria).toBe('tool-use');
  });

  it('throws for unknown criteria', () => {
    expect(() => createTemplate('unknown')).toThrow('Unknown criteria');
  });
});

describe('readJsonlFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'llm-judge-cli-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true });
  });

  it('reads and parses JSONL', () => {
    const path = join(tmpDir, 'data.jsonl');
    writeFileSync(path, '{"id":"1","a":1}\n{"id":"2","a":2}\n', 'utf-8');
    const rows = readJsonlFile(path);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ id: '1', a: 1 });
  });

  it('skips empty lines', () => {
    const path = join(tmpDir, 'data.jsonl');
    writeFileSync(path, '{"id":"1"}\n\n{"id":"2"}\n', 'utf-8');
    const rows = readJsonlFile(path);
    expect(rows).toHaveLength(2);
  });
});
