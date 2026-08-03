const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { afterEach, describe, it } = require('node:test');
const mongoose = require('mongoose');
const formulas = require('../src/modules/financial-aggregations/financial-formulas');
const { resolveRange } = require('../src/modules/financial-aggregations/financial-range');
const repository = require('../src/modules/financial-aggregations/financial-aggregations.repository');
const service = require('../src/modules/financial-aggregations/financial-aggregations.service');

const ids = {
  business: new mongoose.Types.ObjectId(), farm: new mongoose.Types.ObjectId(), batch: new mongoose.Types.ObjectId()
};
const originals = Object.fromEntries(Object.entries(repository).map(([key, value]) => [key, value]));
afterEach(() => { for (const [key, value] of Object.entries(originals)) repository[key] = value; });

describe('canonical financial date and formula semantics', () => {
  it('uses UTC inclusive-from/exclusive-to boundaries and equal previous periods', () => {
    const range = resolveRange({ from: '2026-07-01', to: '2026-07-10', granularity: 'day' });
    assert.equal(range.from.toISOString(), '2026-07-01T00:00:00.000Z');
    assert.equal(range.toExclusive.toISOString(), '2026-07-11T00:00:00.000Z');
    assert.equal(range.previousFrom.toISOString(), '2026-06-21T00:00:00.000Z');
    assert.equal(range.previousToExclusive.toISOString(), '2026-07-01T00:00:00.000Z');
  });

  it('separates gross, operational, direct, and shared expenses', () => {
    const sales = [{ revenue: mongoose.Types.Decimal128.fromString('300.00') }];
    const expenses = [
      { batchId: ids.batch, category: 'feed', amount: mongoose.Types.Decimal128.fromString('100.00') },
      { batchId: null, category: 'utilities', amount: mongoose.Types.Decimal128.fromString('50.00') }
    ];
    assert.deepEqual(formulas.financialTotals(sales, expenses), {
      revenue: 300, totalExpenses: 150, directProductionExpenses: 100, sharedExpenses: 50,
      grossProfit: 200, operationalProfit: 150, profitMarginPercent: 50
    });
  });

  it('marks FCR unavailable without two usable weights and computes recorded-interval FCR when eligible', () => {
    const batch = { initialBirdCount: 100 };
    const incomplete = formulas.operationalMetrics(batch, [{ recordDate: '2026-07-01', feed: { consumedKg: 10 }, avgWeightGrams: 100 }]);
    assert.equal(incomplete.estimatedFcr, null);
    const complete = formulas.operationalMetrics(batch, [
      { recordDate: '2026-07-01', feed: { consumedKg: 10 }, avgWeightGrams: 100, mortality: { count: 0 }, culls: { count: 0 } },
      { recordDate: '2026-07-02', feed: { consumedKg: 20 }, avgWeightGrams: 400, mortality: { count: 0 }, culls: { count: 0 } }
    ]);
    assert.equal(complete.estimatedWeightGainKg, 30);
    assert.equal(complete.estimatedFcrFeedKg, 30);
    assert.equal(complete.estimatedFcr, 1);
  });
});

