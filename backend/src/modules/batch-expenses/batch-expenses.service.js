const repository = require('./batch-expenses.repository');
const batchesRepository = require('../bird-batches/bird-batches.repository');
const policy = require('./batch-expenses.policy');
const validator = require('./batch-expenses.validator');
const { actorId, isBusiness } = require('../../shared/auth/roleAccess');

class BatchExpenseServiceError extends Error {
  constructor(message, code, status, details) { super(message); this.code = code; this.status = status; if (details) this.details = details; }
}
function allow(value) { if (!value) throw new BatchExpenseServiceError('You are not allowed to perform this action', 'POLICY_DENIED', 403); }
function found(value, label = 'Batch expense') { if (!value) throw new BatchExpenseServiceError(`${label} not found`, 'NOT_FOUND', 404); return value; }
async function verifyBatch(businessId, farmId, batchId) {
  if (batchId === null || batchId === undefined) return;
  const batch = await batchesRepository.findById(businessId, farmId, batchId);
  if (!batch) throw new BatchExpenseServiceError('Bird batch does not exist in this organization and farm', 'VALIDATION_ERROR', 400);
}
function audit(user, action, expense, metadata = {}) {
  console.log({ event: 'audit_event', occurredAt: new Date().toISOString(), actor: { type: 'user', id: actorId(user) }, action, entity: { type: 'batch_expense', id: expense._id }, outcome: 'success', metadata });
}
async function createExpense(user, businessId, farmId, payload) {
  allow(policy.canWriteBatchExpenses(user));
  const data = validator.validateCreate(payload);
  await verifyBatch(businessId, farmId, data.batchId);
  const expense = await repository.create(businessId, farmId, { ...data, batchId: data.batchId ?? null, createdBy: actorId(user) });
  audit(user, 'batch_expense.created', expense, { scope: expense.batchId ? 'batch' : 'farm_shared' });
  return expense;
}
async function getExpense(user, businessId, farmId, id) {
  allow(policy.canReadBatchExpenses(user));
  return found(isBusiness(user) ? await repository.findByIdForBusinessRole(farmId, id) : await repository.findById(businessId, farmId, id));
}
async function listExpenses(user, businessId, farmId, filters) {
  allow(policy.canReadBatchExpenses(user));
  return isBusiness(user) ? repository.listForBusinessRole(farmId, filters) : repository.list(businessId, farmId, filters);
}
async function updateExpense(user, businessId, farmId, id, payload) {
  allow(policy.canWriteBatchExpenses(user));
  const data = validator.validateUpdate(payload);
  found(await repository.findById(businessId, farmId, id));
  if (Object.hasOwn(data, 'batchId')) await verifyBatch(businessId, farmId, data.batchId);
  const expense = found(await repository.updateById(businessId, farmId, id, data));
  audit(user, 'batch_expense.updated', expense, { changedFields: Object.keys(data), scope: expense.batchId ? 'batch' : 'farm_shared' });
  return expense;
}
async function deleteExpense(user, businessId, farmId, id) {
  allow(policy.canWriteBatchExpenses(user));
  const expense = found(await repository.softDeleteById(businessId, farmId, id, actorId(user)));
  audit(user, 'batch_expense.deleted', expense);
  return expense;
}
module.exports = { BatchExpenseServiceError, createExpense, getExpense, listExpenses, updateExpense, deleteExpense };
