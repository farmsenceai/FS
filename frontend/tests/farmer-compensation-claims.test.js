const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const earnings = fs.readFileSync(path.join(__dirname, '../src/dashboard/src/views-farmer/MyEarnings.js'), 'utf8');
const payments = fs.readFileSync(path.join(__dirname, '../src/dashboard/src/views/Payments.js'), 'utf8');
const adminOperations = fs.readFileSync(path.join(__dirname, '../src/dashboard/src/views-admin/FarmOperations.js'), 'utf8');
const farmerIndex = fs.readFileSync(path.join(__dirname, '../src/dashboard/index-farmer.js'), 'utf8');
const farmerDashboard = fs.readFileSync(path.join(__dirname, '../src/dashboard/src/views-farmer/Dashboard.js'), 'utf8');

describe('canonical farmer compensation UI', () => {
  it('uses canonical APIs and no legacy unscoped earnings endpoint', () => {
    assert.match(earnings, /\/api\/v2/);
    assert.match(earnings, /compensation-claims/);
    assert.doesNotMatch(earnings, /\/api\/financial\/farmer/);
    assert.match(farmerDashboard, /\/api\/v2\/compensation-claims\/mine\/summary/);
    assert.doesNotMatch(farmerDashboard, /\/api\/financial\/farmer/);
  });
  it('builds farm and batch selectors only from authenticated assignments', () => {
    assert.match(earnings, /\/users\/\$\{encodeURIComponent\(userId\)\}\/assignments/);
    assert.match(earnings, /\/farms\/\$\{farmId\}\/batches/);
    assert.match(earnings, /<select id="fme-farm"/);
    assert.match(earnings, /<select id="fme-batch"/);
    assert.doesNotMatch(earnings, /id="fme-farm" type="text"/);
  });
  it('allows pending farmer edits and gives business a canonical review queue', () => {
    assert.match(earnings, /claim\.status === 'pending'/);
    assert.match(earnings, /method: claim \? 'PATCH' : 'POST'/);
    assert.match(payments, /\/api\/v2\/compensation-claims/);
    assert.match(payments, /data-pay-review/);
    assert.match(adminOperations, /data-fo-tab="claims"/);
    assert.match(adminOperations, /\/compensation-claims\/\$\{id\}\/review/);
  });
  it('does not expose business Financial Intelligence panels in the farmer shell', () => {
    for (const page of ['FinancialOverview', 'ProfitForecast', 'BatchwiseRevenue', 'HistoricalReports']) {
      assert.doesNotMatch(farmerIndex, new RegExp(`${page}:`));
    }
  });
});
