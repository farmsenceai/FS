const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const dashboardRoot = path.join(__dirname, '..', 'src', 'dashboard');
const indexHtml = fs.readFileSync(path.join(dashboardRoot, 'index.html'), 'utf8');
const indexJs = fs.readFileSync(path.join(dashboardRoot, 'index.js'), 'utf8');
const view = fs.readFileSync(path.join(dashboardRoot, 'src', 'views', 'FarmsFacilities.js'), 'utf8');

describe('business farms and facilities canonical page', () => {
  it('is registered in the business shell and sidebar', () => {
    assert.match(indexHtml, /data-page="FarmsFacilities"/);
    assert.match(indexHtml, /src\/views\/FarmsFacilities\.js/);
    assert.match(indexJs, /FarmsFacilities:\s*viewFarmsFacilities/);
  });

  it('uses the protected canonical v2 farm and facility endpoints', () => {
    assert.match(view, /const FF_API = '\/api\/v2'/);
    assert.match(view, /Authorization:\s*`Bearer \$\{localStorage\.getItem\('fs_token'\)\}`/);
    assert.match(view, /ffFetch\('\/farms\?limit=100'\)/);
    assert.match(view, /\/facilities\?limit=100/);
  });

  it('is read-only for the business role', () => {
    assert.doesNotMatch(view, /method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i);
    assert.doesNotMatch(view, /type=["']file["']/i);
    assert.doesNotMatch(view, /\b(?:Create|Edit|Delete|Close) (?:Farm|Facility)\b/);
  });
});
