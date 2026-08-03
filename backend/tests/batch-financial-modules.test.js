const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { afterEach, describe, it } = require('node:test');
const mongoose = require('mongoose');

const salesValidator = require('../src/modules/batch-sales/batch-sales.validator');
const expensesValidator = require('../src/modules/batch-expenses/batch-expenses.validator');
const salesPolicy = require('../src/modules/batch-sales/batch-sales.policy');
const expensesPolicy = require('../src/modules/batch-expenses/batch-expenses.policy');
const salesRepository = require('../src/modules/batch-sales/batch-sales.repository');
const expensesRepository = require('../src/modules/batch-expenses/batch-expenses.repository');
const salesRepositorySource = fs.readFileSync(path.join(__dirname, '../src/modules/batch-sales/batch-sales.repository.js'), 'utf8');
const expensesRepositorySource = fs.readFileSync(path.join(__dirname, '../src/modules/batch-expenses/batch-expenses.repository.js'), 'utf8');
const batchesRepository = require('../src/modules/bird-batches/bird-batches.repository');
const salesService = require('../src/modules/batch-sales/batch-sales.service');
const expensesService = require('../src/modules/batch-expenses/batch-expenses.service');

const ids = {
  business: '507f1f77bcf86cd799439010',
  farm: '507f1f77bcf86cd799439011',
  batch: '507f1f77bcf86cd799439012',
  sale: '507f1f77bcf86cd799439013',
  expense: '507f1f77bcf86cd799439014',
  admin: '507f1f77bcf86cd799439015'
};
const original = {
  startSession: mongoose.startSession,
  lockBatch: salesRepository.lockBatch,
  quantitySold: salesRepository.quantitySold,
  flockLosses: salesRepository.flockLosses,
  createSale: salesRepository.create,
  findBatch: batchesRepository.findById,
  createExpense: expensesRepository.create,
  log: console.log
};

afterEach(() => {
  mongoose.startSession = original.startSession;
  salesRepository.lockBatch = original.lockBatch;
  salesRepository.quantitySold = original.quantitySold;
  salesRepository.flockLosses = original.flockLosses;
  salesRepository.create = original.createSale;
  batchesRepository.findById = original.findBatch;
  expensesRepository.create = original.createExpense;
  console.log = original.log;
});

it('populates authorized creator identity in financial ledger reads', () => {
  assert.match(salesRepositorySource, /\.populate\('createdBy', '_id name email'\)/);
  assert.match(expensesRepositorySource, /\.populate\('createdBy', '_id name email'\)/);
});

function fakeTransactions() {
  mongoose.startSession = async () => ({
    withTransaction: async work => work(),
    endSession: async () => {}
  });
}

describe('batch financial validation and decimal policy', () => {
  it('derives revenue using half-up paise rounding and rejects client revenue', () => {
    const sale = salesValidator.validateCreate({
      batchId: ids.batch,
      saleDate: '2026-07-22',
      quantitySold: 3,
      avgWeightKg: '1.005',
      pricePerKg: '100.00'
    });
    assert.equal(sale.revenue, '301.50');
    assert.throws(() => salesValidator.validateCreate({ ...sale, revenue: '1.00' }), error => error.code === 'VALIDATION_ERROR');
    assert.throws(() => salesValidator.validateCreate({ ...sale, avgWeightKg: '1.0009' }), error => error.details.some(item => item.includes('at most 3')));
  });

  it('allows explicit null batchId for shared expenses and rejects invalid money/categories', () => {
    const expense = expensesValidator.validateCreate({ batchId: null, category: 'utilities', amount: '1250.50', expenseDate: '2026-07-22', description: ' Shared meter ' });
    assert.equal(expense.batchId, null);
    assert.equal(expense.amount, '1250.50');
    assert.equal(expense.description, 'Shared meter');
    assert.throws(() => expensesValidator.validateCreate({ category: 'utilities', amount: '1.00', expenseDate: '2026-07-22', description: 'Missing scope' }), error => error.details.some(item => item.includes('use null explicitly')));
    assert.throws(() => expensesValidator.validateCreate({ ...expense, amount: '1.001' }), error => error.code === 'VALIDATION_ERROR');
    assert.throws(() => expensesValidator.validateCreate({ ...expense, category: 'rent' }), error => error.code === 'VALIDATION_ERROR');
  });
});

