import { screenFundamentals, type FundamentalSnapshot, type ScreenerQuery, type ScreenerMatch } from './index';

export type ScreenerCompleteness = 'complete' | 'partial';

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
  completeness: { status: ScreenerCompleteness; reason: 'provider-pagination' | 'provider-exhausted' };
}

const MAX_PAGE_SIZE = 100;
const MAX_CURSOR_LENGTH = 512;

function validateProviderPage(page: FundamentalsPage): void {
  if (!page || typeof page !== 'object') throw new Error('provider page must be an object');
  if (!Array.isArray(page.items)) throw new Error('provider items must be an array');
  if (!Number.isFinite(page.asOf)) throw new Error('provider asOf must be finite');
  if (page.staleAt != null && (!Number.isFinite(page.staleAt) || page.staleAt < page.asOf)) {
    throw new Error('provider staleAt must be finite and >= asOf');
  }
  if (page.nextCursor != null && (typeof page.nextCursor !== 'string' || page.nextCursor.length === 0 || page.nextCursor.length > MAX_CURSOR_LENGTH)) {
    throw new Error('provider nextCursor must be a non-empty string of at most 512 characters');
  }
}

export async function runScreener(
  provider: FundamentalsProvider,
  request: FundamentalsRequest,
  now = Date.now(),
): Promise<ScreenerApplicationResult> {
  if (!Number.isFinite(now)) throw new Error('now must be finite');
  const limit = request.limit ?? request.query?.limit ?? 25;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) throw new Error('limit must be an integer from 1 to 100');
  if (request.cursor != null && (typeof request.cursor !== 'string' || request.cursor.length === 0 || request.cursor.length > MAX_CURSOR_LENGTH)) {
    throw new Error('cursor must be a non-empty string of at most 512 characters');
  }

  const page = await provider.getFundamentals({ ...request, limit });
  validateProviderPage(page);
  const query: ScreenerQuery = { ...request.query, limit };
  const items = screenFundamentals(page.items, query);
  const stale = page.staleAt != null && now >= page.staleAt;
  return {
    items,
    nextCursor: page.nextCursor,
    freshness: { asOf: page.asOf, staleAt: page.staleAt, stale },
    completeness: {
      status: page.nextCursor == null ? 'complete' : 'partial',
      reason: page.nextCursor == null ? 'provider-exhausted' : 'provider-pagination',
    },
  };
}
