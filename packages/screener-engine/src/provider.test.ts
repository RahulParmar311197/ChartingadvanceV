import { describe, expect, it } from 'vitest';
import { runScreener, type FundamentalsPage, type FundamentalsProvider, type FundamentalsRequest } from './provider';

const snapshots = [
  { symbolId: 'NYSE:AAA', asOf: 100, revenueGrowth: 0.2 },
  { symbolId: 'NYSE:BBB', asOf: 100, revenueGrowth: 0.1 },
];

describe('fundamentals application boundary', () => {
  it('forwards cursor and limit and preserves provider pagination', async () => {
    const calls: FundamentalsRequest[] = [];
    const provider: FundamentalsProvider = {
      async getFundamentals(request) {
        calls.push(request);
        const page: FundamentalsPage = request.cursor === 'page:2'
          ? { items: [snapshots[1]], asOf: 100, nextCursor: 'page:3' }
          : { items: [snapshots[0]], asOf: 100, nextCursor: 'page:2' };
        return page;
      },
    };

    const result = await runScreener(provider, {
      query: { filters: [{ field: 'revenueGrowth', operator: 'gte', value: 0.1 }] },
      cursor: 'page:2',
      limit: 1,
    }, 150);

    expect(calls).toEqual([expect.objectContaining({ cursor: 'page:2', limit: 1 })]);
    expect(result.items.map(item => item.snapshot.symbolId)).toEqual(['NYSE:BBB']);
    expect(result.nextCursor).toBe('page:3');
    expect(result.completeness).toEqual({ status: 'partial', reason: 'provider-pagination' });
    expect(result.freshness).toEqual({ asOf: 100, staleAt: undefined, stale: false });
  });

  it('marks an exhausted provider page complete', async () => {
    const provider: FundamentalsProvider = { async getFundamentals() { return { items: snapshots, asOf: 100 }; } };
    await expect(runScreener(provider, {}, 150)).resolves.toMatchObject({
      completeness: { status: 'complete', reason: 'provider-exhausted' },
    });
  });

  it('marks a page stale only at or after staleAt', async () => {
    const provider: FundamentalsProvider = {
      async getFundamentals() {
        return { items: snapshots, asOf: 100, staleAt: 200 };
      },
    };

    await expect(runScreener(provider, {}, 199)).resolves.toMatchObject({
      freshness: { asOf: 100, staleAt: 200, stale: false },
    });
    await expect(runScreener(provider, {}, 200)).resolves.toMatchObject({
      freshness: { asOf: 100, staleAt: 200, stale: true },
    });
  });

  it('rejects malformed provider page metadata', async () => {
    const provider: FundamentalsProvider = {
      async getFundamentals() {
        return { items: snapshots, asOf: Number.NaN };
      },
    };
    await expect(runScreener(provider, {})).rejects.toThrow('provider asOf must be finite');
  });

  it('rejects malformed provider pagination cursors', async () => {
    const provider: FundamentalsProvider = {
      async getFundamentals() {
        return { items: snapshots, asOf: 100, nextCursor: 42 as unknown as string };
      },
    };
    await expect(runScreener(provider, {})).rejects.toThrow('provider nextCursor must be a non-empty string');
  });

  it('rejects empty provider cursors and empty request cursors', async () => {
    const provider: FundamentalsProvider = {
      async getFundamentals() { return { items: snapshots, asOf: 100, nextCursor: '' }; },
    };
    await expect(runScreener(provider, {})).rejects.toThrow('provider nextCursor must be a non-empty string');
    await expect(runScreener(provider, { cursor: '' })).rejects.toThrow('cursor must be a non-empty string');
  });

  it('rejects an empty page that claims another page exists', async () => {
    const provider: FundamentalsProvider = {
      async getFundamentals() { return { items: [], asOf: 100, nextCursor: 'page:2' }; },
    };
    await expect(runScreener(provider, {})).rejects.toThrow('provider cannot return an empty page with nextCursor');
  });

  it('rejects a provider cursor that does not advance the requested cursor', async () => {
    const provider: FundamentalsProvider = {
      async getFundamentals() { return { items: [snapshots[0]], asOf: 100, nextCursor: 'page:2' }; },
    };
    await expect(runScreener(provider, { cursor: 'page:2' })).rejects.toThrow('provider nextCursor must advance beyond the request cursor');
  });
});