describe('canonical overview aggregation', () => {
  it('returns real totals, trends, and completeness from canonical repositories', async () => {
    repository.sales = async (_scope, from) => from.getUTCMonth() === 6 ? [{ batchId: ids.batch, saleDate: new Date('2026-07-05'), quantitySold: 10, revenue: mongoose.Types.Decimal128.fromString('300.00'), buyerName: 'Buyer' }] : [];
    repository.expenses = async (_scope, from) => from.getUTCMonth() === 6 ? [{ batchId: ids.batch, expenseDate: new Date('2026-07-06'), category: 'feed', amount: mongoose.Types.Decimal128.fromString('100.00') }, { batchId: null, expenseDate: new Date('2026-07-06'), category: 'utilities', amount: mongoose.Types.Decimal128.fromString('50.00') }] : [];
    repository.batches = async () => [{ _id: ids.batch, businessId: ids.business, farmId: ids.farm, initialBirdCount: 100, code: 'TEST001' }];
    repository.flockRecords = async () => [];
    repository.farms = async () => [{ _id: ids.farm, code: 'F1', name: 'Farm 1' }];
    const result = await service.overview({ role: 'admin' }, { businessId: String(ids.business), farmId: String(ids.farm), from: '2026-07-01', to: '2026-07-10' });
    assert.equal(result.totals.revenue, 300);
    assert.equal(result.totals.operationalProfit, 150);
    assert.equal(result.totals.sharedExpenses, 50);
    assert.equal(result.trend.length, 2);
    assert.equal(result.completeness.batchesWithSalesAndDirectExpenses, 1);
    assert.equal(result.completeness.batchesEligibleForEstimatedFcr, 0);
    assert.equal(result.semantics.balanceSheetMetrics, 'unavailable');
  });

  it('contains no seeded summary or hardcoded forecast imports in affected finance paths', () => {
    const finance = fs.readFileSync(path.join(__dirname, '..', 'modules', 'finance', 'finance.service.js'), 'utf8');
    const legacyRoute = fs.readFileSync(path.join(__dirname, '..', 'routes', 'financialOverviewRoutes.js'), 'utf8');
    for (const source of [finance, legacyRoute]) {
      assert.doesNotMatch(source, /FinancialSummary|BatchProfitability|CostSavingOpportunity|profitForecastData|batchwiseRevenueData/);
    }
  });

  it('has fully retired the legacy singleton models and financial seed script', () => {
    for (const relative of [
      'models/FinancialSummary.js',
      'models/BatchProfitability.js',
      'models/CostSavingOpportunity.js',
      'seed/seedFinancialOverview.js'
    ]) assert.equal(fs.existsSync(path.join(__dirname, '..', relative)), false, relative);

    const runtimeRoots = ['app.js', 'server.js', 'modules', 'routes', 'controllers', 'src'];
    const files = [];
    const collect = value => {
      const stat = fs.statSync(value);
      if (stat.isDirectory()) for (const entry of fs.readdirSync(value)) collect(path.join(value, entry));
      else if (value.endsWith('.js')) files.push(value);
    };
    runtimeRoots.forEach(relative => collect(path.join(__dirname, '..', relative)));
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      assert.doesNotMatch(source, /models[\\/]FinancialSummary|models[\\/]BatchProfitability|models[\\/]CostSavingOpportunity|seedFinancialOverview/, file);
    }
  });
});

describe('canonical historical cohort aggregation', () => {
  it('adds weighted body weight, feed totals, and farm labels to completed cohort buckets', async () => {
    const completed = { _id: ids.batch, businessId: ids.business, farmId: ids.farm, code: 'DONE001', status: 'completed', initialBirdCount: 100, placedAt: new Date('2026-06-01'), actualHarvestAt: new Date('2026-07-05') };
    repository.sales = async () => [];
    repository.expenses = async () => [];
    repository.batches = async (_scope, options) => options?.completedFrom ? [completed] : [completed];
    repository.farms = async () => [{ _id: ids.farm, code: 'F1', name: 'Farm 1' }];
    repository.flockRecords = async () => [
      { batchId: ids.batch, recordDate: new Date('2026-06-02'), feed: { consumedKg: 10 }, avgWeightGrams: 100, mortality: { count: 0 }, culls: { count: 0 } },
      { batchId: ids.batch, recordDate: new Date('2026-07-04'), feed: { consumedKg: 20 }, avgWeightGrams: 500, mortality: { count: 2 }, culls: { count: 0 } }
    ];
    repository.salesForBatches = async () => [];
    repository.expensesForBatches = async () => [];
    const result = await service.historical({ role: 'admin' }, { from: '2026-07-01', to: '2026-07-31', granularity: 'month' });
    assert.equal(result.operationalTrend[0].weightedAverageBodyWeightKg, 0.5);
    assert.equal(result.operationalTrend[0].totalFeedConsumedKg, 30);
    assert.equal(result.operationalTrend[0].birdsPlaced, 100);
    assert.equal(result.batches[0].farmName, 'Farm 1');
    assert.deepEqual(
      result.qualityWorkQueue.map(item => item.issue).sort(),
      ['no_direct_expenses', 'no_sales']
    );
    assert.equal(String(result.qualityWorkQueue[0].farmId), String(ids.farm));
    assert.equal(result.qualityWorkQueue[0].batchCode, 'DONE001');
  });
});

