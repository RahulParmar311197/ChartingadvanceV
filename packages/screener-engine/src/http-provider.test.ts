import { describe, expect, it } from 'vitest';
import { createHttpFundamentalsProvider } from './http-provider';

describe('HTTP fundamentals provider adapter', () => {
  it('translates application pagination into HTTP query parameters and maps the response', async () => {
    let requestedUrl = '';
    const provider = createHttpFundamentalsProvider({
      endpoint: 'https://provider.invalid/fundamentals',
      fetcher: async (input) => {
        requestedUrl = String(input);
        return new Response(JSON.stringify({
          rows: [{ symbol: 'NASDAQ:AAPL' }],
          next: 'page-2',
          asOf: 1_700_000_000,
          staleAt: 1_700_003_600,
        }), { status: 200 });
      },
      mapResponse: (body) => {
        const value = body as {
          rows: Array<{ symbol: string }>;
          next: string;
          asOf: number;
          staleAt: number;
        };
        return {
          items: value.rows.map((row) => ({ symbolId: row.symbol, asOf: value.asOf })),
          nextCursor: value.next,
          asOf: value.asOf,
          staleAt: value.staleAt,
        };
      },
    });

    const page = await provider.getFundamentals({
      symbols: ['NASDAQ:AAPL'],
      cursor: 'page-1',
      limit: 25,
    });

    const url = new URL(requestedUrl);
    expect(url.searchParams.getAll('symbol')).toEqual(['NASDAQ:AAPL']);
    expect(url.searchParams.get('cursor')).toBe('page-1');
    expect(url.searchParams.get('limit')).toBe('25');
    expect(page).toEqual({
      items: [{ symbolId: 'NASDAQ:AAPL', asOf: 1_700_000_000 }],
      nextCursor: 'page-2',
      asOf: 1_700_000_000,
      staleAt: 1_700_003_600,
    });
  });

  it('rejects invalid transport page bounds before calling upstream', async () => {
    let calls = 0;
    const provider = createHttpFundamentalsProvider({
      endpoint: 'https://provider.invalid/fundamentals',
      fetcher: async () => {
        calls += 1;
        return new Response('{}', { status: 200 });
      },
      mapResponse: () => ({ items: [], asOf: 1 }),
    });

    await expect(provider.getFundamentals({ limit: 101 })).rejects.toThrow('limit');
    await expect(provider.getFundamentals({ cursor: 'x'.repeat(513), limit: 10 })).rejects.toThrow('cursor');
    expect(calls).toBe(0);
  });

  it('does not hide upstream HTTP failures behind a fabricated page', async () => {
    const provider = createHttpFundamentalsProvider({
      endpoint: 'https://provider.invalid/fundamentals',
      fetcher: async () => new Response('upstream failure', { status: 503 }),
      mapResponse: () => {
        throw new Error('mapper must not run');
      },
    });

    await expect(provider.getFundamentals({ limit: 10 })).rejects.toThrow('HTTP 503');
  });

  it('aborts a hung upstream request at the configured timeout', async () => {
    const provider = createHttpFundamentalsProvider({
      endpoint: 'https://provider.invalid/fundamentals',
      timeoutMs: 5,
      fetcher: (_input, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      }),
      mapResponse: () => ({ items: [], asOf: 1 }),
    });

    await expect(provider.getFundamentals({ limit: 10 })).rejects.toThrow('aborted');
  });

  it('rejects invalid timeout configuration at construction', () => {
    expect(() => createHttpFundamentalsProvider({
      endpoint: 'https://provider.invalid/fundamentals',
      timeoutMs: 0,
      mapResponse: () => ({ items: [], asOf: 1 }),
    })).toThrow('timeoutMs');
  });
});
