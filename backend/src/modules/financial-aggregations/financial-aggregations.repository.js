const BatchSale = require('../batch-sales/batch-sales.model');
const BatchExpense = require('../batch-expenses/batch-expenses.model');
const BirdBatch = require('../bird-batches/bird-batches.model');
const FlockRecord = require('../flock-records/flock-records.model');
const Farm = require('../farms/farms.model');

function scoped(filter, scope) {
  const value = { ...filter };
  if (scope.businessId) value.businessId = scope.businessId;
  if (scope.farmId) value.farmId = scope.farmId;
  if (scope.batchId) value.batchId = scope.batchId;
  return value;
}
async function sales(scope, from, toExclusive) {
  return BatchSale.find(scoped({ saleDate: { $gte: from, $lt: toExclusive } }, scope)).lean();
}
async function expenses(scope, from, toExclusive) {
  return BatchExpense.find(scoped({ expenseDate: { $gte: from, $lt: toExclusive } }, scope)).lean();
}
async function salesForBatches(scope, batchIds) {
  if (!batchIds.length) return [];
  return BatchSale.find(scoped({ batchId: { $in: batchIds } }, { businessId: scope.businessId, farmId: scope.farmId })).lean();
}
async function expensesForBatches(scope, batchIds) {
  if (!batchIds.length) return [];
  return BatchExpense.find(scoped({ batchId: { $in: batchIds } }, { businessId: scope.businessId, farmId: scope.farmId })).lean();
}
async function batches(scope, { completedFrom, completedToExclusive } = {}) {
  const filter = scoped({}, scope);
  delete filter.batchId;
  if (scope.batchId) filter._id = scope.batchId;
  if (completedFrom || completedToExclusive) {
    filter.status = 'completed';
    filter.actualHarvestAt = { ...(completedFrom ? { $gte: completedFrom } : {}), ...(completedToExclusive ? { $lt: completedToExclusive } : {}) };
  }
  return BirdBatch.find(filter).lean();
}
async function flockRecords(scope, batchIds) {
  if (!batchIds.length) return [];
  return FlockRecord.find(scoped({ batchId: { $in: batchIds } }, { businessId: scope.businessId, farmId: scope.farmId })).sort({ recordDate: 1 }).lean();
}
async function farms(farmIds) {
  if (!farmIds.length) return [];
  return Farm.find({ _id: { $in: farmIds } }).select('_id code name businessId').lean();
}

module.exports = { sales, expenses, salesForBatches, expensesForBatches, batches, flockRecords, farms };
