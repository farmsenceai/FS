const PRODUCTION_CATEGORIES = new Set(['feed', 'chicks', 'medicine_vaccines']);

function number(value) {
  if (value && typeof value === 'object' && typeof value.toString === 'function') return Number(value.toString()) || 0;
  return Number(value) || 0;
}
function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round((number(value) + Number.EPSILON) * factor) / factor;
}
function percent(numerator, denominator) {
  return number(denominator) > 0 ? round((number(numerator) / number(denominator)) * 100, 2) : null;
}
function changePercent(current, previous) {
  return number(previous) !== 0 ? round(((number(current) - number(previous)) / Math.abs(number(previous))) * 100, 2) : null;
}
function sum(rows, selector) { return round(rows.reduce((total, row) => total + number(selector(row)), 0), 2); }

function financialTotals(sales, expenses) {
  const revenue = sum(sales, item => item.revenue);
  const totalExpenses = sum(expenses, item => item.amount);
  const directProductionExpenses = sum(expenses.filter(item => item.batchId && PRODUCTION_CATEGORIES.has(item.category)), item => item.amount);
  const sharedExpenses = sum(expenses.filter(item => !item.batchId), item => item.amount);
  const grossProfit = round(revenue - directProductionExpenses, 2);
  const operationalProfit = round(revenue - totalExpenses, 2);
  return { revenue, totalExpenses, directProductionExpenses, sharedExpenses, grossProfit, operationalProfit, profitMarginPercent: percent(operationalProfit, revenue) };
}

function birdsAlive(initialBirdCount, records, throughDate = null) {
  const eligible = throughDate ? records.filter(item => new Date(item.recordDate) <= throughDate) : records;
  const mortality = eligible.reduce((total, item) => total + number(item.mortality?.count), 0);
  const culls = eligible.reduce((total, item) => total + number(item.culls?.count), 0);
  return { mortality, culls, alive: Math.max(0, number(initialBirdCount) - mortality - culls) };
}

function operationalMetrics(batch, records = []) {
  const ordered = [...records].sort((a, b) => new Date(a.recordDate) - new Date(b.recordDate));
  const mortality = ordered.reduce((total, item) => total + number(item.mortality?.count), 0);
  const culls = ordered.reduce((total, item) => total + number(item.culls?.count), 0);
  const feedKg = round(ordered.reduce((total, item) => total + number(item.feed?.consumedKg), 0), 3);
  const weighted = ordered.filter(item => number(item.avgWeightGrams) > 0);
  const latest = weighted.at(-1);
  let estimatedFcr = null;
  let weightGainKg = null;
  let estimatedFcrFeedKg = null;
  if (weighted.length >= 2) {
    const first = weighted[0];
    const last = weighted.at(-1);
    const firstAlive = birdsAlive(batch.initialBirdCount, ordered, new Date(first.recordDate)).alive;
    const lastAlive = birdsAlive(batch.initialBirdCount, ordered, new Date(last.recordDate)).alive;
    weightGainKg = round((number(last.avgWeightGrams) / 1000 * lastAlive) - (number(first.avgWeightGrams) / 1000 * firstAlive), 3);
    const intervalFeed = ordered
      .filter(item => new Date(item.recordDate) >= new Date(first.recordDate) && new Date(item.recordDate) <= new Date(last.recordDate))
      .reduce((total, item) => total + number(item.feed?.consumedKg), 0);
    if (weightGainKg > 0 && intervalFeed > 0) {
      estimatedFcrFeedKg = round(intervalFeed, 3);
      estimatedFcr = round(intervalFeed / weightGainKg, 3);
    }
  }
  return {
    mortalityCount: mortality,
    cullCount: culls,
    mortalityPercent: percent(mortality, batch.initialBirdCount),
    livabilityPercent: percent(number(batch.initialBirdCount) - mortality, batch.initialBirdCount),
    totalFeedKg: feedKg,
    latestAvgWeightKg: latest ? round(number(latest.avgWeightGrams) / 1000, 3) : null,
    latestWeightRecordDate: latest?.recordDate || null,
    estimatedWeightGainKg: weightGainKg,
    estimatedFcrFeedKg,
    estimatedFcr,
    estimatedFcrLabel: 'Estimated FCR (recorded interval)',
    recordCount: ordered.length,
    weightRecordCount: weighted.length
  };
}

function bucketKey(dateValue, granularity) {
  const date = new Date(dateValue);
  if (granularity === 'month') return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  if (granularity === 'week') {
    const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = monday.getUTCDay() || 7;
    monday.setUTCDate(monday.getUTCDate() - day + 1);
    return monday.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

module.exports = { PRODUCTION_CATEGORIES, number, round, percent, changePercent, sum, financialTotals, operationalMetrics, bucketKey };
