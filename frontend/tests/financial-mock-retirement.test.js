const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const names = ['FinancialOverview.js', 'BatchwiseRevenue.js', 'HistoricalReports.js', 'ProfitForecast.js'];
const sources = names.map(name => ({ name, source: fs.readFileSync(path.join(__dirname, '../src/dashboard/src/views', name), 'utf8') }));

describe('financial dashboard mock retirement', () => {
  it('moves every affected page to canonical v2 reads', () => {
    for (const { name, source } of sources) {
      assert.match(source, /\/api\/v2\/financial\//, name);
      assert.doesNotMatch(source, /['"`]\/api\/financial\//, name);
    }
  });

  it('provides explicit forbidden and non-numeric missing-data states', () => {
    for (const { name, source } of sources) {
      assert.match(source, /status\s*===?\s*403/, name);
      assert.match(source, /Financial data access is forbidden for this account/, name);
      assert.match(source, /Not available|Forecast unavailable/, name);
      assert.match(source, /loading/i, name);
      assert.match(source, /error|Could not/i, name);
    }
  });

  it('contains none of the retired seeded dashboard signatures', () => {
    const retired = [/GVF-B104/, /SRF-B102/, /24,85,600/, /1,02,45,600/, /Current Ratio/, /Opening Balance/, /AI Profit Insights/, /Potential Saving/];
    for (const { name, source } of sources) for (const pattern of retired) assert.doesNotMatch(source, pattern, name);
  });
});
