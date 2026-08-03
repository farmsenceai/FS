const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const dashboardRoot = path.join(__dirname, '..', 'src', 'dashboard');
const read = relativePath => fs.readFileSync(path.join(dashboardRoot, relativePath), 'utf8');

describe('dashboard shell role guard', () => {
  it('declares the expected role for every dashboard shell', () => {
    assert.match(read('index.js'), /expectedRole:\s*'business'/);
    assert.match(read('index-farmer.js'), /expectedRole:\s*'farmer'/);
    assert.match(read('index-admin.js'), /expectedRole:\s*'admin'/);
  });

  it('redirects mismatched users through the shared dashboard role router', () => {
    const shell = read(path.join('shared', 'dashboard-shell.js'));
    assert.match(shell, /actualRole\s*!==\s*requiredRole/);
    assert.match(shell, /getDashboardUrlForRole\(actualRole\)/);
    assert.match(shell, /window\.location\.replace\(correctUrl\)/);
  });

  it('loads dashboard-route.js in all three shells', () => {
    for (const file of ['index.html', 'index-farmer.html', 'index-admin.html']) {
      assert.match(read(file), /\/assets\/js\/dashboard-route\.js/);
    }
  });

  it('provides searchable navigation in every dashboard shell', () => {
    const sidebar = read(path.join('shared', 'sidebar.js'));
    assert.match(sidebar, /panel-search-input/);
    assert.match(sidebar, /db-sidebar-link:not\(\[hidden\]\)/);
    assert.match(sidebar, /event\.key === 'Escape'/);
    assert.match(sidebar, /event\.key !== 'Enter'/);
    for (const file of ['index.html', 'index-farmer.html', 'index-admin.html']) {
      assert.match(read(file), /aria-label="Search dashboard pages"/);
    }
  });

  it('loads the shared edit-profile page in every dashboard', () => {
    for (const file of ['index.html', 'index-farmer.html', 'index-admin.html']) {
      const html = read(file);
      assert.match(html, /id="edit-profile"/);
      assert.match(html, /shared\/edit-profile\.js/);
    }
    for (const file of ['index.js', 'index-farmer.js', 'index-admin.js']) {
      assert.match(read(file), /EditProfile:\s*viewEditProfile/);
    }
    const profile = read(path.join('shared', 'edit-profile.js'));
    assert.match(profile, /\/api\/auth\/me\/profile/);
    assert.match(profile, /\/api\/auth\/me\/avatar/);
  });

  it('supports bookmarkable dashboard pages and farmer CSV exports', () => {
    const shell = read(path.join('shared', 'dashboard-shell.js'));
    assert.match(shell, /window\.location\.hash/);
    assert.match(shell, /hashchange/);
    const farmer = read('index-farmer.html');
    assert.match(farmer, /id="export-current-view"/);
    assert.match(farmer, /shared\/dashboard-export\.js/);
  });
});
