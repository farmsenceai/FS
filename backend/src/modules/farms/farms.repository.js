const Farm = require('./farms.model');
const paginate = require('../../shared/db/pagination');
const FarmAssignment = require('../farm-assignments/farm-assignments.model');

const MERGED_OBJECT_FIELDS = new Set(['location', 'capacity']);
const PROTECTED_UPDATE_FIELDS = new Set([
  '_id',
  'businessId',
  'farmId',
  'batchId',
  'createdBy',
  'version',
  'deletedAt',
  'deletedBy'
]);

function requireBusinessId(businessId) {
  if (businessId === undefined || businessId === null) {
    throw new TypeError('businessId is required for every farm repository operation');
  }
}

function requireActor(actorUserId) {
  if (!actorUserId) throw new TypeError('actorUserId is required for farm writes');
}

function asPlainObject(value) {
  if (!value) return {};
  return typeof value.toObject === 'function' ? value.toObject() : { ...value };
}

async function create(businessId, data, { session } = {}) {
  requireBusinessId(businessId);
  const farm = new Farm({ ...data, businessId, farmId: undefined });
  return farm.save({ session });
}

async function findById(businessId, farmId) {
  requireBusinessId(businessId);
  return Farm.findOne({ _id: farmId, businessId }).exec();
}

async function findByIdForBusinessRole(farmId) {
  return Farm.findById(farmId).exec();
}

async function findByCode(businessId, code) {
  requireBusinessId(businessId);
  return Farm.findOne({ businessId, code: String(code).toUpperCase() }).exec();
}

async function list(businessId, { status, farmType, page, limit } = {}) {
  requireBusinessId(businessId);
  const filter = { businessId };
  if (status) filter.status = status;
  if (farmType) filter.farmType = farmType;
  return paginate(Farm.find(filter), { page, limit });
}

async function listAllForBusinessRole({ status, farmType, page, limit } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (farmType) filter.farmType = farmType;
  return paginate(Farm.find(filter), { page, limit });
}

async function listForFarmerRole(userId, { status, farmType, page, limit } = {}) {
  if (!userId) throw new TypeError('userId is required');
  const farmIds = await FarmAssignment.distinct('farmId', {
    userId,
    status: 'active',
    deletedAt: null
  });
  const filter = { _id: { $in: farmIds } };
  if (status) filter.status = status;
  if (farmType) filter.farmType = farmType;
  return paginate(Farm.find(filter), { page, limit });
}

async function listDirectory() {
  return Farm.find({ deletedAt: null })
    .select('_id name code location.address')
    .sort('name')
    .lean()
    .exec();
}

async function updateById(
  businessId,
  farmId,
  updates,
  actorUserId,
  { session } = {}
) {
  requireBusinessId(businessId);
  requireActor(actorUserId);

  const query = Farm.findOne({ _id: farmId, businessId });
  if (session) query.session(session);
  const farm = await query.exec();
  if (!farm) return null;

  for (const [field, value] of Object.entries(updates || {})) {
    if (PROTECTED_UPDATE_FIELDS.has(field)) continue;
    if (MERGED_OBJECT_FIELDS.has(field) && value && typeof value === 'object') {
      farm.set(field, { ...asPlainObject(farm.get(field)), ...value });
    } else {
      farm.set(field, value);
    }
  }

  return farm.save({ session });
}

async function softDeleteById(businessId, farmId, actorUserId) {
  requireBusinessId(businessId);
  requireActor(actorUserId);
  const farm = await findById(businessId, farmId);
  if (!farm) return null;
  return farm.softDelete(actorUserId);
}

module.exports = {
  create,
  findById,
  findByIdForBusinessRole,
  findByCode,
  list,
  listAllForBusinessRole,
  listForFarmerRole,
  listDirectory,
  updateById,
  softDeleteById
};
