const BatchSale = require('./batch-sales.model');
const BirdBatch = require('../bird-batches/bird-batches.model');
const FlockRecord = require('../flock-records/flock-records.model');
const paginate = require('../../shared/db/pagination');

const PROTECTED = new Set(['_id', 'businessId', 'farmId', 'batchId', 'createdBy', 'schemaVersion', 'deletedAt', 'deletedBy']);

async function create(businessId, farmId, data, { session } = {}) {
  return new BatchSale({ ...data, businessId, farmId }).save({ session });
}
async function findById(businessId, farmId, id, { session } = {}) {
  const query = BatchSale.findOne({ _id: id, businessId, farmId });
  if (session) query.session(session);
  return query.exec();
}
async function findByIdForBusinessRole(farmId, id) {
  return BatchSale.findOne({ _id: id, farmId }).exec();
}
async function list(businessId, farmId, { batchId, from, to, page, limit } = {}) {
  const filter = { businessId, farmId };
  if (batchId) filter.batchId = batchId;
  if (from || to) filter.saleDate = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  return paginate(BatchSale.find(filter).populate('createdBy', '_id name email').sort({ saleDate: -1, createdAt: -1 }), { page, limit });
}
async function listForBusinessRole(farmId, filters = {}) {
  const { batchId, from, to, page, limit } = filters;
  const filter = { farmId };
  if (batchId) filter.batchId = batchId;
  if (from || to) filter.saleDate = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  return paginate(BatchSale.find(filter).populate('createdBy', '_id name email').sort({ saleDate: -1, createdAt: -1 }), { page, limit });
}
async function updateById(businessId, farmId, id, updates, actorUserId, { session } = {}) {
  const sale = await findById(businessId, farmId, id, { session });
  if (!sale) return null;
  for (const [field, value] of Object.entries(updates)) if (!PROTECTED.has(field)) sale.set(field, value);
  return sale.save({ session });
}
async function softDeleteById(businessId, farmId, id, actorUserId, { session } = {}) {
  const sale = await findById(businessId, farmId, id, { session });
  if (!sale) return null;
  sale.deletedAt = new Date();
  sale.deletedBy = actorUserId;
  return sale.save({ session });
}
async function lockBatch(businessId, farmId, batchId, session) {
  return BirdBatch.findOneAndUpdate(
    { _id: batchId, businessId, farmId, deletedAt: null },
    { $inc: { version: 1 } },
    { returnDocument: 'after', session }
  ).exec();
}
async function quantitySold(batchId, { excludeId, session } = {}) {
  const match = { batchId: BatchSale.db.base.Types.ObjectId.createFromHexString(String(batchId)), deletedAt: null };
  if (excludeId) match._id = { $ne: BatchSale.db.base.Types.ObjectId.createFromHexString(String(excludeId)) };
  const aggregate = BatchSale.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$quantitySold' } } }]);
  if (session) aggregate.session(session);
  const [row] = await aggregate.exec();
  return row?.total || 0;
}
async function flockLosses(batchId, { session } = {}) {
  const aggregate = FlockRecord.aggregate([
    { $match: { batchId: FlockRecord.db.base.Types.ObjectId.createFromHexString(String(batchId)), deletedAt: null } },
    { $group: { _id: null, mortality: { $sum: { $ifNull: ['$mortality.count', 0] } }, culls: { $sum: { $ifNull: ['$culls.count', 0] } } } }
  ]);
  if (session) aggregate.session(session);
  const [row] = await aggregate.exec();
  return (row?.mortality || 0) + (row?.culls || 0);
}

module.exports = { create, findById, findByIdForBusinessRole, list, listForBusinessRole, updateById, softDeleteById, lockBatch, quantitySold, flockLosses };
