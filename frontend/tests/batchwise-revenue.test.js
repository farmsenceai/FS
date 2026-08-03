const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../src/dashboard/src/views/BatchwiseRevenue.js'), 'utf8');

describe('business batchwise revenue wiring', () => {
  it('reads the canonical aggregation endpoint and exposes reporting ranges', () => {
    assert.match(source, /\/api\/v2\/financial\/batchwise-revenue/);
    assert.match(source, /Last 30 days/);
    assert.match(source, /Last 90 days/);
    assert.match(source, /Last 365 days/);
  });

  it('renders canonical batch, farm, financial, and operational fields', () => {
    for (const field of [
      'totalRevenue', 'averageRevenuePerBatch', 'batchesWithSales',
      'highestRevenueBatch', 'lowestRevenueBatch', 'revenueChangePercent',
      'revenueByFarm', 'quantitySold', 'saleEventCount', 'weightedAvgPricePerKg',
      'revenuePerBird', 'directExpenseTotal', 'directProfit',
      'directProfitMarginPercent', 'estimatedFcr', 'mortalityPercent'
    ]) assert.match(source, new RegExp(field));
  });

  it('shows completeness, empty, loading, and retryable error states', () => {
    assert.match(source, /Data completeness/);
    assert.match(source, /No recorded batch sales in this period/);
    assert.match(source, /Loading recorded sales and operational data/);
    assert.match(source, /Retry/);
  });

  it('contains no former seeded dashboard values or fabricated batch insight copy', () => {
    for (const mock of ['24,85,600', 'GVF-B104', 'SRF-B102', 'BR_SERIES', 'Revenue Performance Insights', 'Customize Columns']) {
      assert.doesNotMatch(source, new RegExp(mock.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  it('honestly labels formulas and limitations', () => {
    assert.match(source, /Discrete recorded revenue bucketed by sale date/);
    assert.match(source, /Direct profit is recorded revenue minus batch-linked expenses/);
    assert.match(source, /Shared farm expenses are excluded/);
    assert.match(source, /estimated FCR/i);
  });
});
