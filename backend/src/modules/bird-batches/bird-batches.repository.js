const BirdBatch = require('./bird-batches.model');
const paginate = require('../../shared/db/pagination');

const PROTECTED_UPDATE_FIELDS = new Set([
  '_id',
  'businessId',
  'farmId',
  'batchId',
  'code',
  'legacySourceId',
  'createdBy',
  'currentBirdCountCached',
  'version',
  'deletedAt',
  'deletedBy'
]);

function requireBusinessAndFarm(businessId, farmId) {
  if (businessId === undefined || businessId === null) {
    throw new TypeError('businessId is required for bird batch repository operations');
  }
  if (farmId === undefined || farmId === null) {
    throw new TypeError('farmId is required for bird batch repository operations');
  }
}

function requireActor(actorUserId) {
  if (!actorUserId) throw new TypeError('actorUserId is required for bird batch writes');
}

async function create(businessId, farmId, data, { session } = {}) {
  requireBusinessAndFarm(businessId, farmId);
  const batch = new BirdBatch({ ...data, businessId, farmId, batchId: undefined });
  return batch.save({ session });
}

async function findById(businessId, farmId, batchId, { session } = {}) {
  requireBusinessAndFarm(businessId, farmId);
  const query = BirdBatch.findOne({ _id: batchId, businessId, farmId });
  if (session) query.session(session);
  return query.exec();
}

async function findByIdForBusinessRole(farmId, batchId) {
  if (!farmId) throw new TypeError('farmId is required');
  return BirdBatch.findOne({ _id: batchId, farmId }).exec();
}

async function findByCode(businessId, farmId, code) {
  requireBusinessAndFarm(businessId, farmId);
  return BirdBatch.findOne({ businessId, farmId, code: String(code).toUpperCase() }).exec();
}

async function listForFarm(businessId, farmId, { status, page, limit } = {}) {
  requireBusinessAndFarm(businessId, farmId);
  const filter = { businessId, farmId };
  if (status) filter.status = status;
  return paginate(BirdBatch.find(filter), { page, limit });
}

async function listForBusinessRole(farmId, { status, page, limit } = {}) {
  if (!farmId) throw new TypeError('farmId is required');
  const filter = { farmId };
  if (status) filter.status = status;
  return paginate(BirdBatch.find(filter), { page, limit });
}

async function updateById(
  businessId,
  farmId,
  batchId,
  updates,
  actorUserId,
  { session } = {}
) {
  requireBusinessAndFarm(businessId, farmId);
  requireActor(actorUserId);
  const batch = await findById(businessId, farmId, batchId, { session });
  if (!batch) return null;

  for (const [field, value] of Object.entries(updates || {})) {
    if (!PROTECTED_UPDATE_FIELDS.has(field)) batch.set(field, value);
  }
  return batch.save({ session });
}

async function recalculateCurrentBirdCount(
  businessId,
  farmId,
  batchId,
  { session } = {}
) {
  requireBusinessAndFarm(businessId, farmId);
  const batch = await findById(businessId, farmId, batchId, { session });
  if (!batch) return null;

  // Lazy import keeps the model dependency one-way while this repository is
  // also consumed by the transactional flock-records service.
  const FlockRecord = require('../flock-records/flock-records.model');
  const aggregate = FlockRecord.aggregate([
    {
      $match: {
        businessId: batch.businessId,
        farmId: batch.farmId,
        batchId: batch._id,
        deletedAt: null
      }
    },
    {
      $group: {
        _id: null,
        mortalityCount: { $sum: { $ifNull: ['$mortality.count', 0] } },
        cullCount: { $sum: { $ifNull: ['$culls.count', 0] } }
      }
    }
  ]);
  if (session) aggregate.session(session);
  const [totals] = await aggregate.exec();
  const losses = (totals?.mortalityCount || 0) + (totals?.cullCount || 0);

  batch.currentBirdCountCached = Math.max(0, batch.initialBirdCount - losses);
  return batch.save({ session });
}

async function softDeleteById(businessId, farmId, batchId, actorUserId) {
  requireBusinessAndFarm(businessId, farmId);
  requireActor(actorUserId);
  const batch = await findById(businessId, farmId, batchId);
  if (!batch) return null;
  return batch.softDelete(actorUserId);
}

async function terminate(businessId, farmId, batchId, actorUserId, { session } = {}) {
  return updateById(
    businessId,
    farmId,
    batchId,
    { status: 'terminated' },
    actorUserId,
    { session }
  );
}

module.exports = {
  create,
  findById,
  findByIdForBusinessRole,
  findByCode,
  listForFarm,
  listForBusinessRole,
  updateById,
  recalculateCurrentBirdCount,
  softDeleteById,
  terminate
};
