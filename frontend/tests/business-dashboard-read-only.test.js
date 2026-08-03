const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dashboardRoot = path.join(__dirname, '..', 'src', 'dashboard');
const read = (...parts) => fs.readFileSync(path.join(dashboardRoot, ...parts), 'utf8');

test('business dashboard does not register or load My Blogs', () => {
  const html = read('index.html');
  const router = read('index.js');

  assert.doesNotMatch(html, /data-page=["']MyBlogs["']/);
  assert.doesNotMatch(html, /src\/views\/MyBlogs\.js/);
  assert.doesNotMatch(router, /\bMyBlogs\s*:/);
});

test('farmer dashboard still registers and loads My Blogs', () => {
  const html = read('index-farmer.html');
  const router = read('index-farmer.js');

  assert.match(html, /data-page=["']MyBlogs["']/);
  assert.match(html, /src\/views\/MyBlogs\.js/);
  assert.match(router, /\bMyBlogs\s*:/);
});

test('business-routed view modules contain no mutation requests', () => {
  const router = read('index.js');
  const viewNames = [...router.matchAll(/:\s*(view[A-Za-z0-9_]+)/g)].map(match => match[1]);
  const viewsDirectory = path.join(dashboardRoot, 'src', 'views');
  const files = fs.readdirSync(viewsDirectory).filter(file => file.endsWith('.js'));
  const sourceByView = new Map();

  for (const file of files) {
    const source = fs.readFileSync(path.join(viewsDirectory, file), 'utf8');
    for (const match of source.matchAll(/function\s+(view[A-Za-z0-9_]+)\s*\(/g)) {
      sourceByView.set(match[1], { file, source });
    }
  }

  assert.ok(viewNames.length > 0, 'expected registered business views');
  for (const viewName of viewNames) {
    const module = sourceByView.get(viewName);
    assert.ok(module, `missing source for ${viewName}`);
    assert.doesNotMatch(
      module.source,
      /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i,
      `${module.file} contains a mutation request`
    );
  }
});

test('business notification UI is initialized in read-only mode', () => {
  const shell = read('shared', 'dashboard-shell.js');
  assert.match(shell, /initNotifications\(token,\s*\{\s*readOnly:\s*expectedRole\s*===\s*['"]business['"]\s*\}\)/);
  assert.match(shell, /if\s*\(!readOnly\)\s*\{[\s\S]*method:\s*['"]PUT['"]/);
});
