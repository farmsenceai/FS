const mongoose = require('mongoose');
const repository = require('./batch-sales.repository');
const batchesRepository = require('../bird-batches/bird-batches.repository');
const policy = require('./batch-sales.policy');
const validator = require('./batch-sales.validator');
const { actorId, isBusiness } = require('../../shared/auth/roleAccess');

class BatchSaleServiceError extends Error {
  constructor(message, code, status, details) { super(message); this.code = code; this.status = status; if (details) this.details = details; }
}
function allow(value) { if (!value) throw new BatchSaleServiceError('You are not allowed to perform this action', 'POLICY_DENIED', 403); }
function found(value, label = 'Batch sale') { if (!value) throw new BatchSaleServiceError(`${label} not found`, 'NOT_FOUND', 404); return value; }
function audit(user, action, sale, metadata = {}) {
  console.log({ event: 'audit_event', occurredAt: new Date().toISOString(), actor: { type: 'user', id: actorId(user) }, action, entity: { type: 'batch_sale', id: sale._id }, outcome: 'success', metadata });
}
async function assertCapacity(batch, quantity, excludeId, session) {
  const [sold, losses] = await Promise.all([
    repository.quantitySold(batch._id, { excludeId, session }),
    repository.flockLosses(batch._id, { session })
  ]);
  const sellable = Math.max(0, batch.initialBirdCount - losses);
  if (sold + quantity > sellable) {
    throw new BatchSaleServiceError(`Sale quantity exceeds the remaining sellable birds (${Math.max(0, sellable - sold)} available)`, 'CONFLICT', 409);
  }
}
async function transaction(work) {
  const session = await mongoose.startSession();
  try { let result; await session.withTransaction(async () => { result = await work(session); }); return result; }
  finally { await session.endSession(); }
}
async function createSale(user, businessId, farmId, payload) {
  allow(policy.canWriteBatchSales(user));
  const data = validator.validateCreate(payload);
  const sale = await transaction(async session => {
    const batch = await repository.lockBatch(businessId, farmId, data.batchId, session);
    found(batch, 'Bird batch');
    await assertCapacity(batch, data.quantitySold, null, session);
    return repository.create(businessId, farmId, { ...data, createdBy: actorId(user) }, { session });
  });
  audit(user, 'batch_sale.created', sale);
  return sale;
}
async function getSale(user, businessId, farmId, id) {
  allow(policy.canReadBatchSales(user));
  return found(isBusiness(user) ? await repository.findByIdForBusinessRole(farmId, id) : await repository.findById(businessId, farmId, id));
}
async function listSales(user, businessId, farmId, filters) {
  allow(policy.canReadBatchSales(user));
  return isBusiness(user) ? repository.listForBusinessRole(farmId, filters) : repository.list(businessId, farmId, filters);
}
async function updateSale(user, businessId, farmId, id, payload) {
  allow(policy.canWriteBatchSales(user));
  const updates = validator.validateUpdate(payload);
  const sale = await transaction(async session => {
    const existing = found(await repository.findById(businessId, farmId, id, { session }));
    if (updates.batchId && String(updates.batchId) !== String(existing.batchId)) {
      throw new BatchSaleServiceError('batchId cannot be changed after creation', 'VALIDATION_ERROR', 400);
    }
    const batch = await repository.lockBatch(businessId, farmId, existing.batchId, session);
    found(batch, 'Bird batch');
    const merged = { quantitySold: updates.quantitySold ?? existing.quantitySold, avgWeightKg: updates.avgWeightKg ?? existing.avgWeightKg.toString(), pricePerKg: updates.pricePerKg ?? existing.pricePerKg.toString() };
    await assertCapacity(batch, merged.quantitySold, existing._id, session);
    return repository.updateById(businessId, farmId, id, validator.withRevenue({ ...updates, ...merged }), actorId(user), { session });
  });
  audit(user, 'batch_sale.updated', sale, { changedFields: Object.keys(updates) });
  return sale;
}
async function deleteSale(user, businessId, farmId, id) {
  allow(policy.canWriteBatchSales(user));
  const sale = await transaction(async session => {
    const existing = found(await repository.findById(businessId, farmId, id, { session }));
    found(await repository.lockBatch(businessId, farmId, existing.batchId, session), 'Bird batch');
    return repository.softDeleteById(businessId, farmId, id, actorId(user), { session });
  });
  audit(user, 'batch_sale.deleted', sale);
  return sale;
}

module.exports = { BatchSaleServiceError, createSale, getSale, listSales, updateSale, deleteSale };
