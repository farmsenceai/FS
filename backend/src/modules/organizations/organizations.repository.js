const Organization = require('./organizations.model');
const paginate = require('../../shared/db/pagination');
const Farm = require('../farms/farms.model');
const ManagerFarmAssignment = require('../managers/manager-farm-assignments.model');
const FarmAssignment = require('../farm-assignments/farm-assignments.model');

const MERGED_OBJECT_FIELDS = new Set(['legal', 'contacts', 'branding']);
const PROTECTED_UPDATE_FIELDS = new Set(['_id', 'version', 'deletedAt', 'deletedBy']);

function requireActor(actorUserId) {
  if (!actorUserId) {
    throw new TypeError('actorUserId is required for organization writes');
  }
}

function asPlainObject(value) {
  if (!value) return {};
  return typeof value.toObject === 'function' ? value.toObject() : { ...value };
}

async function create(data, { session, actorUserId } = {}) {
  requireActor(actorUserId);
  const organization = new Organization(data);
  return organization.save({ session });
}

async function findById(id, { withDeleted = false } = {}) {
  const query = Organization.findById(id);
  if (withDeleted) query.setOptions({ withDeleted: true });
  return query.exec();
}

async function findBySlug(slug) {
  return Organization.findOne({ slug: String(slug).toLowerCase() })
    .setOptions({ withDeleted: true })
    .exec();
}

async function list({ status, page, limit } = {}) {
  const filter = status ? { status } : {};
  return paginate(Organization.find(filter), { page, limit });
}

async function getDashboardRelations(organizationId) {
  const farms = await Farm.find({ businessId: organizationId, deletedAt: null })
    .select('_id code name status farmType location capacity')
    .lean()
    .exec();
  const farmIds = farms.map(farm => farm._id);
  if (!farmIds.length) return { farms, managerAssignments: [], farmerAssignments: [] };

  const [managerAssignments, farmerAssignments] = await Promise.all([
    ManagerFarmAssignment.aggregate([
      { $match: { farmId: { $in: farmIds }, status: 'active', deletedAt: null } },
      { $lookup: { from: 'canonical_managers', localField: 'managerId', foreignField: '_id', as: 'manager' } },
      { $unwind: '$manager' },
      { $match: { 'manager.deletedAt': null } },
      { $project: {
        farmId: 1,
        managerId: {
          _id: '$manager._id', name: '$manager.name', title: '$manager.title',
          email: '$manager.email', phone: '$manager.phone', status: '$manager.status'
        }
      } }
    ]).exec(),
    FarmAssignment.aggregate([
      { $match: { farmId: { $in: farmIds }, status: 'active', deletedAt: null } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'farmer' } },
      { $unwind: '$farmer' },
      { $match: { 'farmer.deletedAt': null } },
      { $project: {
        farmId: 1,
        userId: {
          _id: '$farmer._id', name: '$farmer.name', email: '$farmer.email', phone: '$farmer.phone'
        }
      } }
    ]).exec()
  ]);

  return { farms, managerAssignments, farmerAssignments };
}

async function updateById(id, updates, actorUserId, { session } = {}) {
  requireActor(actorUserId);

  const query = Organization.findById(id);
  if (session) query.session(session);
  const organization = await query.exec();
  if (!organization) return null;

  for (const [field, value] of Object.entries(updates || {})) {
    if (PROTECTED_UPDATE_FIELDS.has(field)) continue;

    if (MERGED_OBJECT_FIELDS.has(field) && value && typeof value === 'object') {
      organization.set(field, { ...asPlainObject(organization.get(field)), ...value });
    } else {
      organization.set(field, value);
    }
  }

  return organization.save({ session });
}

async function softDeleteById(id, actorUserId) {
  requireActor(actorUserId);
  const organization = await findById(id);
  if (!organization) return null;
  return organization.softDelete(actorUserId);
}

module.exports = {
  create,
  findById,
  findBySlug,
  list,
  getDashboardRelations,
  updateById,
  softDeleteById
};
