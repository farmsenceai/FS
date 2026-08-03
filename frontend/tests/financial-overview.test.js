const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../src/dashboard/src/views/FinancialOverview.js'), 'utf8');

describe('business financial overview wiring', () => {
  it('uses canonical overview and batch aggregation endpoints', () => {
    assert.match(source, /\/api\/v2\/financial\/overview/);
    assert.match(source, /\/api\/v2\/financial\/batches/);
  });

  it('renders supported totals, category expenses, trend, and completeness', () => {
    for (const field of ['totalExpenses', 'grossProfit', 'operationalProfit', 'profitMarginPercent', 'expenseBreakdown', 'recordedInflowsOutflows', 'costPerBirdSold', 'batchesWithSalesAndDirectExpenses']) {
      assert.match(source, new RegExp(field));
    }
  });

  it('simplifies canonical revenue to live bird sales', () => {
    assert.match(source, /Live bird sales are currently the only canonical revenue source/);
    assert.match(source, /revenueBreakdown/);
  });

  it('does not render unsupported ratios, balances, or savings UI', () => {
    for (const unsupported of ['Current Ratio', 'Debt to Equity', 'Break Even Point', 'Working Capital', 'Opening Balance', 'Closing Balance', 'Top Cost Saving Opportunities', 'Potential Saving', '/savings']) {
      assert.doesNotMatch(source, new RegExp(unsupported.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), 'i'));
    }
  });

  it('has explicit loading, empty, authentication, and retry states', () => {
    assert.match(source, /Loading recorded financial data/);
    assert.match(source, /No sales or expenses were recorded/);
    assert.match(source, /Please sign in again/);
    assert.match(source, /Retry/);
  });
});
