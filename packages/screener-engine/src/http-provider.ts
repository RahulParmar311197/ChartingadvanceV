import type { FundamentalSnapshot } from './index';
import type { FundamentalsPage, FundamentalsProvider, FundamentalsRequest } from './provider';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const MAX_CURSOR_LENGTH = 512;
const DEFAULT_TIMEOUT_MS = 10_000;

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
  timeoutMs?: number;
  mapResponse: (body: unknown, request: FundamentalsHttpRequest) => FundamentalsHttpResponse;
}

function validateRequest(request: FundamentalsRequest): number {
  const limit = request.limit ?? DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw new Error(`limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
  }
  if (request.cursor !== undefined && (!request.cursor || request.cursor.length > MAX_CURSOR_LENGTH)) {
    throw new Error(`cursor must be 1-${MAX_CURSOR_LENGTH} characters`);
  }
  for (const symbol of request.symbols ?? []) {
    if (typeof symbol !== 'string' || !symbol) throw new Error('symbols must contain non-empty strings');
  }
  return limit;
}

export function createHttpFundamentalsProvider(options: HttpFundamentalsProviderOptions): FundamentalsProvider {
  const fetcher = options.fetcher ?? fetch;
  if (!options.endpoint || typeof options.endpoint !== 'string') throw new Error('endpoint must be a non-empty string');
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('timeoutMs must be a positive finite number');

  return {
    async getFundamentals(request: FundamentalsRequest): Promise<FundamentalsPage> {
      const limit = validateRequest(request);
      const url = new URL(options.endpoint);
      for (const symbol of request.symbols ?? []) url.searchParams.append('symbol', symbol);
      url.searchParams.set('limit', String(limit));
      if (request.cursor !== undefined) url.searchParams.set('cursor', request.cursor);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetcher(url, {
          method: 'GET',
          headers: options.headers,
          signal: controller.signal,
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
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