describe('batch financial authorization', () => {
  const admin = { role: 'admin' };
  const business = { role: 'business' };
  const farmer = { role: 'farmer' };

  it('gives admins CRUD, businesses read-only access, and farmers no access', () => {
    assert.equal(salesPolicy.canWriteBatchSales(admin), true);
    assert.equal(salesPolicy.canWriteBatchSales(business), false);
    assert.equal(salesPolicy.canReadBatchSales(business), true);
    assert.equal(salesPolicy.canReadBatchSales(farmer), false);
    assert.equal(expensesPolicy.canWriteBatchExpenses(admin), true);
    assert.equal(expensesPolicy.canWriteBatchExpenses(business), false);
    assert.equal(expensesPolicy.canReadBatchExpenses(business), true);
    assert.equal(expensesPolicy.canReadBatchExpenses(farmer), false);
  });

  it('denies farmer and business writes before repository access', async () => {
    const payload = { batchId: ids.batch, saleDate: '2026-07-22', quantitySold: 1, avgWeightKg: '2.000', pricePerKg: '100.00' };
    await assert.rejects(salesService.createSale({ role: 'farmer' }, ids.business, ids.farm, payload), error => error.status === 403);
    await assert.rejects(salesService.createSale({ role: 'business' }, ids.business, ids.farm, payload), error => error.status === 403);
    await assert.rejects(expensesService.createExpense({ role: 'farmer' }, ids.business, ids.farm, { batchId: null, category: 'utilities', amount: '1.00', expenseDate: '2026-07-22', description: 'Denied' }), error => error.status === 403);
  });
});

describe('partial sale and tenant invariants', () => {
  const admin = { _id: ids.admin, role: 'admin' };
  const payload = { batchId: ids.batch, saleDate: '2026-07-22', quantitySold: 15, avgWeightKg: '2.000', pricePerKg: '100.00' };

  it('accepts a partial sale within losses-adjusted capacity', async () => {
    fakeTransactions(); console.log = () => {};
    salesRepository.lockBatch = async () => ({ _id: ids.batch, initialBirdCount: 100 });
    salesRepository.quantitySold = async () => 80;
    salesRepository.flockLosses = async () => 5;
    salesRepository.create = async (businessId, farmId, data) => ({ _id: ids.sale, businessId, farmId, ...data });
    const sale = await salesService.createSale(admin, ids.business, ids.farm, payload);
    assert.equal(sale.quantitySold, 15);
    assert.equal(sale.revenue, '3000.00');
    assert.equal(sale.createdBy, ids.admin);
  });

  it('rejects an oversale and a batch outside the requested tenant', async () => {
    fakeTransactions();
    salesRepository.lockBatch = async () => ({ _id: ids.batch, initialBirdCount: 100 });
    salesRepository.quantitySold = async () => 80;
    salesRepository.flockLosses = async () => 5;
    await assert.rejects(salesService.createSale(admin, ids.business, ids.farm, { ...payload, quantitySold: 16 }), error => error.status === 409 && error.message.includes('15 available'));
    salesRepository.lockBatch = async () => null;
    await assert.rejects(salesService.createSale(admin, ids.business, ids.farm, payload), error => error.status === 404);
  });

  it('rejects a cross-tenant batch expense but accepts a shared farm expense', async () => {
    console.log = () => {};
    batchesRepository.findById = async () => null;
    await assert.rejects(expensesService.createExpense(admin, ids.business, ids.farm, { batchId: ids.batch, category: 'feed', amount: '100.00', expenseDate: '2026-07-22', description: 'Wrong tenant' }), error => error.status === 400);
    expensesRepository.create = async (businessId, farmId, data) => ({ _id: ids.expense, businessId, farmId, ...data });
    const shared = await expensesService.createExpense(admin, ids.business, ids.farm, { batchId: null, category: 'utilities', amount: '100.00', expenseDate: '2026-07-22', description: 'Shared' });
    assert.equal(shared.batchId, null);
    assert.equal(shared.createdBy, ids.admin);
  });
});