describe('canonical profit forecast model', () => {
  const history = (profits = [20, 22, 24, 26, 28, 30]) => profits.map((profit, index) => ({
    batchId: `b${index}`, completedAt: new Date(Date.UTC(2026, index, 1)), initialBirdCount: 100,
    quantitySold: 100, revenue: 200 + index * 10, expenses: 200 + index * 10 - profit,
    directProfit: profit, revenuePerBirdSold: (200 + index * 10) / 100,
    expensePerBirdPlaced: (200 + index * 10 - profit) / 100,
    directMarginPercent: profit / (200 + index * 10) * 100,
    realizedPricePerKg: 1, mortalityPercent: 2, estimatedFcr: 1.6
  }));

  it('uses a recency-weighted median and fixed non-probabilistic sensitivity bands', () => {
    const baseline = service.baselineFromHistory(history().slice(0, 5));
    assert.ok(baseline.revenuePerBirdSold >= 2.2);
    const bands = service.sensitivity(1000, 600);
    assert.deepEqual(bands.lower, { revenue: 900, expenses: 660, profit: 240, marginPercent: 26.67 });
    assert.deepEqual(bands.upper, { revenue: 1100, expenses: 540, profit: 560, marginPercent: 50.91 });
    assert.equal(bands.assumptions.probabilityClaimed, false);
  });

  it('back-tests against chronological held-out batches and gates excessive error', () => {
    const passing = service.backtestHistory(history());
    assert.equal(passing.holdoutCount, 2);
    assert.equal(passing.passed, true);
    const failingRows = history();
    failingRows[5] = { ...failingRows[5], revenue: 2000, expenses: 20, directProfit: 1980, revenuePerBirdSold: 20, expensePerBirdPlaced: .2 };
    assert.equal(service.backtestHistory(failingRows).passed, false);
  });

  it('requires five eligible historical samples', () => {
    assert.equal(service.FORECAST_METHOD.minimumSample, 5);
    assert.equal(service.backtestHistory(history().slice(0, 4)).holdoutCount, 0);
  });

  it('describes excluded history and missing active harvest inputs without bypassing gates', async () => {
    const completed = { _id: ids.batch, businessId: ids.business, farmId: ids.farm, code: 'DONE-MISSING', status: 'completed', initialBirdCount: 100, placedAt: new Date('2026-05-01'), actualHarvestAt: new Date('2026-06-10') };
    const active = { _id: new mongoose.Types.ObjectId(), businessId: ids.business, farmId: ids.farm, code: 'ACTIVE-MISSING', status: 'active', initialBirdCount: 100, placedAt: new Date('2026-07-01'), expectedHarvestAt: null };
    repository.batches = async () => [completed, active];
    repository.salesForBatches = async () => [];
    repository.expensesForBatches = async () => [];
    repository.flockRecords = async () => [];
    const result = await service.forecast({ role: 'admin' }, { businessId: String(ids.business), from: '2026-01-01', to: '2026-07-31' });
    assert.equal(result.available, false);
    assert.equal(result.reasonCode, 'INSUFFICIENT_HISTORY');
    assert.deepEqual(result.historicalSample.excludedBatches[0].reasons, ['missing_recorded_sales', 'missing_direct_expenses']);
    assert.equal(result.readiness.activeBatchesMissingExpectedHarvestCount, 1);
    assert.equal(result.readiness.activeBatchesMissingExpectedHarvest[0].batchCode, 'ACTIVE-MISSING');
  });
});
