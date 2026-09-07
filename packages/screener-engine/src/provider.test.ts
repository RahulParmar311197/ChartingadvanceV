import { describe, expect, it } from 'vitest';
import { runScreener, type FundamentalsProvider } from './provider';

describe('fundamentals application boundary', () => {
  const provider: FundamentalsProvider = {
    async getFundamentals() {
      return {
        items: [
          { symbolId: 'NYSE:A', asOf: 100, peRatio: 8 },
          { symbolId: 'NYSE:B', asOf: 100, peRatio: 20 },
        ],
        asOf: 100,
        staleAt: 200,
        nextCursor: 'next',
      };
    },
  };

  it('screens provider results and propagates pagination/freshness', async () => {
    const result = await runScreener(provider, {
      query: { filters: [{ field: 'peRatio', operator: 'lt', value: 10 }] },
    }, 250);
    expect(result.items.map(item => item.snapshot.symbolId)).toEqual(['NYSE:A']);
    expect(result.nextCursor).toBe('next');
    expect(result.freshness).toEqual({ asOf: 100, staleAt: 200, stale: true });
  });

  it('rejects oversized pages', async () => {
    await expect(runScreener(provider, { limit: 101 })).rejects.toThrow('1 to 100');
  });
});
