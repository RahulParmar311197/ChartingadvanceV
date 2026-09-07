export type ScreenerFreshnessStatus = "fresh" | "stale" | "unknown";
export type ScreenerCompleteness = "complete" | "partial";

export interface FundamentalMatch {
  snapshot: {
    symbolId: string;
    asOf: number;
    marketCap?: number;
    peRatio?: number;
    priceToBook?: number;
    revenueGrowth?: number;
    earningsGrowth?: number;
    profitMargin?: number;
    returnOnEquity?: number;
    debtToEquity?: number;
    dividendYield?: number;
  };
  score: number;
}

export interface ScreenerQuery {
  filters?: readonly unknown[];
  groups?: readonly unknown[];
  limit?: number;
}

export interface ScreenerRequest {
  symbols?: readonly string[];
  query?: ScreenerQuery;
  cursor?: string;
  limit?: number;
}

export interface ScreenerResult {
  items: readonly FundamentalMatch[];
  nextCursor?: string;
  freshness: {
    asOf: number;
    staleAt?: number;
    stale: boolean;
    status: ScreenerFreshnessStatus;
  };
  completeness: {
    status: ScreenerCompleteness;
    reason: "provider-pagination" | "provider-exhausted";
  };
}

export interface ScreenerEnvelope {
  data: ScreenerResult;
  meta: { provider: string; simulated: boolean };
}

function assertValidResult(body: unknown): ScreenerEnvelope {
  if (!body || typeof body !== "object") throw new Error("Invalid screener response");
  const envelope = body as Partial<ScreenerEnvelope>;
  if (!envelope.data || typeof envelope.data !== "object") throw new Error("Invalid screener response data");
  const data = envelope.data as Partial<ScreenerResult>;
  if (!Array.isArray(data.items)) throw new Error("Invalid screener response items");
  if (!data.freshness || typeof data.freshness !== "object") throw new Error("Invalid screener freshness metadata");
  if (!data.completeness || typeof data.completeness !== "object") throw new Error("Invalid screener completeness metadata");
  if (data.nextCursor !== undefined && (typeof data.nextCursor !== "string" || data.nextCursor.length === 0)) {
    throw new Error("Invalid screener nextCursor");
  }
  return body as ScreenerEnvelope;
}

export async function runFundamentalsScreener(
  request: ScreenerRequest = {},
  baseUrl = import.meta.env.VITE_MARKET_API_URL ?? "http://localhost:8787",
): Promise<ScreenerEnvelope> {
  const params = new URLSearchParams();
  for (const symbol of request.symbols ?? []) params.append("symbol", symbol);
  if (request.query !== undefined) params.set("query", JSON.stringify(request.query));
  if (request.limit !== undefined) params.set("limit", String(request.limit));
  if (request.cursor !== undefined) params.set("cursor", request.cursor);

  const response = await fetch(`${baseUrl}/v1/screener/fundamentals?${params.toString()}`);
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message ?? "Screener request failed");
  return assertValidResult(body);
}

export interface ScreenerPageState {
  items: readonly FundamentalMatch[];
  nextCursor?: string;
  freshness: ScreenerResult["freshness"];
  completeness: ScreenerResult["completeness"];
  loading: boolean;
}

const emptyState = (): ScreenerPageState => ({
  items: [],
  nextCursor: undefined,
  freshness: { asOf: 0, stale: false, status: "unknown" },
  completeness: { status: "complete", reason: "provider-exhausted" },
  loading: false,
});

export function createScreenerPager(
  request: Omit<ScreenerRequest, "cursor"> = {},
  baseUrl?: string,
) {
  let cursor: string | undefined;
  let exhausted = false;
  let state: ScreenerPageState = emptyState();

  return {
    getState: () => state,
    async loadNext(): Promise<ScreenerPageState> {
      if (state.loading) throw new Error("Screener page load already in progress");
      if (exhausted) throw new Error("Screener pager is exhausted");
      state = { ...state, loading: true };
      try {
        const page = await runFundamentalsScreener({ ...request, cursor }, baseUrl);
        const previousCursor = cursor;
        cursor = page.data.nextCursor;
        if (previousCursor !== undefined && cursor === previousCursor) throw new Error("Screener pagination cursor did not advance");
        exhausted = cursor === undefined;
        state = {
          items: [...state.items, ...page.data.items],
          nextCursor: cursor,
          freshness: page.data.freshness,
          completeness: page.data.completeness,
          loading: false,
        };
        return state;
      } catch (error) {
        state = { ...state, loading: false };
        throw error;
      }
    },
    reset() {
      cursor = undefined;
      exhausted = false;
      state = emptyState();
    },
  };
}
