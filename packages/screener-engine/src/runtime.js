const FIELDS = ['marketCap','peRatio','priceToBook','revenueGrowth','earningsGrowth','profitMargin','returnOnEquity','debtToEquity','dividendYield'];

function validateFilter(filter) {
  if (!filter || !FIELDS.includes(filter.field)) throw new Error('unsupported fundamental field');
  if (!Number.isFinite(filter.value)) throw new Error('filter value must be finite');
  if (filter.operator === 'between' && (!Number.isFinite(filter.upperValue) || filter.upperValue < filter.value)) throw new Error('between filter requires an upperValue >= value');
}

function matchesFilter(snapshot, filter) {
  validateFilter(filter);
  const actual = snapshot[filter.field];
  if (!Number.isFinite(actual)) return false;
  switch (filter.operator) {
    case 'gt': return actual > filter.value;
    case 'gte': return actual >= filter.value;
    case 'lt': return actual < filter.value;
    case 'lte': return actual <= filter.value;
    case 'eq': return actual === filter.value;
    case 'between': return actual >= filter.value && actual <= filter.upperValue;
    default: throw new Error('unsupported numeric operator');
  }
}

function scoreSnapshot(snapshot, filters) {
  if (!filters.length) return 0;
  return filters.reduce((score, filter) => score + (matchesFilter(snapshot, filter) ? 1 : 0), 0) / filters.length;
}

export function screenFundamentals(snapshots, query = {}) {
  const filters = query.filters ?? [];
  filters.forEach(validateFilter);
  const groups = query.groups ?? [];
  const matches = snapshots
    .filter(snapshot => filters.every(filter => matchesFilter(snapshot, filter)))
    .filter(snapshot => groups.every(group => {
      if (!Array.isArray(group.filters) || !['and','or'].includes(group.logic)) throw new Error('invalid filter group');
      return group.logic === 'and' ? group.filters.every(filter => matchesFilter(snapshot, filter)) : group.filters.some(filter => matchesFilter(snapshot, filter));
    }))
    .map(snapshot => ({ snapshot, score: scoreSnapshot(snapshot, [...filters, ...groups.flatMap(group => group.filters)]) }))
    .sort((a, b) => b.score - a.score || a.snapshot.symbolId.localeCompare(b.snapshot.symbolId));
  if (query.limit != null && (!Number.isInteger(query.limit) || query.limit < 1)) throw new Error('limit must be a positive integer');
  return query.limit == null ? matches : matches.slice(0, query.limit);
}
