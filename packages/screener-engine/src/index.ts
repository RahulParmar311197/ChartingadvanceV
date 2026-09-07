export type FundamentalField =
  | 'marketCap'
  | 'peRatio'
  | 'priceToBook'
  | 'revenueGrowth'
  | 'earningsGrowth'
  | 'profitMargin'
  | 'returnOnEquity'
  | 'debtToEquity'
  | 'dividendYield';

export interface FundamentalSnapshot {
  symbolId: string;
  asOf: number; // Unix epoch seconds, UTC.
  marketCap?: number;
  peRatio?: number;
  priceToBook?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  profitMargin?: number;
  returnOnEquity?: number;
  debtToEquity?: number;
  dividendYield?: number;
}

export type NumericOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';

export interface NumericFilter {
  field: FundamentalField;
  operator: NumericOperator;
  value: number;
  upperValue?: number;
}

export interface FilterGroup {
  logic: 'and' | 'or';
  filters: readonly NumericFilter[];
}

export interface ScreenerQuery {
  filters?: readonly NumericFilter[];
  groups?: readonly FilterGroup[];
  limit?: number;
}

export interface ScreenerMatch {
  snapshot: FundamentalSnapshot;
  score: number;
}

const fields: readonly FundamentalField[] = [
  'marketCap', 'peRatio', 'priceToBook', 'revenueGrowth', 'earningsGrowth',
  'profitMargin', 'returnOnEquity', 'debtToEquity', 'dividendYield',
];

function readField(snapshot: FundamentalSnapshot, field: FundamentalField): number | undefined {
  return snapshot[field];
}

function validateFilter(filter: NumericFilter): void {
  if (!fields.includes(filter.field)) throw new Error('unsupported fundamental field');
  if (!Number.isFinite(filter.value)) throw new Error('filter value must be finite');
  if (filter.operator === 'between' && (!Number.isFinite(filter.upperValue) || filter.upperValue! < filter.value)) {
    throw new Error('between filter requires an upperValue >= value');
  }
}

export function matchesFilter(snapshot: FundamentalSnapshot, filter: NumericFilter): boolean {
  validateFilter(filter);
  const actual = readField(snapshot, filter.field);
  if (actual == null || !Number.isFinite(actual)) return false;
  switch (filter.operator) {
    case 'gt': return actual > filter.value;
    case 'gte': return actual >= filter.value;
    case 'lt': return actual < filter.value;
    case 'lte': return actual <= filter.value;
    case 'eq': return actual === filter.value;
    case 'between': return actual >= filter.value && actual <= filter.upperValue!;
  }
}

function matchesGroup(snapshot: FundamentalSnapshot, group: FilterGroup): boolean {
  if (!group.filters.length) return true;
  return group.logic === 'and'
    ? group.filters.every(filter => matchesFilter(snapshot, filter))
    : group.filters.some(filter => matchesFilter(snapshot, filter));
}

export function screenFundamentals(
  snapshots: readonly FundamentalSnapshot[],
  query: ScreenerQuery = {},
): readonly ScreenerMatch[] {
  const filters = query.filters ?? [];
  filters.forEach(validateFilter);
  if (query.limit != null && (!Number.isInteger(query.limit) || query.limit < 1)) throw new Error('limit must be a positive integer');

  const matches = snapshots
    .filter(snapshot => filters.every(filter => matchesFilter(snapshot, filter)))
    .filter(snapshot => (query.groups ?? []).every(group => matchesGroup(snapshot, group)))
    .map(snapshot => ({
      snapshot,
      score: scoreSnapshot(snapshot, [...filters, ...(query.groups ?? []).flatMap(group => [...group.filters])]),
    }))
    .sort((a, b) => b.score - a.score || a.snapshot.symbolId.localeCompare(b.snapshot.symbolId));

  return query.limit == null ? matches : matches.slice(0, query.limit);
}

export function scoreSnapshot(snapshot: FundamentalSnapshot, filters: readonly NumericFilter[]): number {
  if (!filters.length) return 0;
  let passed = 0;
  for (const filter of filters) if (matchesFilter(snapshot, filter)) passed += 1;
  return passed / filters.length;
}
