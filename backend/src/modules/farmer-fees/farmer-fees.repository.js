const FarmerFee = require('./farmer-fees.model');
const paginate = require('../../shared/db/pagination');

async function create(data, { session } = {}) {
  return new FarmerFee(data).save({ session });
}
async function findById(feeId) { return FarmerFee.findById(feeId).exec(); }
async function listForFarmer(farmerId, { status, page, limit } = {}) {
  const filter = { farmerId };
  if (status) filter.status = status;
  return paginate(
    FarmerFee.find(filter)
      .populate('farmerId', 'name email')
      .populate('farmId', 'name'),
    { page, limit }
  );
}
async function listAll({ farmerId, farmId, status, page, limit } = {}) {
  const filter = {};
  if (farmerId) filter.farmerId = farmerId;
  if (farmId) filter.farmId = farmId;
  if (status) filter.status = status;
  return paginate(
    FarmerFee.find(filter)
      .populate('farmerId', 'name email')
      .populate('farmId', 'name'),
    { page, limit }
  );
}
async function markPaid(feeId, { paidBy, paidAt, paymentReference }) {
  const fee = await findById(feeId);
  if (!fee) return null;
  fee.status = 'paid';
  fee.paidBy = paidBy;
  fee.paidAt = paidAt;
  if (paymentReference !== undefined) fee.paymentReference = paymentReference;
  return fee.save();
}
async function updateById(feeId, updates) {
  const fee = await findById(feeId);
  if (!fee) return null;
  Object.entries(updates).forEach(([field, value]) => fee.set(field, value));
  return fee.save();
}
async function softDeleteById(feeId, actorUserId) {
  const fee = await findById(feeId);
  if (!fee) return null;
  fee.status = 'cancelled';
  fee.deletedAt = new Date();
  fee.deletedBy = actorUserId;
  return fee.save();
}
async function summaryForFarmer(farmerId) {
  const [summary] = await FarmerFee.aggregate([
    { $match: { farmerId: FarmerFee.db.base.Types.ObjectId.createFromHexString(String(farmerId)), deletedAt: null } },
    { $group: {
      _id: null,
      totalPending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
      totalPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
      count: { $sum: { $cond: [{ $in: ['$status', ['pending', 'paid']] }, 1, 0] } }
    } }
  ]).exec();
  return summary ? { totalPending: summary.totalPending, totalPaid: summary.totalPaid, count: summary.count } :
    { totalPending: 0, totalPaid: 0, count: 0 };
}

async function getSummaryForFarm(farmId) {
  const rows = await FarmerFee.aggregate([
    { $match: {
      farmId: FarmerFee.db.base.Types.ObjectId.createFromHexString(String(farmId)),
      deletedAt: null
    } },
    { $group: {
      _id: '$farmerId',
      pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
      paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
      pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } }
    } },
    { $lookup: {
      from: 'users',
      let: { farmerId: '$_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$farmerId'] } } },
        { $project: { _id: 0, name: 1 } }
      ],
      as: 'farmer'
    } },
    { $project: {
      _id: 0,
      farmerId: '$_id',
      name: { $ifNull: [{ $first: '$farmer.name' }, 'Unknown farmer'] },
      pending: 1,
      paid: 1,
      pendingCount: 1,
      paidCount: 1
    } },
    { $sort: { name: 1, farmerId: 1 } }
  ]).exec();

  return rows.reduce((summary, row) => {
    summary.totalPending += row.pending;
    summary.totalPaid += row.paid;
    summary.pendingCount += row.pendingCount;
    summary.paidCount += row.paidCount;
    summary.farmers.push({ farmerId: row.farmerId, name: row.name, pending: row.pending, paid: row.paid });
    return summary;
  }, { totalPending: 0, totalPaid: 0, pendingCount: 0, paidCount: 0, farmers: [] });
}

module.exports = { create, findById, listForFarmer, listAll, markPaid, updateById,
  softDeleteById, summaryForFarmer, getSummaryForFarm };
