const mongoose = require('mongoose');
const repository = require('./financial-aggregations.repository');
const formulas = require('./financial-formulas');
const { resolveRange, serializeRange } = require('./financial-range');
const { isAdmin, isBusiness } = require('../../shared/auth/roleAccess');

class FinancialAggregationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR', status = 400) { super(message); this.code = code; this.status = status; }
}
function assertRole(user) {
  if (!isAdmin(user) && !isBusiness(user)) throw new FinancialAggregationError('Financial data access requires an admin or business role', 'POLICY_DENIED', 403);
}
function objectId(value, field) {
  if (!value) return null;
  if (!mongoose.isObjectIdOrHexString(value)) throw new FinancialAggregationError(`${field} must be a valid ObjectId`);
  return new mongoose.Types.ObjectId(String(value));
}
function resolveScope(user, query = {}) {
  assertRole(user);
  return {
    businessId: objectId(query.businessId, 'businessId'),
    farmId: objectId(query.farmId, 'farmId'),
    batchId: objectId(query.batchId, 'batchId'),
    visibility: isBusiness(user) ? 'platform_read_only' : 'admin'
  };
}
function id(value) { return String(value?._id || value || ''); }
function groupBy(rows, selector) {
  return rows.reduce((map, row) => { const key = String(selector(row) || ''); if (!map.has(key)) map.set(key, []); map.get(key).push(row); return map; }, new Map());
}
function expenseBreakdown(expenses) {
  const total = formulas.sum(expenses, item => item.amount);
  return [...groupBy(expenses, item => item.category).entries()].map(([category, rows]) => {
    const amount = formulas.sum(rows, item => item.amount);
    return { category, amount, percent: formulas.percent(amount, total), entryCount: rows.length };
  }).sort((a, b) => b.amount - a.amount);
}
function transactionTrend(sales, expenses, granularity) {
  const buckets = new Map();
  const ensure = key => { if (!buckets.has(key)) buckets.set(key, { period: key, revenue: 0, expenses: 0, operationalProfit: 0 }); return buckets.get(key); };
  for (const sale of sales) ensure(formulas.bucketKey(sale.saleDate, granularity)).revenue += formulas.number(sale.revenue);
  for (const expense of expenses) ensure(formulas.bucketKey(expense.expenseDate, granularity)).expenses += formulas.number(expense.amount);
  return [...buckets.values()].sort((a, b) => a.period.localeCompare(b.period)).map(row => ({ ...row, revenue: formulas.round(row.revenue), expenses: formulas.round(row.expenses), operationalProfit: formulas.round(row.revenue - row.expenses) }));
}

function makeCompleteness(batches, sales, expenses, metricsByBatch) {
  const salesBatches = new Set(sales.map(item => id(item.batchId)));
  const expenseBatches = new Set(expenses.filter(item => item.batchId).map(item => id(item.batchId)));
  const both = [...salesBatches].filter(batchId => expenseBatches.has(batchId));
  const metrics = [...metricsByBatch.values()];
  return {
    batchCountInScope: batches.length,
    saleEventCount: sales.length,
    expenseEntryCount: expenses.length,
    sharedExpenseEntryCount: expenses.filter(item => !item.batchId).length,
    batchesWithSales: salesBatches.size,
    batchesWithDirectExpenses: expenseBatches.size,
    batchesWithSalesAndDirectExpenses: both.length,
    batchesWithoutSales: Math.max(0, batches.length - salesBatches.size),
    batchesWithoutDirectExpenses: Math.max(0, batches.length - expenseBatches.size),
    batchesWithFlockRecords: metrics.filter(item => item.recordCount > 0).length,
    batchesWithWeightRecords: metrics.filter(item => item.weightRecordCount > 0).length,
    batchesEligibleForEstimatedFcr: metrics.filter(item => item.estimatedFcr !== null).length,
    estimatedFcrLimitation: 'Requires at least two weight records and positive recorded-interval biomass gain; placement weight and biomass of losses are unavailable.'
  };
}

