const mongoose = require('mongoose');
const CompensationClaim = require('./compensation-claims.model');
const paginate = require('../../shared/db/pagination');

function scope(businessId, farmId, batchId) {
  return { businessId, farmId, batchId, deletedAt: null };
}
function populate(query) {
  return query
    .populate('farmerId', 'name email')
    .populate('farmId', 'name code')
    .populate('batchId', 'code breed birdType status');
}
async function create(data) { return new CompensationClaim(data).save(); }
async function findScoped(businessId, farmId, batchId, id) {
  return populate(CompensationClaim.findOne({ _id: id, ...scope(businessId, farmId, batchId) })).exec();
}
async function listMine(farmerId, { status, page, limit } = {}) {
  const filter = { farmerId, deletedAt: null };
  if (status) filter.status = status;
  return paginate(populate(CompensationClaim.find(filter)), { page, limit });
}
async function listAll({ businessId, farmId, batchId, farmerId, status, page, limit } = {}) {
  const filter = { deletedAt: null };
  if (businessId) filter.businessId = businessId;
  if (farmId) filter.farmId = farmId;
  if (batchId) filter.batchId = batchId;
  if (farmerId) filter.farmerId = farmerId;
  if (status) filter.status = status;
  return paginate(populate(CompensationClaim.find(filter)), { page, limit });
}
async function findById(id) { return populate(CompensationClaim.findOne({ _id: id, deletedAt: null })).exec(); }
async function update(claim, values) {
  Object.entries(values).forEach(([key, value]) => claim.set(key, value));
  return claim.save();
}
async function remove(claim, actorId) {
  claim.deletedAt = new Date();
  claim.deletedBy = actorId;
  return claim.save();
}
async function summaryMine(farmerId) {
  const [row] = await CompensationClaim.aggregate([
    { $match: { farmerId: mongoose.Types.ObjectId.createFromHexString(String(farmerId)), deletedAt: null } },
    { $group: {
      _id: null,
      pendingAmount: { $sum: { $cond: [{ $in: ['$status', ['pending', 'approved']] }, '$amount', mongoose.Types.Decimal128.fromString('0.00')] } },
      paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', mongoose.Types.Decimal128.fromString('0.00')] } },
      count: { $sum: 1 }
    } }
  ]).exec();
  return row ? { pendingAmount: row.pendingAmount, paidAmount: row.paidAmount, count: row.count } :
    { pendingAmount: mongoose.Types.Decimal128.fromString('0.00'), paidAmount: mongoose.Types.Decimal128.fromString('0.00'), count: 0 };
}

module.exports = { create, findScoped, findById, listMine, listAll, update, remove, summaryMine };
