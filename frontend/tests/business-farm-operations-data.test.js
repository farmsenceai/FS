const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'src', 'dashboard');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pages = ['FarmsFacilities.js', 'BatchManagement.js', 'BirdsHealth.js', 'FeedAndWater.js', 'Environment.js'];

test('business shell loads the shared canonical farm-operations reader', () => {
  assert.match(read('index.html'), /shared\/canonical-farm-operations\.js/);
});

test('canonical reader uses only the documented v2 read endpoints', () => {
  const source = read('shared/canonical-farm-operations.js');
  assert.match(source, /request\('\/farms\?limit=1000'\)/);
  assert.match(source, /\/farms\/\$\{farmId\}\/facilities\?limit=1000/);
  assert.match(source, /\/farms\/\$\{farmId\}\/batches\?limit=1000/);
  assert.match(source, /\/farms\/\$\{farmId\}\/batches\/\$\{id\(batch\)\}\/records\?limit=1000/);
  assert.doesNotMatch(source, /method\s*:/);
});

test('all five business Farm Operations pages remain mutation-free', () => {
  for (const file of pages) {
    const source = read(`src/views/${file}`);
    assert.doesNotMatch(source, /method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i, file);
    assert.doesNotMatch(source, /type\s*=\s*['"]file['"]/i, file);
  }
});

test('canonical flock values feed the health, feed-water, and environment views', () => {
  assert.match(read('src/views/BirdsHealth.js'), /record\.mortality\?\.count/);
  assert.match(read('src/views/BirdsHealth.js'), /record\.culls\?\.count/);
  assert.match(read('src/views/FeedAndWater.js'), /record\.feed\?\.consumedKg/);
  assert.match(read('src/views/FeedAndWater.js'), /record\.water\?\.consumedLiters/);
  assert.match(read('src/views/Environment.js'), /record\.sensorReadings/);
  assert.match(read('src/views/Environment.js'), /'Not reported'/);
});
