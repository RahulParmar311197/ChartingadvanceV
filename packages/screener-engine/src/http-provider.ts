import type { FundamentalSnapshot } from './index';
import type { FundamentalsPage, FundamentalsProvider, FundamentalsRequest } from './provider';

export interface FundamentalsHttpResponse {
  items: readonly FundamentalSnapshot[];
  asOf: number;
  staleAt?: number;
  nextCursor?: string;
}

export interface FundamentalsHttpRequest {
  symbols?: readonly string[];
  cursor?: string;
  limit: number;
}

export interface HttpFundamentalsProviderOptions {
  endpoint: string;
  fetcher?: typeof fetch;
  headers?: Record<string, string>;
  mapResponse: (body: unknown, request: FundamentalsHttpRequest) => FundamentalsHttpResponse;
}

export function createHttpFundamentalsProvider(options: HttpFundamentalsProviderOptions): FundamentalsProvider {
  const fetcher = options.fetcher ?? fetch;
  if (!options.endpoint || typeof options.endpoint !== 'string') throw new Error('endpoint must be a non-empty string');

  return {
    async getFundamentals(request: FundamentalsRequest): Promise<FundamentalsPage> {
      const limit = request.limit ?? 25;
      const url = new URL(options.endpoint);
      for (const symbol of request.symbols ?? []) url.searchParams.append('symbol', symbol);
      url.searchParams.set('limit', String(limit));
      if (request.cursor !== undefined) url.searchParams.set('cursor', request.cursor);

      const response = await fetcher(url, {
        method: 'GET',
        headers: options.headers,
      });
      if (!response.ok) throw new Error(`fundamentals provider returned HTTP ${response.status}`);
      const body = await response.json();
      const mapped = options.mapResponse(body, { symbols: request.symbols, cursor: request.cursor, limit });
      return {
        items: mapped.items,
        asOf: mapped.asOf,
        staleAt: mapped.staleAt,
        nextCursor: mapped.nextCursor,
      };
    },
  };
}