async function loadContext(user, query = {}) {
  const scope = resolveScope(user, query);
  const range = resolveRange(query);
  const [sales, expenses, previousSales, previousExpenses, batches] = await Promise.all([
    repository.sales(scope, range.from, range.toExclusive),
    repository.expenses(scope, range.from, range.toExclusive),
    repository.sales(scope, range.previousFrom, range.previousToExclusive),
    repository.expenses(scope, range.previousFrom, range.previousToExclusive),
    repository.batches(scope)
  ]);
  const batchIds = batches.map(item => item._id);
  const farmIds = [...new Set(batches.map(item => id(item.farmId)).filter(Boolean))];
  const [records, farms] = await Promise.all([repository.flockRecords(scope, batchIds), repository.farms(farmIds)]);
  const recordsByBatch = groupBy(records, item => item.batchId);
  const metricsByBatch = new Map(batches.map(batch => [id(batch), formulas.operationalMetrics(batch, recordsByBatch.get(id(batch)) || [])]));
  return {
    scope, range, sales, expenses, previousSales, previousExpenses, batches, records,
    farmById: new Map(farms.map(farm => [id(farm), farm])), metricsByBatch,
    completeness: makeCompleteness(batches, sales, expenses, metricsByBatch)
  };
}

function batchRows(context) {
  const salesByBatch = groupBy(context.sales, item => item.batchId);
  const expensesByBatch = groupBy(context.expenses.filter(item => item.batchId), item => item.batchId);
  const relevant = new Set([...salesByBatch.keys(), ...expensesByBatch.keys()]);
  return context.batches.filter(batch => relevant.has(id(batch))).map(batch => {
    const sales = salesByBatch.get(id(batch)) || [];
    const expenses = expensesByBatch.get(id(batch)) || [];
    const totals = formulas.financialTotals(sales, expenses);
    const operations = context.metricsByBatch.get(id(batch));
    const quantitySold = sales.reduce((total, item) => total + formulas.number(item.quantitySold), 0);
    const soldKg = sales.reduce((total, item) => total + formulas.number(item.quantitySold) * formulas.number(item.avgWeightKg), 0);
    const firstSaleDate = sales.length ? new Date(Math.min(...sales.map(item => new Date(item.saleDate)))).toISOString() : null;
    const lastSaleDate = sales.length ? new Date(Math.max(...sales.map(item => new Date(item.saleDate)))).toISOString() : null;
    const sellable = Math.max(0, formulas.number(batch.initialBirdCount) - operations.mortalityCount - operations.cullCount);
    const state = quantitySold === 0 ? 'no_sales' : quantitySold < sellable ? 'partially_sold' : totals.operationalProfit >= 0 ? 'sold_profitable' : 'sold_loss';
    const farm = context.farmById.get(id(batch.farmId));
    return {
      batchId: batch._id,
      batchCode: batch.code,
      farmId: batch.farmId,
      farmCode: farm?.code || null,
      farmName: farm?.name || null,
      breed: batch.breed,
      birdType: batch.birdType,
      batchStatus: batch.status,
      placedAt: batch.placedAt,
      actualHarvestAt: batch.actualHarvestAt || null,
      initialBirdCount: batch.initialBirdCount,
      quantitySold,
      saleEventCount: sales.length,
      firstSaleDate,
      lastSaleDate,
      weightedAvgSaleWeightKg: quantitySold ? formulas.round(soldKg / quantitySold, 3) : null,
      weightedAvgPricePerKg: soldKg ? formulas.round(totals.revenue / soldKg, 2) : null,
      revenuePerBird: quantitySold ? formulas.round(totals.revenue / quantitySold, 2) : null,
      revenue: totals.revenue,
      directExpenseTotal: totals.totalExpenses,
      grossProfit: totals.grossProfit,
      directProfit: totals.operationalProfit,
      directProfitMarginPercent: totals.profitMarginPercent,
      sharedExpenseAllocation: 'excluded',
      saleState: state,
      operations
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

async function overview(user, query) {
  const context = await loadContext(user, query);
  const totals = formulas.financialTotals(context.sales, context.expenses);
  const previous = formulas.financialTotals(context.previousSales, context.previousExpenses);
  return {
    generatedAt: new Date().toISOString(), currency: 'INR', scope: context.scope, range: serializeRange(context.range),
    semantics: {
      financialBasis: 'Transactions are included by saleDate and expenseDate within [from,to).',
      operationalProfit: 'Sale revenue minus every recorded expense in scope, including shared farm expenses at farm/business level.',
      grossProfit: 'Sale revenue minus batch-linked feed, chicks, and medicine_vaccines expenses.',
      balanceSheetMetrics: 'unavailable', cashBalances: 'unavailable'
    },
    totals,
    changes: Object.fromEntries(['revenue', 'totalExpenses', 'grossProfit', 'operationalProfit'].map(field => [field, formulas.changePercent(totals[field], previous[field])])),
    trend: transactionTrend(context.sales, context.expenses, context.range.granularity),
    expenseBreakdown: expenseBreakdown(context.expenses),
    recordedInflowsOutflows: { inflows: totals.revenue, outflows: totals.totalExpenses, netRecordedFlow: totals.operationalProfit },
    revenueBreakdown: [{ source: 'live_bird_sales', amount: totals.revenue, percent: totals.revenue ? 100 : null, eventCount: context.sales.length }],
    revenueByBuyer: [...groupBy(context.sales, item => item.buyerName || 'Unspecified').entries()].map(([buyerName, rows]) => ({ buyerName, revenue: formulas.sum(rows, item => item.revenue), eventCount: rows.length })).sort((a, b) => b.revenue - a.revenue),
    costPerBirdSold: context.sales.reduce((total, item) => total + formulas.number(item.quantitySold), 0) ? formulas.round(totals.totalExpenses / context.sales.reduce((total, item) => total + formulas.number(item.quantitySold), 0), 2) : null,
    completeness: context.completeness
  };
}

async function batches(user, query = {}) {
  const context = await loadContext(user, query);
  const rows = batchRows(context);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(1000, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const start = (page - 1) * limit;
  return { generatedAt: new Date().toISOString(), currency: 'INR', scope: context.scope, range: serializeRange(context.range), semantics: { financialBasis: 'Period transaction dates', batchProfit: 'Direct profit excludes unallocated shared farm expenses' }, data: rows.slice(start, start + limit), meta: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) }, completeness: context.completeness };
}

async function batchwiseRevenue(user, query = {}) {
  const context = await loadContext(user, query);
  const rows = batchRows(context).filter(item => item.saleEventCount > 0);
  const revenue = formulas.sum(rows, item => item.revenue);
  const ranked = [...rows].sort((a, b) => b.revenue - a.revenue);
  return {
    generatedAt: new Date().toISOString(), currency: 'INR', scope: context.scope, range: serializeRange(context.range),
    semantics: { trend: 'Discrete sale revenue bucketed by saleDate; no revenue is interpolated on days without sales.', birds: 'Birds sold, not birds placed.', averagePrice: 'Revenue divided by sold live weight.' },
    stats: { totalRevenue: revenue, averageRevenuePerBatch: rows.length ? formulas.round(revenue / rows.length) : null, batchesWithSales: rows.length, highestRevenueBatch: ranked[0] || null, lowestRevenueBatch: ranked.at(-1) || null, revenueChangePercent: formulas.changePercent(revenue, formulas.financialTotals(context.previousSales, []).revenue) },
    trend: transactionTrend(context.sales, [], context.range.granularity).map(item => ({ period: item.period, revenue: item.revenue })),
    saleEvents: context.sales.map(item => ({ saleId: item._id, batchId: item.batchId, saleDate: item.saleDate, quantitySold: item.quantitySold, revenue: formulas.number(item.revenue) })).sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate)),
    batches: rows,
    revenueByFarm: [...groupBy(rows, item => item.farmId).entries()].map(([farmId, items]) => ({ farmId, farmName: items[0]?.farmName || null, revenue: formulas.sum(items, item => item.revenue), batchCount: items.length })).sort((a, b) => b.revenue - a.revenue),
    completeness: context.completeness
  };
}

async function historical(user, query = {}) {
  const context = await loadContext(user, query);
  const cohort = await repository.batches(context.scope, { completedFrom: context.range.from, completedToExclusive: context.range.toExclusive });
  const cohortIds = cohort.map(item => item._id);
  const [cohortRecords, cohortSales, cohortExpenses] = await Promise.all([
    repository.flockRecords(context.scope, cohortIds),
    repository.salesForBatches(context.scope, cohortIds),
    repository.expensesForBatches(context.scope, cohortIds)
  ]);
  const recordsByBatch = groupBy(cohortRecords, item => item.batchId);
  const salesByBatch = groupBy(cohortSales, item => item.batchId);
  const expensesByBatch = groupBy(cohortExpenses, item => item.batchId);
  const metrics = cohort.map(batch => ({
    batch,
    operations: formulas.operationalMetrics(batch, recordsByBatch.get(id(batch)) || []),
    financials: formulas.financialTotals(salesByBatch.get(id(batch)) || [], expensesByBatch.get(id(batch)) || [])
  }));
  const placed = metrics.reduce((total, item) => total + formulas.number(item.batch.initialBirdCount), 0);
  const mortality = metrics.reduce((total, item) => total + item.operations.mortalityCount, 0);
  const eligibleFcr = metrics.filter(item => item.operations.estimatedFcr !== null);
  const totalGain = eligibleFcr.reduce((total, item) => total + formulas.number(item.operations.estimatedWeightGainKg), 0);
  const eligibleFeed = eligibleFcr.reduce((total, item) => total + formulas.number(item.operations.estimatedFcrFeedKg), 0);
  const weightedBody = metrics.filter(item => item.operations.latestAvgWeightKg !== null).reduce((result, item) => {
    const alive = Math.max(0, formulas.number(item.batch.initialBirdCount) - item.operations.mortalityCount - item.operations.cullCount);
    result.weightedKg += formulas.number(item.operations.latestAvgWeightKg) * alive;
    result.birds += alive;
    return result;
  }, { weightedKg: 0, birds: 0 });
  const operationalTrend = [...groupBy(metrics, item => formulas.bucketKey(item.batch.actualHarvestAt, context.range.granularity)).entries()].map(([period, items]) => {
    const bucketPlaced = items.reduce((total, item) => total + formulas.number(item.batch.initialBirdCount), 0);
    const bucketMortality = items.reduce((total, item) => total + item.operations.mortalityCount, 0);
    const fcrItems = items.filter(item => item.operations.estimatedFcr !== null);
    const gain = fcrItems.reduce((total, item) => total + formulas.number(item.operations.estimatedWeightGainKg), 0);
    const feed = fcrItems.reduce((total, item) => total + formulas.number(item.operations.estimatedFcrFeedKg), 0);
    const bucketBody = items.filter(item => item.operations.latestAvgWeightKg !== null).reduce((result, item) => {
      const alive = Math.max(0, formulas.number(item.batch.initialBirdCount) - item.operations.mortalityCount - item.operations.cullCount);
      result.weightedKg += formulas.number(item.operations.latestAvgWeightKg) * alive;
      result.birds += alive;
      return result;
    }, { weightedKg: 0, birds: 0 });
    return { period, completedBatchCount: items.length, birdsPlaced: bucketPlaced, mortalityPercent: formulas.percent(bucketMortality, bucketPlaced), livabilityPercent: formulas.percent(bucketPlaced - bucketMortality, bucketPlaced), weightedAverageBodyWeightKg: bucketBody.birds ? formulas.round(bucketBody.weightedKg / bucketBody.birds, 3) : null, totalFeedConsumedKg: formulas.round(items.reduce((total, item) => total + formulas.number(item.operations.totalFeedKg), 0), 3), estimatedFcr: gain > 0 ? formulas.round(feed / gain, 3) : null, estimatedFcrEligibleBatchCount: fcrItems.length };
  }).sort((a, b) => a.period.localeCompare(b.period));
  const qualityWorkQueue = [];
  const addIssue = (batch, issue, sourceTab) => {
    const farm = context.farmById.get(id(batch.farmId));
    qualityWorkQueue.push({ issue, sourceTab, batchId: batch._id, batchCode: batch.code, farmId: batch.farmId, farmCode: farm?.code || null, farmName: farm?.name || null });
  };
  for (const batch of context.batches.filter(item => item.status === 'completed' && !item.actualHarvestAt)) addIssue(batch, 'missing_actual_harvest_at', 'overview');
  for (const item of metrics) {
    const batchId = id(item.batch);
    const sales = salesByBatch.get(batchId) || [];
    const expenses = expensesByBatch.get(batchId) || [];
    if (!item.operations.recordCount) addIssue(item.batch, 'no_flock_records', 'overview');
    if (item.operations.estimatedFcr === null) addIssue(item.batch, 'insufficient_weight_records_for_fcr', 'overview');
    if (!sales.length) addIssue(item.batch, 'no_sales', 'sales');
    if (!expenses.length) addIssue(item.batch, 'no_direct_expenses', 'expenses');
    const quantitySold = sales.reduce((total, sale) => total + formulas.number(sale.quantitySold), 0);
    const sellable = Math.max(0, formulas.number(item.batch.initialBirdCount) - item.operations.mortalityCount - item.operations.cullCount);
    if (quantitySold > sellable) addIssue(item.batch, 'sale_quantity_inconsistency', 'sales');
  }
  return {
    generatedAt: new Date().toISOString(), currency: 'INR', scope: context.scope, range: serializeRange(context.range),
    semantics: { cohort: 'Completed batches whose actualHarvestAt falls within [from,to). Batches missing actualHarvestAt are excluded.', financialTrend: 'Independent transaction-date view using saleDate and expenseDate.', averages: 'Mortality/livability are weighted by birds placed; FCR is an eligible-cohort aggregate estimate.' },
    cohort: { completedBatchCount: cohort.length, birdsPlaced: placed, mortalityCount: mortality, mortalityPercent: formulas.percent(mortality, placed), livabilityPercent: formulas.percent(placed - mortality, placed), weightedAverageBodyWeightKg: weightedBody.birds ? formulas.round(weightedBody.weightedKg / weightedBody.birds, 3) : null, estimatedFcr: totalGain > 0 ? formulas.round(eligibleFeed / totalGain, 3) : null, estimatedFcrEligibleBatchCount: eligibleFcr.length },
    operationalTrend,
    financialTrend: transactionTrend(context.sales, context.expenses, context.range.granularity),
    batches: metrics.map(item => { const farm = context.farmById.get(id(item.batch.farmId)); return ({ batchId: item.batch._id, batchCode: item.batch.code, farmId: item.batch.farmId, farmCode: farm?.code || null, farmName: farm?.name || null, placedAt: item.batch.placedAt, actualHarvestAt: item.batch.actualHarvestAt, initialBirdCount: item.batch.initialBirdCount, cycleDays: item.batch.actualHarvestAt ? Math.ceil((new Date(item.batch.actualHarvestAt) - new Date(item.batch.placedAt)) / 86400000) : null, operations: item.operations, financials: { revenue: item.financials.revenue, directExpenses: item.financials.totalExpenses, directProfit: item.financials.operationalProfit, directProfitMarginPercent: item.financials.profitMarginPercent, sharedExpenseAllocation: 'excluded' } }); }),
    topBatchesByDirectProfit: metrics.map(item => ({ batchId: item.batch._id, batchCode: item.batch.code, directProfit: item.financials.operationalProfit, marginPercent: item.financials.profitMarginPercent })).sort((a, b) => b.directProfit - a.directProfit).slice(0, 10),
    qualityWorkQueue,
    completeness: { ...context.completeness, completedCohortCount: cohort.length, completedBatchesMissingActualHarvestAt: context.batches.filter(item => item.status === 'completed' && !item.actualHarvestAt).length, cohortBatchesEligibleForEstimatedFcr: eligibleFcr.length }
  };
}

const FORECAST_METHOD = Object.freeze({ version: 'historical-recency-weighted-median-v1', minimumSample: 5, sensitivityPercent: 10, backtestMaxWapePercent: 35 });
function weightedMedian(entries) {
  const usable = entries.filter(item => Number.isFinite(item.value) && item.weight > 0).sort((a, b) => a.value - b.value);
  const total = usable.reduce((sum, item) => sum + item.weight, 0);
  let cumulative = 0;
  for (const item of usable) { cumulative += item.weight; if (cumulative >= total / 2) return formulas.round(item.value, 4); }
  return null;
}
function baselineFromHistory(rows) {
  const ordered = [...rows].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const metric = selector => weightedMedian(ordered.map((row, index) => ({ value: selector(row), weight: index + 1 })));
  return {
    revenuePerBirdSold: metric(row => row.revenuePerBirdSold),
    expensePerBirdPlaced: metric(row => row.expensePerBirdPlaced),
    directMarginPercent: metric(row => row.directMarginPercent),
    realizedPricePerKg: metric(row => row.realizedPricePerKg),
    mortalityPercent: metric(row => row.mortalityPercent),
    estimatedFcr: metric(row => row.estimatedFcr)
  };
}
function backtestHistory(rows) {
  const ordered = [...rows].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const tests = [];
  for (let index = FORECAST_METHOD.minimumSample - 1; index < ordered.length; index += 1) {
    const baseline = baselineFromHistory(ordered.slice(0, index));
    const actual = ordered[index];
    const estimatedRevenue = formulas.round(baseline.revenuePerBirdSold * actual.quantitySold);
    const estimatedExpenses = formulas.round(baseline.expensePerBirdPlaced * actual.initialBirdCount);
    tests.push({ batchId: actual.batchId, completedAt: actual.completedAt, actualRevenue: actual.revenue, estimatedRevenue, actualExpenses: actual.expenses, estimatedExpenses, actualProfit: actual.directProfit, estimatedProfit: formulas.round(estimatedRevenue - estimatedExpenses) });
  }
  const wape = (actualKey, estimateKey) => {
    const denominator = tests.reduce((sum, row) => sum + Math.abs(row[actualKey]), 0);
    return denominator ? formulas.round(tests.reduce((sum, row) => sum + Math.abs(row[estimateKey] - row[actualKey]), 0) / denominator * 100, 2) : null;
  };
  const revenueWapePercent = wape('actualRevenue', 'estimatedRevenue');
  const expenseWapePercent = wape('actualExpenses', 'estimatedExpenses');
  return { holdoutCount: tests.length, revenueWapePercent, expenseWapePercent, profitMae: tests.length ? formulas.round(tests.reduce((sum, row) => sum + Math.abs(row.estimatedProfit - row.actualProfit), 0) / tests.length) : null, thresholdPercent: FORECAST_METHOD.backtestMaxWapePercent, passed: tests.length > 0 && revenueWapePercent !== null && expenseWapePercent !== null && revenueWapePercent <= FORECAST_METHOD.backtestMaxWapePercent && expenseWapePercent <= FORECAST_METHOD.backtestMaxWapePercent, estimates: tests };
}
function sensitivity(estimatedRevenue, estimatedExpenses) {
  const rate = FORECAST_METHOD.sensitivityPercent / 100;
  const scenario = (revenue, expenses) => ({ revenue: formulas.round(revenue), expenses: formulas.round(expenses), profit: formulas.round(revenue - expenses), marginPercent: formulas.percent(revenue - expenses, revenue) });
  return { lower: scenario(estimatedRevenue * (1 - rate), estimatedExpenses * (1 + rate)), baseline: scenario(estimatedRevenue, estimatedExpenses), upper: scenario(estimatedRevenue * (1 + rate), estimatedExpenses * (1 - rate)), assumptions: { lower: 'Revenue -10%; expenses +10%', upper: 'Revenue +10%; expenses -10%', probabilityClaimed: false } };
}

async function forecast(user, query = {}) {
  const scope = resolveScope(user, query);
  const range = resolveRange(query);
  const allBatches = await repository.batches(scope);
  const completed = allBatches.filter(batch => batch.status === 'completed' && batch.actualHarvestAt && new Date(batch.actualHarvestAt) >= range.from && new Date(batch.actualHarvestAt) < range.toExclusive);
  const completedIds = completed.map(batch => batch._id);
  const [historySales, historyExpenses, historyRecords] = await Promise.all([repository.salesForBatches(scope, completedIds), repository.expensesForBatches(scope, completedIds), repository.flockRecords(scope, completedIds)]);
  const salesByBatch = groupBy(historySales, item => item.batchId);
  const expensesByBatch = groupBy(historyExpenses, item => item.batchId);
  const recordsByBatch = groupBy(historyRecords, item => item.batchId);
  const historyCandidates = completed.map(batch => {
    const sales = salesByBatch.get(id(batch)) || [], expenses = expensesByBatch.get(id(batch)) || [], operations = formulas.operationalMetrics(batch, recordsByBatch.get(id(batch)) || []), totals = formulas.financialTotals(sales, expenses);
    const quantitySold = sales.reduce((sum, sale) => sum + formulas.number(sale.quantitySold), 0);
    const soldKg = sales.reduce((sum, sale) => sum + formulas.number(sale.quantitySold) * formulas.number(sale.avgWeightKg), 0);
    const row = { batchId: batch._id, batchCode: batch.code, farmId: batch.farmId, completedAt: batch.actualHarvestAt, initialBirdCount: formulas.number(batch.initialBirdCount), quantitySold, revenue: totals.revenue, expenses: totals.totalExpenses, directProfit: totals.operationalProfit, revenuePerBirdSold: quantitySold ? totals.revenue / quantitySold : null, expensePerBirdPlaced: batch.initialBirdCount ? totals.totalExpenses / batch.initialBirdCount : null, directMarginPercent: totals.profitMarginPercent, realizedPricePerKg: soldKg ? totals.revenue / soldKg : null, mortalityPercent: operations.mortalityPercent, estimatedFcr: operations.estimatedFcr };
    const exclusionReasons = [];
    if (row.initialBirdCount <= 0) exclusionReasons.push('missing_initial_bird_count');
    if (row.quantitySold <= 0 || row.revenue <= 0) exclusionReasons.push('missing_recorded_sales');
    if (row.expenses <= 0) exclusionReasons.push('missing_direct_expenses');
    return { row, exclusionReasons };
  });
  const history = historyCandidates.filter(item => !item.exclusionReasons.length).map(item => item.row);
  const excludedHistory = historyCandidates.filter(item => item.exclusionReasons.length).map(item => ({ batchId: item.row.batchId, batchCode: item.row.batchCode, farmId: item.row.farmId, completedAt: item.row.completedAt, reasons: item.exclusionReasons }));
  const missingExpectedHarvest = allBatches.filter(batch => ['active', 'planned'].includes(batch.status) && !batch.expectedHarvestAt).map(batch => ({ batchId: batch._id, batchCode: batch.code, farmId: batch.farmId, status: batch.status }));
  const base = {
    generatedAt: new Date().toISOString(), currency: 'INR', scope, range: serializeRange(range),
    method: { ...FORECAST_METHOD, description: 'Recency-weighted medians of realized completed-batch revenue per bird and direct expense per bird placed, using recorded canonical transactions.' },
    historicalSample: { eligibleBatchCount: history.length, minimumRequired: FORECAST_METHOD.minimumSample, excludedCompletedBatchCount: excludedHistory.length, excludedBatches: excludedHistory },
    readiness: { activeBatchesMissingExpectedHarvestCount: missingExpectedHarvest.length, activeBatchesMissingExpectedHarvest: missingExpectedHarvest }
  };
  if (history.length < FORECAST_METHOD.minimumSample) return { ...base, available: false, reasonCode: 'INSUFFICIENT_HISTORY', reason: `Forecast unavailable: at least ${FORECAST_METHOD.minimumSample} completed batches with recorded sales and direct expenses are required.` };
  const backtest = backtestHistory(history);
  if (!backtest.passed) return { ...base, available: false, reasonCode: 'BACKTEST_FAILED', reason: `Forecast unavailable: held-out error exceeded the ${FORECAST_METHOD.backtestMaxWapePercent}% revenue/expense WAPE threshold.`, backtest };
  const baseline = baselineFromHistory(history);
  const horizonDays = Math.min(180, Math.max(1, Number.parseInt(query.horizonDays, 10) || 60));
  const asOf = range.toExclusive;
  const horizonEnd = new Date(asOf); horizonEnd.setUTCDate(horizonEnd.getUTCDate() + horizonDays);
  const active = allBatches.filter(batch => ['active', 'planned'].includes(batch.status) && batch.expectedHarvestAt && new Date(batch.expectedHarvestAt) >= asOf && new Date(batch.expectedHarvestAt) < horizonEnd);
  const activeIds = active.map(batch => batch._id);
  const [activeSales, activeExpenses, activeRecords, farms] = await Promise.all([repository.salesForBatches(scope, activeIds), repository.expensesForBatches(scope, activeIds), repository.flockRecords(scope, activeIds), repository.farms([...new Set(active.map(batch => id(batch.farmId)).filter(Boolean))])]);
  const activeSalesByBatch = groupBy(activeSales, item => item.batchId), activeExpensesByBatch = groupBy(activeExpenses, item => item.batchId), activeRecordsByBatch = groupBy(activeRecords, item => item.batchId), farmById = new Map(farms.map(farm => [id(farm), farm]));
  const batches = active.map(batch => {
    const sales = activeSalesByBatch.get(id(batch)) || [], expenses = activeExpensesByBatch.get(id(batch)) || [], operations = formulas.operationalMetrics(batch, activeRecordsByBatch.get(id(batch)) || []), recorded = formulas.financialTotals(sales, expenses);
    const alreadySold = sales.reduce((sum, sale) => sum + formulas.number(sale.quantitySold), 0);
    const birdsToSell = Math.max(0, formulas.number(batch.initialBirdCount) - operations.mortalityCount - operations.cullCount - alreadySold);
    const estimatedRevenue = formulas.round(recorded.revenue + birdsToSell * baseline.revenuePerBirdSold);
    const estimatedExpenses = formulas.round(Math.max(recorded.totalExpenses, formulas.number(batch.initialBirdCount) * baseline.expensePerBirdPlaced));
    const farm = farmById.get(id(batch.farmId));
    return { batchId: batch._id, batchCode: batch.code, farmId: batch.farmId, farmName: farm?.name || null, status: batch.status, expectedHarvestAt: batch.expectedHarvestAt, initialBirdCount: batch.initialBirdCount, mortalityCount: operations.mortalityCount, cullCount: operations.cullCount, alreadySold, estimatedBirdsToSell: birdsToSell, recordedRevenue: recorded.revenue, recordedExpenses: recorded.totalExpenses, estimate: sensitivity(estimatedRevenue, estimatedExpenses), comparisons: { currentMortalityPercent: operations.mortalityPercent, historicalMortalityPercent: baseline.mortalityPercent, currentEstimatedFcr: operations.estimatedFcr, historicalEstimatedFcr: baseline.estimatedFcr } };
  });
  if (!batches.length) return { ...base, available: false, reasonCode: 'NO_ELIGIBLE_ACTIVE_BATCHES', reason: `Forecast unavailable: no active or planned batch has an expected harvest date within the next ${horizonDays} days.`, backtest, baseline, horizonDays };
  const totals = batches.reduce((sum, batch) => { for (const key of ['lower', 'baseline', 'upper']) { sum[key].revenue += batch.estimate[key].revenue; sum[key].expenses += batch.estimate[key].expenses; } return sum; }, { lower: { revenue: 0, expenses: 0 }, baseline: { revenue: 0, expenses: 0 }, upper: { revenue: 0, expenses: 0 } });
  for (const key of ['lower', 'baseline', 'upper']) totals[key] = sensitivity(totals[key].revenue, totals[key].expenses).baseline;
  return { ...base, available: true, asOf: asOf.toISOString(), horizonDays, backtest, baseline, sensitivity: { ...totals, assumptions: sensitivity(1, 1).assumptions }, batches, factualComparisons: [`Historical baseline uses ${history.length} eligible completed batches.`, `Held-out revenue WAPE was ${backtest.revenueWapePercent}% and expense WAPE was ${backtest.expenseWapePercent}%.`, `Median realized direct margin was ${baseline.directMarginPercent}%.`] };
}

function retiredSavings() {
  throw new FinancialAggregationError('Cost-saving opportunities were retired because no canonical counterfactual-savings source exists', 'GONE', 410);
}

module.exports = { FinancialAggregationError, resolveScope, loadContext, overview, batches, batchwiseRevenue, historical, forecast, retiredSavings, weightedMedian, baselineFromHistory, backtestHistory, sensitivity, FORECAST_METHOD };
