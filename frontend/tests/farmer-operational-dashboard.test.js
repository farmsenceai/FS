const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const dashboardRoot = path.join(__dirname, '../src/dashboard');
const hub = fs.readFileSync(path.join(dashboardRoot, 'shared/farmer-record-hub.js'), 'utf8');
const entry = fs.readFileSync(path.join(dashboardRoot, 'src/views-farmer/DailyRecordEntry.js'), 'utf8');
const focusedPages = ['FeedAndWater.js', 'BirdsHealth.js', 'Environment.js'].map(name =>
  fs.readFileSync(path.join(dashboardRoot, 'src/views-farmer', name), 'utf8')
);

describe('farmer operational dashboard', () => {
  it('uses one persisted assigned-farm, active-batch, and date context', () => {
    assert.match(hub, /farmsense_farmer_operational_context/);
    assert.match(hub, /status=active/);
    assert.match(hub, /Operational date/);
    assert.match(entry, /contextControls/);
  });

  it('reads and writes only canonical daily flock record routes', () => {
    assert.match(hub, /\/api\/v2/);
    assert.match(hub, /\/records\?/);
    assert.match(entry, /\/records/);
    assert.match(entry, /\/correct/);
    for (const source of focusedPages) assert.match(source, /FarmerCanonicalRecordHub\.render/);
  });

  it('exposes completeness and honest empty, forbidden, and correction states', () => {
    assert.match(hub, /Daily completeness/);
    assert.match(hub, /Missing values are shown as unavailable, never as zero/);
    assert.match(hub, /Access denied/);
    assert.match(entry, /append-only correction/);
    assert.match(entry, /No active assigned batches/);
  });
});
