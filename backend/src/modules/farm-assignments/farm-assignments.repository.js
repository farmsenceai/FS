const FarmAssignment = require('./farm-assignments.model');
const paginate = require('../../shared/db/pagination');

const PROTECTED_UPDATE_FIELDS = new Set([
  '_id',
  'businessId',
  'farmId',
  'batchId',
  'userId',
  'createdBy',
  'assignedBy',
  'deletedAt',
  'deletedBy'
]);

function requireBusinessAndFarm(businessId, farmId) {
  if (businessId === undefined || businessId === null) {
    throw new TypeError('businessId is required for farm assignment repository operations');
  }
  if (farmId === undefined || farmId === null) {
    throw new TypeError('farmId is required for farm assignment repository operations');
  }
}

function requireUserId(userId) {
  if (userId === undefined || userId === null) {
    throw new TypeError('userId is required');
  }
}

function requireActor(actorUserId) {
  if (!actorUserId) throw new TypeError('actorUserId is required for assignment writes');
}

async function create(businessId, farmId, data, { session } = {}) {
  requireBusinessAndFarm(businessId, farmId);
  const assignment = new FarmAssignment({ ...data, businessId, farmId });
  return assignment.save({ session });
}

async function findActiveForUserAndFarm(farmId, userId) {
  if (!farmId) throw new TypeError('farmId is required');
  requireUserId(userId);
  return FarmAssignment.findOne({
    farmId,
    userId,
    status: 'active',
    deletedAt: null
  }).exec();
}

async function listForBusinessRole(farmId, { status, page, limit } = {}) {
  if (!farmId) throw new TypeError('farmId is required');
  const filter = { farmId };
  if (status) filter.status = status;
  return paginate(FarmAssignment.find(filter), { page, limit });
}

async function listForFarm(businessId, farmId, { status, page, limit } = {}) {
  requireBusinessAndFarm(businessId, farmId);
  const filter = { businessId, farmId };
  if (status) filter.status = status;
  return paginate(FarmAssignment.find(filter), { page, limit });
}

async function listActiveWithFarmerDetails(farmId) {
  if (!farmId) throw new TypeError('farmId is required');
  return FarmAssignment.find({
    farmId,
    status: 'active',
    deletedAt: null
  })
    .populate('userId', '_id name email phone accountStatus')
    .sort('userId.name')
    .lean()
    .exec();
}

/**
 * Deliberate tenant-scope exception: a user's access resolver must see that
 * user's assignments across every organization and farm. Callers must enforce
 * user-level authorization before invoking this query.
 */
async function listForUser(userId, { status } = {}) {
  requireUserId(userId);
  const filter = { userId };
  if (status) filter.status = status;
  return FarmAssignment.find(filter).sort('-startsAt').exec();
}

async function updateById(businessId, farmId, assignmentId, updates, actorUserId) {
  requireBusinessAndFarm(businessId, farmId);
  requireActor(actorUserId);
  const assignment = await FarmAssignment.findOne({
    _id: assignmentId,
    businessId,
    farmId
  }).exec();
  if (!assignment) return null;

  for (const [field, value] of Object.entries(updates || {})) {
    if (!PROTECTED_UPDATE_FIELDS.has(field)) assignment.set(field, value);
  }
  return assignment.save();
}

async function endAssignment(businessId, farmId, assignmentId, actorUserId) {
  requireBusinessAndFarm(businessId, farmId);
  requireActor(actorUserId);
  return updateById(
    businessId,
    farmId,
    assignmentId,
    { status: 'ended', endsAt: new Date() },
    actorUserId
  );
}

module.exports = {
  create,
  findActiveForUserAndFarm,
  listForBusinessRole,
  listForFarm,
  listActiveWithFarmerDetails,
  listForUser,
  updateById,
  endAssignment
};
