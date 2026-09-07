import type { FundamentalSnapshot, ScreenerQuery, ScreenerMatch } from './index';

export interface FundamentalsPage {
  items: readonly FundamentalSnapshot[];
  nextCursor?: string;
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
  asOf: number;
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
  const items = page.items.map(snapshot => ({
    snapshot,
    score: request.query ? 0 : 0,
  }));
  return { items, nextCursor: page.nextCursor, asOf: now };
}
