import { screenFundamentals, type FundamentalSnapshot, type ScreenerQuery, type ScreenerMatch } from './index';

export type ScreenerCompleteness = 'complete' | 'partial';
export type ScreenerFreshnessStatus = 'fresh' | 'stale' | 'unknown';

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
  freshness: { asOf: number; staleAt?: number; stale: boolean; status: ScreenerFreshnessStatus };
  completeness: { status: ScreenerCompleteness; reason: 'provider-pagination' | 'provider-exhausted' };
}

const MAX_PAGE_SIZE = 100;
const MAX_CURSOR_LENGTH = 512;

function validateCursor(cursor: unknown, label: string): void {
  if (typeof cursor !== 'string' || cursor.length === 0 || cursor.length > MAX_CURSOR_LENGTH) {
    throw new Error(`${label} must be a non-empty string of at most 512 characters`);
  }
}

function validateProviderPage(page: FundamentalsPage): void {
  if (!page || typeof page !== 'object') throw new Error('provider page must be an object');
  if (!Array.isArray(page.items)) throw new Error('provider items must be an array');
  if (!Number.isFinite(page.asOf)) throw new Error('provider asOf must be finite');
  if (page.staleAt != null && (!Number.isFinite(page.staleAt) || page.staleAt < page.asOf)) {
    throw new Error('provider staleAt must be finite and >= asOf');
  }
  if (page.nextCursor != null) validateCursor(page.nextCursor, 'provider nextCursor');
  if (page.nextCursor != null && page.items.length === 0) {
    throw new Error('provider cannot return an empty page with nextCursor');
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
  if (request.cursor != null) validateCursor(request.cursor, 'cursor');

  const page = await provider.getFundamentals({ ...request, limit });
  validateProviderPage(page);
  if (request.cursor != null && page.nextCursor === request.cursor) {
    throw new Error('provider nextCursor must advance beyond the request cursor');
  }
  const query: ScreenerQuery = { ...request.query, limit };
  const items = screenFundamentals(page.items, query);
  const stale = page.staleAt != null && now >= page.staleAt;
  const freshnessStatus: ScreenerFreshnessStatus = page.staleAt == null ? 'unknown' : stale ? 'stale' : 'fresh';
  return {
    items,
    nextCursor: page.nextCursor,
    freshness: { asOf: page.asOf, staleAt: page.staleAt, stale, status: freshnessStatus },
    completeness: {
      status: page.nextCursor == null ? 'complete' : 'partial',
      reason: page.nextCursor == null ? 'provider-exhausted' : 'provider-pagination',
    },
  };
}
