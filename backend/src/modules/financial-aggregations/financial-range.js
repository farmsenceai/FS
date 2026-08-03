const MAX_RANGE_DAYS = 731;

class FinancialRangeError extends Error {
  constructor(message) { super(message); this.code = 'VALIDATION_ERROR'; this.status = 400; }
}

function startOfUtcDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new FinancialRangeError('Date range contains an invalid date');
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function exclusiveEnd(value) {
  const date = startOfUtcDay(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}
function addMilliseconds(date, amount) { return new Date(date.getTime() + amount); }

function resolveRange(query = {}, now = new Date()) {
  const defaultTo = exclusiveEnd(now);
  const toExclusive = query.to ? exclusiveEnd(query.to) : defaultTo;
  const from = query.from ? startOfUtcDay(query.from) : addMilliseconds(toExclusive, -30 * 86400000);
  if (from >= toExclusive) throw new FinancialRangeError('from must be before to');
  const durationMs = toExclusive - from;
  if (durationMs > MAX_RANGE_DAYS * 86400000) throw new FinancialRangeError(`Date range cannot exceed ${MAX_RANGE_DAYS} days`);
  const previousToExclusive = new Date(from);
  const previousFrom = addMilliseconds(previousToExclusive, -durationMs);
  const days = Math.ceil(durationMs / 86400000);
  const granularity = query.granularity || (days <= 45 ? 'day' : days <= 180 ? 'week' : 'month');
  if (!['day', 'week', 'month'].includes(granularity)) throw new FinancialRangeError('granularity must be day, week, or month');
  return { from, toExclusive, previousFrom, previousToExclusive, days, granularity, timezone: 'UTC', boundary: '[from,to)' };
}

function serializeRange(range) {
  return {
    from: range.from.toISOString(),
    toExclusive: range.toExclusive.toISOString(),
    previousFrom: range.previousFrom.toISOString(),
    previousToExclusive: range.previousToExclusive.toISOString(),
    days: range.days,
    granularity: range.granularity,
    timezone: range.timezone,
    boundary: range.boundary
  };
}

module.exports = { FinancialRangeError, resolveRange, serializeRange };
