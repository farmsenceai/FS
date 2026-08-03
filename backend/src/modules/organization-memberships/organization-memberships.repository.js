const OrganizationMembership = require('./organization-memberships.model');
const paginate = require('../../shared/db/pagination');

const PROTECTED_FIELDS = new Set([
  '_id', 'businessId', 'farmId', 'batchId', 'userId', 'createdBy',
  'deletedAt', 'deletedBy'
]);

function requireBusinessId(businessId) {
  if (businessId === undefined || businessId === null) {
    throw new TypeError('businessId is required for organization membership operations');
  }
}

function requireActor(actorUserId) {
  if (!actorUserId) throw new TypeError('actorUserId is required for membership writes');
}

async function create(businessId, data, { session } = {}) {
  requireBusinessId(businessId);
  const membership = new OrganizationMembership({ ...data, businessId });
  return membership.save({ session });
}

async function findById(businessId, membershipId) {
  requireBusinessId(businessId);
  return OrganizationMembership.findOne({ _id: membershipId, businessId }).exec();
}

async function findActiveMembership(businessId, userId) {
  requireBusinessId(businessId);
  if (!userId) return null;
  return OrganizationMembership.findOne({ businessId, userId, status: 'active' }).exec();
}

async function listForBusiness(businessId, { status, role, page, limit } = {}) {
  requireBusinessId(businessId);
  const filter = { businessId };
  if (status) filter.status = status;
  if (role) filter.role = role;
  return paginate(OrganizationMembership.find(filter), { page, limit });
}

async function updateById(businessId, membershipId, updates, actorUserId) {
  requireBusinessId(businessId);
  requireActor(actorUserId);
  const membership = await findById(businessId, membershipId);
  if (!membership) return null;
  for (const [field, value] of Object.entries(updates || {})) {
    if (!PROTECTED_FIELDS.has(field)) membership.set(field, value);
  }
  return membership.save();
}

async function softDeleteById(businessId, membershipId, actorUserId) {
  requireBusinessId(businessId);
  requireActor(actorUserId);
  const membership = await findById(businessId, membershipId);
  if (!membership) return null;
  membership.status = 'suspended';
  membership.deletedAt = new Date();
  membership.deletedBy = actorUserId;
  return membership.save();
}

module.exports = {
  create,
  findById,
  findActiveMembership,
  listForBusiness,
  updateById,
  softDeleteById
};
