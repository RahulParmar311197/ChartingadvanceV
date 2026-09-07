import { screenFundamentals, type FundamentalSnapshot, type ScreenerQuery, type ScreenerMatch } from './index';

export interface FundamentalsPage {
  items: readonly FundamentalSnapshot[];
  nextCursor?: string;
  asOf: number;
  staleAt?: number;
}

export interface FundamentalsRequest {
  symbols?: readonly string[];
  query?: ScreenerQuery;
  cursor?: string;
  limit?: number;
}

export interface FundamentalsProvider {
  getFundamentals(request: FundamentalsRequest): Promise<FundamentalsPage>;
}

export interface ScreenerApplicationResult {
  items: readonly ScreenerMatch[];
  nextCursor?: string;
  freshness: { asOf: number; staleAt?: number; stale: boolean };
}

const MAX_PAGE_SIZE = 100;

export async function runScreener(
  provider: FundamentalsProvider,
  request: FundamentalsRequest,
  now = Date.now(),
): Promise<ScreenerApplicationResult> {
  if (!Number.isFinite(now)) throw new Error('now must be finite');
  const limit = request.limit ?? request.query?.limit ?? 25;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) throw new Error('limit must be an integer from 1 to 100');
  if (request.cursor != null && request.cursor.length > 512) throw new Error('cursor is too long');

  const page = await provider.getFundamentals({ ...request, limit });
  if (!Number.isFinite(page.asOf)) throw new Error('provider asOf must be finite');
  if (page.staleAt != null && (!Number.isFinite(page.staleAt) || page.staleAt < page.asOf)) {
    throw new Error('provider staleAt must be finite and >= asOf');
  }
  const query: ScreenerQuery = { ...request.query, limit };
  const items = screenFundamentals(page.items, query);
  return {
    items,
    nextCursor: page.nextCursor,
    freshness: { asOf: page.asOf, staleAt: page.staleAt, stale: page.staleAt != null && now >= page.staleAt },
  };
}
