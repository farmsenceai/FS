const BatchExpense = require('./batch-expenses.model');
const paginate = require('../../shared/db/pagination');

const PROTECTED = new Set(['_id', 'businessId', 'farmId', 'createdBy', 'schemaVersion', 'deletedAt', 'deletedBy']);
async function create(businessId, farmId, data) { return new BatchExpense({ ...data, businessId, farmId }).save(); }
async function findById(businessId, farmId, id) { return BatchExpense.findOne({ _id: id, businessId, farmId }).exec(); }
async function findByIdForBusinessRole(farmId, id) { return BatchExpense.findOne({ _id: id, farmId }).exec(); }
function filterFor(farmId, { batchId, shared, category, from, to } = {}) {
  const filter = { farmId };
  if (batchId) filter.batchId = batchId;
  if (shared === 'true' || shared === true) filter.batchId = null;
  if (category) filter.category = category;
  if (from || to) filter.expenseDate = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  return filter;
}
async function list(businessId, farmId, filters = {}) { return paginate(BatchExpense.find({ businessId, ...filterFor(farmId, filters) }).populate('createdBy', '_id name email').sort({ expenseDate: -1, createdAt: -1 }), filters); }
async function listForBusinessRole(farmId, filters = {}) { return paginate(BatchExpense.find(filterFor(farmId, filters)).populate('createdBy', '_id name email').sort({ expenseDate: -1, createdAt: -1 }), filters); }
async function updateById(businessId, farmId, id, updates) {
  const expense = await findById(businessId, farmId, id);
  if (!expense) return null;
  for (const [field, value] of Object.entries(updates)) if (!PROTECTED.has(field)) expense.set(field, value);
  return expense.save();
}
async function softDeleteById(businessId, farmId, id, actorUserId) {
  const expense = await findById(businessId, farmId, id);
  if (!expense) return null;
  expense.deletedAt = new Date(); expense.deletedBy = actorUserId;
  return expense.save();
}
module.exports = { create, findById, findByIdForBusinessRole, list, listForBusinessRole, updateById, softDeleteById };
