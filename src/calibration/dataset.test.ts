import { describe, it, expect } from 'vitest';
import { DatasetManager } from './dataset.js';
import { join } from 'path';

describe('DatasetManager', () => {
  const manager = new DatasetManager(join(import.meta.dirname, 'datasets'));

  it('loads faithfulness dataset', () => {
    const dataset = manager.load('faithfulness');
    expect(dataset.criteria).toBe('faithfulness');
    expect(dataset.examples.length).toBeGreaterThan(0);
  });

  it('loads all datasets', () => {
    const all = manager.loadAll();
    expect(all.has('faithfulness')).toBe(true);
    expect(all.has('relevance')).toBe(true);
    expect(all.has('coherence')).toBe(true);
    expect(all.has('safety')).toBe(true);
    expect(all.has('tool-use')).toBe(true);
  });

  it('computes stats for a dataset', () => {
    const dataset = manager.load('faithfulness');
    const stats = manager.getStats(dataset);

    expect(stats.total).toBe(dataset.examples.length);
    expect(stats.good + stats.bad + stats.borderline).toBe(stats.total);
    expect(stats.averageLabel).toBeGreaterThanOrEqual(0);
    expect(stats.averageLabel).toBeLessThanOrEqual(1);
  });

  it('returns empty dataset for missing criteria', () => {
    const manager2 = new DatasetManager('/nonexistent');
    const dataset = manager2.load('faithfulness');
    expect(dataset.examples).toEqual([]);
    expect(dataset.version).toBe('0.0.0');
  });
});
