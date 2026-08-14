const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'src', 'dashboard', 'src', 'views-admin', 'FarmOperations.js');
const source = fs.readFileSync(file, 'utf8');

test('admin Farm Operations can create canonical batches for a farm facility', () => {
  assert.match(source, /data-fo-tab="batches">Batches/);
  assert.match(source, /<h3>Create Batch<\/h3>/);
  assert.match(source, /name="facilityId"/);
  assert.match(source, /name="initialBirdCount"/);
  assert.match(source, /name="placedAt"/);
  assert.match(source, /foRequest\(`\/farms\/\$\{foState\.selectedFarmId\}\/batches`, \{ method: 'POST'/);
  assert.match(source, /Create a facility in Farm & Facilities before creating a batch/);
  assert.match(source, /Batch created successfully/);
  assert.match(source, /data-fo-complete-batch/);
  assert.match(source, /batches\/\$\{id\}\/harvest/);
  assert.match(source, /Batch marked completed/);
});

test('admin Farm Operations exposes canonical Sales and Expenses tabs', () => {
  assert.match(source, /data-fo-tab="sales">Sales/);
  assert.match(source, /data-fo-tab="expenses">Expenses/);
  assert.match(source, /\/batch-sales\?\$\{params\}/);
  assert.match(source, /\/batch-expenses\?\$\{params\}/);
});

test('sales UI supports partial events, calculated preview, edit, and delete', () => {
  assert.match(source, /quantitySold/);
  assert.match(source, /avgWeightKg/);
  assert.match(source, /pricePerKg/);
  assert.match(source, /Calculated revenue preview/);
  assert.match(source, /method: id \? 'PATCH' : 'POST'/);
  assert.match(source, /data-fo-delete-sale/);
  assert.match(source, /authoritative mortality, culls, and concurrent sales/);
});

test('expense UI requires an explicit batch or shared-farm choice and supports CRUD', () => {
  assert.match(source, /Shared farm expense \(no batch\)/);
  assert.match(source, /scope === '__shared__' \? null : scope/);
  assert.match(source, /data-fo-edit-expense/);
  assert.match(source, /data-fo-delete-expense/);
  assert.match(source, /not silently allocated to individual batch profitability/);
});

test('financial intelligence deep links preserve tenant context and highlight source records', () => {
  for (const parameter of ['tab', 'batchId', 'saleId', 'expenseId']) {
    assert.match(source, new RegExp(`get\\('${parameter}'\\)`));
  }
  assert.match(source, /fo-context-heading/);
  assert.match(source, /business\\?\\.displayName \\|\\| business\\?\\.legalName/);
  assert.match(source, /fo-source-highlight/);
  assert.match(source, /requested sale record was not found/);
  assert.match(source, /requested expense record was not found/);
  assert.match(source, /outside your authorized tenant scope/);
});

test('financial ledgers support pagination, filters, actor identity, and unsaved protection', () => {
  assert.match(source, /saleFilters: \{ page: 1, limit: 25/);
  assert.match(source, /expenseFilters: \{ page: 1, limit: 25/);
  assert.match(source, /data-fo-sale-page/);
  assert.match(source, /data-fo-expense-page/);
  assert.match(source, /fo-sale-filter-batch/);
  assert.match(source, /fo-expense-filter-scope/);
  assert.match(source, /fo-expense-filter-category/);
  assert.match(source, /function foActor/);
  assert.match(source, /Actor \/ Audit/);
  assert.match(source, /beforeunload/);
  assert.match(source, /Discard unsaved financial changes/);
});
