const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../src/dashboard/src/views/HistoricalReports.js'), 'utf8');

describe('business historical reports wiring', () => {
  it('uses the canonical historical endpoint for current and equal previous periods', () => {
    assert.match(source, /\/api\/v2\/financial\/historical-reports/);
    assert.match(source, /hrRange\(days,true\)/);
    assert.match(source, /Equal previous period unavailable/);
  });
  it('renders operational cohort buckets and weighted comparisons', () => {
    for (const field of ['operationalTrend','estimatedFcr','mortalityPercent','livabilityPercent','weightedAverageBodyWeightKg','totalFeedConsumedKg','birdsPlaced']) assert.match(source,new RegExp(field));
    assert.match(source,/Mortality and livability are bird-weighted/);
  });
  it('renders transaction financials, cohort batches, paging, and completeness', () => {
    for (const field of ['financialTrend','directExpenses','directProfit','topBatchesByDirectProfit','completedBatchesMissingActualHarvestAt','cohortBatchesEligibleForEstimatedFcr']) assert.match(source,new RegExp(field));
    assert.match(source,/data-hr-page/);
  });
  it('keeps file exports explicitly deferred and has no download actions', () => {
    assert.match(source,/Excel and PDF exports are not included in this pass/);
    assert.doesNotMatch(source,/fa-download|hrDownloadRow|Download Center|\.xlsx|\.pdf/);
  });
  it('contains no former seeded historical values', () => {
    for(const mock of ['GVF-B104','1,02,45,600','Average FCR improved','Yearly Performance Comparison']) assert.doesNotMatch(source,new RegExp(mock));
  });
});
