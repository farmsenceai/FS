const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const dashboard = fs.readFileSync(path.join(__dirname, '../src/dashboard/index-admin.html'), 'utf8');
const controller = fs.readFileSync(path.join(__dirname, '../src/dashboard/index-admin.js'), 'utf8');
const context = fs.readFileSync(path.join(__dirname, '../src/dashboard/src/views-admin/FinancialIntelligence.js'), 'utf8');

describe('admin Financial Intelligence context foundation', () => {
  it('registers all four pages in navigation and the dashboard controller', () => {
    for (const page of ['AdminFinancialOverview', 'AdminProfitForecast', 'AdminBatchwiseRevenue', 'AdminHistoricalReports']) {
      assert.match(dashboard, new RegExp(`data-page="${page}"`));
      assert.match(controller, new RegExp(`${page}: view${page}`));
    }
    assert.match(dashboard, /FINANCIAL INTELLIGENCE/);
  });

  it('loads the shared view before the main controller', () => {
    assert.ok(dashboard.indexOf('src/views-admin/FinancialIntelligence.js') > -1);
    assert.ok(dashboard.indexOf('src/views-admin/FinancialIntelligence.js') < dashboard.indexOf('index-admin.js'));
  });

  it('requires one organization and scopes farms through its canonical dashboard', () => {
    assert.match(context, /Organization \(required\)/);
    assert.match(context, /<option value="">Select an organization…<\/option>/);
    assert.match(context, /\/organizations\/\$\{encodeURIComponent\(state\.organizationId\)\}\/dashboard/);
    assert.match(context, /All farms in this organization/);
    assert.doesNotMatch(context, /All organizations/);
  });

  it('exposes canonical date semantics and reusable context changes', () => {
    for (const days of [30, 90, 365, 730]) assert.match(context, new RegExp(`value="${days}"`));
    for (const unit of ['day', 'week', 'month']) assert.match(context, new RegExp(`value="${unit}"`));
    assert.match(context, /to\.setUTCDate\(to\.getUTCDate\(\) \+ 1\)/);
    assert.match(context, /farmSense:admin-financial-context-change/);
    assert.match(context, /FarmSenseAdminFinancialContext/);
  });

  it('shows demo provenance and never substitutes mock financial data', () => {
    assert.match(context, /financial-dashboard-demo/);
    assert.match(context, /Demo fixture/);
    assert.match(context, /no placeholder financial values are displayed/);
    assert.match(context, /No cached or mock financial values were substituted/);
  });

  it('wires Batchwise Revenue to canonical aggregation and source ledgers', () => {
    assert.match(context, /\/financial\/batchwise-revenue\?/);
    assert.match(context, /\/farms\/\$\{encodeURIComponent\(idOf\(farm\)\)\}\/batch-sales\?/);
    assert.match(context, /Sale-event Ledger/);
    assert.match(context, /Batch Sale Reconciliation/);
    assert.match(context, /Quantity inconsistency/);
    assert.match(context, /Missing operational records/);
    assert.match(context, /Missing direct expenses/);
    assert.match(context, /Revenue by Buyer/);
    assert.match(context, /Revenue by Farm/);
    assert.match(context, /params\.set\('tab', 'sales'\)/);
  });

  it('wires Financial Overview to canonical totals, batches, and expense ledgers', () => {
    assert.match(context, /\/financial\/overview\?/);
    assert.match(context, /\/financial\/batches\?/);
    assert.match(context, /\/batch-expenses\?/);
    for (const label of ['Recorded Revenue', 'Recorded Expenses', 'Gross Profit', 'Operational Profit', 'Operational Margin', 'Cost / Bird Sold']) {
      assert.match(context, new RegExp(label.replace('/', '\\/')));
    }
    assert.match(context, /Direct versus Shared Costs/);
    assert.match(context, /Batch Reconciliation/);
    assert.match(context, /Bucket \/ Category Source Entries/);
    assert.match(context, /No allocation to batches is performed/);
  });

  it('keeps unsupported accounting claims explicitly outside the admin overview', () => {
    for (const term of ['current ratio', 'debt-to-equity', 'working capital', 'break-even point', 'opening\\/closing balances', 'savings opportunities', 'statutory net profit']) {
      assert.match(context, new RegExp(term, 'i'));
    }
    assert.doesNotMatch(context, /\/financial\/savings/);
  });

  it('wires Historical Reports to current and equal-prior completed cohorts', () => {
    assert.match(context, /\/financial\/historical-reports\?/);
    assert.match(context, /previousHistoryQuery/);
    assert.match(context, /actualHarvestAt/);
    for (const field of ['estimatedFcr', 'mortalityPercent', 'livabilityPercent', 'weightedAverageBodyWeightKg', 'totalFeedConsumedKg', 'completedBatchCount']) {
      assert.match(context, new RegExp(field));
    }
    assert.match(context, /Independent Financial Transaction Trend/);
    assert.match(context, /lifetime batch sales and direct expenses/i);
  });

  it('provides historical paging, a quality queue, and no fake exports', () => {
    for (const size of [10, 25, 50, 100]) assert.match(context, new RegExp(`\\[10, 25, 50, 100\\]|value="${size}"`));
    assert.match(context, /Data-Quality Work Queue/);
    assert.match(context, /missing_actual_harvest_at/);
    assert.match(context, /sale_quantity_inconsistency/);
    assert.match(context, /File exports are outside this pass/);
    assert.doesNotMatch(context, /fa-download|Download Center|\\.xlsx|\\.pdf/);
  });

  it('wires Profit Forecast Readiness to canonical gates and deterministic sensitivity', () => {
    assert.match(context, /\/financial\/forecast\?/);
    for (const code of ['INSUFFICIENT_HISTORY', 'BACKTEST_FAILED', 'NO_ELIGIBLE_ACTIVE_BATCHES']) {
      assert.match(context, new RegExp(code));
    }
    for (const field of ['eligibleBatchCount', 'minimumRequired', 'holdoutCount', 'revenueWapePercent', 'expenseWapePercent', 'profitMae', 'thresholdPercent']) {
      assert.match(context, new RegExp(field));
    }
    assert.match(context, /fixed input sensitivities, not probabilities/);
    assert.match(context, /Recency-weighted historical medians/);
    assert.match(context, /There is no manual enable or override/);
  });

  it('shows active-batch readiness and only computed factual comparisons', () => {
    for (const field of ['expectedHarvestAt', 'initialBirdCount', 'mortalityCount', 'cullCount', 'alreadySold', 'estimatedBirdsToSell', 'recordedRevenue', 'recordedExpenses', 'currentEstimatedFcr', 'historicalEstimatedFcr']) {
      assert.match(context, new RegExp(field));
    }
    assert.match(context, /factualComparisons/);
    assert.match(context, /Forecast Readiness Work Queue/);
    for (const unsupported of ['AI Profit Insights', 'Profit Goal', 'Best Case', 'Worst Case', 'administrator-authored']) {
      assert.doesNotMatch(context, new RegExp(unsupported, 'i'));
    }
  });
});
