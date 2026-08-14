const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'dashboard', 'src', 'views', 'DownloadReports.js'), 'utf8');

test('Download Reports uses canonical dashboard and historical report data', () => {
  assert.match(source, /drFetch\('\/api\/v2\/business-dashboard'\)/);
  assert.match(source, /drFetch\(`\/api\/v2\/financial\/historical-reports\?\$\{drRange\(\)\}`\)/);
  assert.doesNotMatch(source, /Total Documents', '128'/);
  assert.doesNotMatch(source, /Green Valley Farm - DPR\.pdf/);
});

test('Download Reports supports filters, pagination, spreadsheet downloads, and printable reports', () => {
  assert.match(source, /function drApplyFilters/);
  assert.match(source, /data-dr-page/);
  assert.match(source, /application\/vnd\.ms-excel/);
  assert.match(source, /Print \/ Save as PDF/);
  assert.match(source, /data-dr-download/);
});

test('Download Reports derives checklist and activity from canonical records', () => {
  assert.match(source, /qualityWorkQueue/);
  assert.match(source, /Latest operational record received/);
  assert.match(source, /Completed batch reports/);
});
