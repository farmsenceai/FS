const Facility = require('./facilities.model');
const paginate = require('../../shared/db/pagination');

const MERGED_OBJECT_FIELDS = new Set(['dimensions', 'environmentTargets']);
const PROTECTED_UPDATE_FIELDS = new Set([
  '_id',
  'businessId',
  'farmId',
  'batchId',
  'createdBy',
  'deletedAt',
  'deletedBy'
]);

function requireBusinessAndFarm(businessId, farmId) {
  if (businessId === undefined || businessId === null) {
    throw new TypeError('businessId is required for facility repository operations');
  }
  if (farmId === undefined || farmId === null) {
    throw new TypeError('farmId is required for facility repository operations');
  }
}

function requireActor(actorUserId) {
  if (!actorUserId) throw new TypeError('actorUserId is required for facility writes');
}

function asPlainObject(value) {
  if (!value) return {};
  return typeof value.toObject === 'function' ? value.toObject() : { ...value };
}

async function create(businessId, farmId, data, { session } = {}) {
  requireBusinessAndFarm(businessId, farmId);
  const facility = new Facility({ ...data, businessId, farmId });
  return facility.save({ session });
}

async function findById(businessId, farmId, facilityId) {
  requireBusinessAndFarm(businessId, farmId);
  return Facility.findOne({ _id: facilityId, businessId, farmId }).exec();
}

async function findByIdForBusinessRole(farmId, facilityId) {
  if (!farmId) throw new TypeError('farmId is required');
  return Facility.findOne({ _id: facilityId, farmId }).exec();
}

async function findByCode(businessId, farmId, code) {
  requireBusinessAndFarm(businessId, farmId);
  return Facility.findOne({ businessId, farmId, code: String(code).toUpperCase() }).exec();
}

async function listForFarm(businessId, farmId, { type, status, page, limit } = {}) {
  requireBusinessAndFarm(businessId, farmId);
  const filter = { businessId, farmId };
  if (type) filter.type = type;
  if (status) filter.status = status;
  return paginate(Facility.find(filter), { page, limit });
}

async function listForBusinessRole(farmId, { type, status, page, limit } = {}) {
  if (!farmId) throw new TypeError('farmId is required');
  const filter = { farmId };
  if (type) filter.type = type;
  if (status) filter.status = status;
  return paginate(Facility.find(filter), { page, limit });
}

async function listChildren(businessId, farmId, parentFacilityId) {
  requireBusinessAndFarm(businessId, farmId);
  return Facility.find({ businessId, farmId, parentFacilityId }).sort('name').exec();
}

async function updateById(businessId, farmId, facilityId, updates, actorUserId) {
  requireBusinessAndFarm(businessId, farmId);
  requireActor(actorUserId);
  const facility = await Facility.findOne({ _id: facilityId, businessId, farmId }).exec();
  if (!facility) return null;

  for (const [field, value] of Object.entries(updates || {})) {
    if (PROTECTED_UPDATE_FIELDS.has(field)) continue;
    if (MERGED_OBJECT_FIELDS.has(field) && value && typeof value === 'object') {
      facility.set(field, { ...asPlainObject(facility.get(field)), ...value });
    } else {
      facility.set(field, value);
    }
  }
  return facility.save();
}

async function softDeleteById(businessId, farmId, facilityId, actorUserId) {
  requireBusinessAndFarm(businessId, farmId);
  requireActor(actorUserId);
  const facility = await findById(businessId, farmId, facilityId);
  if (!facility) return null;
  return facility.softDelete(actorUserId);
}

module.exports = {
  create,
  findById,
  findByIdForBusinessRole,
  findByCode,
  listForFarm,
  listForBusinessRole,
  listChildren,
  updateById,
  softDeleteById
};
