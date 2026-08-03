const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../src/dashboard/src/views/ProfitForecast.js'), 'utf8');

describe('business profit forecast wiring', () => {
  it('uses only the canonical forecast endpoint', () => {
    assert.match(source, /\/api\/v2\/financial\/forecast/);
    assert.match(source, /horizonDays/);
  });
  it('renders unavailable without fallback estimates', () => {
    assert.match(source, /Forecast unavailable/);
    assert.match(source, /No estimate, sensitivity value, or factual comparison is displayed/);
    assert.match(source, /eligibleBatchCount/);
    assert.match(source, /minimumRequired/);
  });
  it('discloses held-out validation, method, and sensitivity assumptions', () => {
    for (const field of ['revenueWapePercent','expenseWapePercent','profitMae','thresholdPercent','historicalSample','factualComparisons']) assert.match(source,new RegExp(field));
    assert.match(source,/fixed input sensitivities, not probabilities/);
    assert.match(source,/Recency-weighted historical medians/);
  });
  it('renders active batch estimates and factual operational comparisons', () => {
    for (const field of ['estimatedBirdsToSell','expectedHarvestAt','recordedRevenue','recordedExpenses','currentMortalityPercent','historicalMortalityPercent','currentEstimatedFcr','historicalEstimatedFcr']) assert.match(source,new RegExp(field));
  });
  it('uses a cohesive responsive layout without leaking generic table styles', () => {
    for (const region of ['pf-hero','pf-primary-stats','pf-validation-strip','pf-scenarios','pf-table-wrap','pf-detail-grid']) {
      assert.match(source, new RegExp(region));
    }
    assert.match(source, /position:sticky/);
    assert.match(source, /@media\(max-width:760px\)/);
    assert.doesNotMatch(source, /(?:^|})table\{/);
    assert.doesNotMatch(source, /(?:^|})th,td\{/);
  });
  it('contains no AI, advice, goal, target, or former mock claims', () => {
    for (const unsupported of ['AI Profit Insights','AI-powered','Profit Goal','Target Margin','Positive Impact','continue feed management','maintain biosecurity','optimize formulation','Best Case','Worst Case','GVF-B104']) assert.doesNotMatch(source,new RegExp(unsupported,'i'));
  });
});
