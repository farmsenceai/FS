const User = require('../../../models/User');
const Organization = require('../organizations/organizations.model');
const organizationsRepository = require('../organizations/organizations.repository');
const Farm = require('../farms/farms.model');
const FarmAssignment = require('../farm-assignments/farm-assignments.model');
const BirdBatch = require('../bird-batches/bird-batches.model');
const Manager = require('../../../models/Manager');
const ProjectAssignment = require('../../../models/ProjectAssignment');
const BatchSale = require('../batch-sales/batch-sales.model');
const PlatformSettings = require('./platform-settings.model');
const AdminAuditEvent = require('./admin-audit-event.model');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function userStatusCondition(status) {
  if (!status) return null;
  if (status === 'active') {
    return { $or: [{ accountStatus: 'active' }, { accountStatus: { $exists: false } }] };
  }
  return { accountStatus: status };
}

function buildUserFilter(role, { status, search } = {}) {
  const conditions = [{ role }];
  const statusCondition = userStatusCondition(status);
  if (statusCondition) conditions.push(statusCondition);
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    conditions.push({ $or: [{ name: regex }, { email: regex }, { phone: regex }] });
  }
  return conditions.length === 1 ? conditions[0] : { $and: conditions };
}

async function userStatusStats(role) {
  const base = { role };
  const [total, active, pending, suspended, rejected, assignedUserIds] = await Promise.all([
    User.countDocuments(base),
    User.countDocuments({
      ...base,
      $or: [{ accountStatus: 'active' }, { accountStatus: { $exists: false } }]
    }),
    User.countDocuments({ ...base, accountStatus: 'pending' }),
    User.countDocuments({ ...base, accountStatus: 'suspended' }),
    User.countDocuments({ ...base, accountStatus: 'rejected' }),
    role === 'farmer' ? FarmAssignment.distinct('userId', { status: 'active', deletedAt: null }) : []
  ]);
  const assigned = role === 'farmer'
    ? await User.countDocuments({ role: 'farmer', _id: { $in: assignedUserIds } })
    : 0;
  return { total, active, pending, suspended, rejected, assigned };
}

async function listFarmers({ status, search, page, limit }) {
  const filter = buildUserFilter('farmer', { status, search });
  const [users, total, stats] = await Promise.all([
    User.find(filter)
      .select('name email phone avatar requestedFarmId profileCompletedAt accountStatus approvedAt createdAt updatedAt lastLogin')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
    userStatusStats('farmer')
  ]);

  const userIds = users.map(user => user._id);
  const assignments = userIds.length
    ? await FarmAssignment.find({ userId: { $in: userIds }, status: 'active' }).lean()
    : [];
  const farmIds = [...new Set(assignments.map(item => String(item.farmId)))];
  const farms = farmIds.length
    ? await Farm.find({ _id: { $in: farmIds } }).select('name location').lean()
    : [];
  const farmById = new Map(farms.map(farm => [String(farm._id), farm]));
  const batchCounts = farmIds.length
    ? await BirdBatch.aggregate([
        { $match: { farmId: { $in: farms.map(farm => farm._id) }, status: 'active', deletedAt: null } },
        { $group: { _id: '$farmId', count: { $sum: 1 } } }
      ])
    : [];
  const batchesByFarm = new Map(batchCounts.map(item => [String(item._id), item.count]));

  const data = users.map(user => {
    const userAssignments = assignments.filter(item => String(item.userId) === String(user._id));
    const assignedFarms = userAssignments
      .map(item => farmById.get(String(item.farmId)))
      .filter(Boolean);
    return {
      id: user._id,
      name: user.name || user.email,
      email: user.email,
      phone: user.phone || null,
      requestedFarmId: user.requestedFarmId || null,
      profileCompletedAt: user.profileCompletedAt || null,
      avatar: user.avatar || null,
      status: user.accountStatus || 'active',
      approvedAt: user.approvedAt || null,
      joinedAt: user.createdAt,
      lastActivityAt: user.lastLogin || user.updatedAt || user.createdAt,
      farms: assignedFarms.map(farm => ({
        id: farm._id,
        name: farm.name,
        location: farm.location?.address || null
      })),
      activeBatches: assignedFarms.reduce(
        (sum, farm) => sum + (batchesByFarm.get(String(farm._id)) || 0),
        0
      )
    };
  });

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, stats };
}

async function listBusinesses({ status, search, page, limit }) {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { legalName: regex },
      { displayName: regex },
      { 'contacts.billingEmail': regex }
    ];
  }

  const [organizations, total, statusRows] = await Promise.all([
    Organization.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),
    Organization.countDocuments(filter),
    Organization.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);
  const organizationIds = organizations.map(item => item._id);
  const farmCounts = organizationIds.length
    ? await Farm.aggregate([
        { $match: { businessId: { $in: organizationIds }, deletedAt: null } },
        { $group: { _id: '$businessId', count: { $sum: 1 } } }
      ])
    : [];
  const countsByOrganization = new Map(
    farmCounts.map(item => [String(item._id), item.count])
  );
  const statusCounts = Object.fromEntries(statusRows.map(row => [row._id, row.count]));

  return {
    data: organizations.map(organization => ({
      id: organization._id,
      legalName: organization.legalName,
      displayName: organization.displayName,
      contact: organization.contacts?.billingEmail || null,
      farmsManaged: countsByOrganization.get(String(organization._id)) || 0,
      plan: null,
      status: organization.status,
      createdAt: organization.createdAt
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: {
      total: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
      active: statusCounts.active || 0,
      pending: statusCounts.pending || 0,
      suspended: statusCounts.suspended || 0,
      closed: statusCounts.closed || 0,
      combinedMrr: null
    }
  };
}

async function getOverview() {
  const monthStart = new Date();
  monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const [totalFarms, totalFarmers, totalBusinesses, recentUsers, recentOrganizations, revenueRows] =
    await Promise.all([
      Farm.countDocuments({}),
      User.countDocuments({ role: 'farmer' }),
      Organization.countDocuments({}),
      User.find({ role: { $in: ['farmer', 'business'] } })
        .select('name email role accountStatus createdAt')
        .sort('-createdAt')
        .limit(8)
        .lean(),
      Organization.find({}).sort('-createdAt').limit(8).lean(),
      BatchSale.aggregate([
        { $match: { saleDate: { $gte: monthStart }, deletedAt: null } },
        { $group: { _id: null, revenue: { $sum: '$revenue' } } }
      ])
    ]);

  const recentSignups = [
    ...recentUsers.map(user => ({
      id: user._id,
      name: user.name || user.email,
      type: user.role,
      joinedAt: user.createdAt,
      status: user.accountStatus || 'active'
    })),
    ...recentOrganizations.map(organization => ({
      id: organization._id,
      name: organization.displayName,
      type: 'business',
      joinedAt: organization.createdAt,
      status: organization.status
    }))
  ]
    .sort((left, right) => new Date(right.joinedAt) - new Date(left.joinedAt))
    .slice(0, 8);

  return {
    stats: { totalFarms, totalFarmers, totalBusinesses, platformRevenueMtd: Number(revenueRows[0]?.revenue?.toString() || 0) },
    recentSignups
  };
}

async function getPlatformSettings() {
  return PlatformSettings.findOneAndUpdate(
    { key: 'global' }, { $setOnInsert: { key: 'global' } }, { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
}

async function updatePlatformSettings(updates, actorUserId) {
  return PlatformSettings.findOneAndUpdate(
    { key: 'global' }, { $set: { ...updates, updatedBy: actorUserId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
}

async function createAuditEvent(event) {
  // Unit/service callers may run without a database; the live app connects before serving requests.
  if (AdminAuditEvent.db.readyState !== 1) return event;
  return AdminAuditEvent.create(event);
}

async function listAuditEvents({ action, search, page, limit }) {
  const filter = {};
  if (action) filter.action = action;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ action: regex }, { actorName: regex }, { actorEmail: regex }, { targetLabel: regex }, { targetType: regex }];
  }
  const [data, total, actions] = await Promise.all([
    AdminAuditEvent.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit).lean(),
    AdminAuditEvent.countDocuments(filter),
    AdminAuditEvent.distinct('action')
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, actions: actions.sort() };
}

async function getPlatformRevenue() {
  const monthStart = new Date();
  monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const [allTime, month, byBusiness] = await Promise.all([
    BatchSale.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: null, revenue: { $sum: '$revenue' }, sales: { $sum: 1 }, farms: { $addToSet: '$farmId' } } }]),
    BatchSale.aggregate([{ $match: { deletedAt: null, saleDate: { $gte: monthStart } } }, { $group: { _id: null, revenue: { $sum: '$revenue' }, sales: { $sum: 1 } } }]),
    BatchSale.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$businessId', revenue: { $sum: '$revenue' }, sales: { $sum: 1 }, farms: { $addToSet: '$farmId' } } },
      { $sort: { revenue: -1 } },
      { $lookup: { from: 'organizations', localField: '_id', foreignField: '_id', as: 'organization' } },
      { $unwind: { path: '$organization', preserveNullAndEmptyArrays: true } }
    ])
  ]);
  const num = value => Number(value?.toString() || 0);
  const totalRevenue = num(allTime[0]?.revenue);
  return {
    summary: { allTimeRevenue: totalRevenue, monthRevenue: num(month[0]?.revenue), allTimeSales: allTime[0]?.sales || 0, monthSales: month[0]?.sales || 0, revenueFarms: allTime[0]?.farms?.length || 0 },
    organizations: byBusiness.map(row => ({ id: row._id, name: row.organization?.displayName || row.organization?.legalName || 'Unknown organization', revenue: num(row.revenue), sales: row.sales, farms: row.farms.length, sharePct: totalRevenue ? Number((num(row.revenue) / totalRevenue * 100).toFixed(1)) : 0 }))
  };
}

async function listPendingApprovals(limit = 50) {
  const [organizations, users] = await Promise.all([
    Organization.find({ status: 'pending' }).sort('createdAt').limit(limit).lean(),
    User.find({
      role: { $in: ['farmer', 'business'] },
      accountStatus: 'pending'
    })
      .sort('createdAt')
      .limit(limit)
      .lean()
  ]);
  return [
    ...organizations.map(item => ({
      id: item._id,
      entityType: 'organization',
      title: item.displayName,
      requester: item.contacts?.billingEmail || item.legalName,
      approvalType: 'business_signup',
      submittedAt: item.createdAt
    })),
    ...users.map(item => ({
      id: item._id,
      entityType: 'user',
      title: item.name || item.email,
      requester: item.email,
      approvalType: `${item.role}_signup`,
      submittedAt: item.createdAt
    }))
  ].sort((left, right) => new Date(left.submittedAt) - new Date(right.submittedAt));
}

async function findUserById(userId) {
  return User.findById(userId).lean();
}

async function updateUserStatus(userId, status, actorUserId, reason) {
  const user = await User.findById(userId);
  if (!user) return null;
  user.accountStatus = status;
  user.statusReason = reason || undefined;
  if (status === 'active') {
    user.approvedAt = new Date();
    user.approvedBy = actorUserId;
    user.suspendedAt = undefined;
    user.suspendedBy = undefined;
  } else if (status === 'suspended') {
    user.suspendedAt = new Date();
    user.suspendedBy = actorUserId;
  }
  return user.save();
}

async function updateUserProfile(userId, updates) {
  return User.findOneAndUpdate(
    { _id: userId, role: 'farmer' }, { $set: updates },
    { new: true, runValidators: true }
  ).lean();
}

async function findOrganizationById(organizationId) {
  return organizationsRepository.findById(organizationId);
}

async function updateOrganizationStatus(organizationId, status, actorUserId) {
  const updates = { status };
  if (status === 'active') {
    updates.approvedAt = new Date();
    updates.approvedBy = actorUserId;
  }
  return organizationsRepository.updateById(
    organizationId,
    updates,
    actorUserId
  );
}

async function projectManagerStats() {
  const [total, active, suspended, activeProjects, ratingRows] = await Promise.all([
    Manager.countDocuments({ deletedAt: null }),
    Manager.countDocuments({ deletedAt: null, status: { $in: ['active', null] } }),
    Manager.countDocuments({ deletedAt: null, status: 'suspended' }),
    ProjectAssignment.countDocuments({ status: { $ne: 'Completed' } }),
    Manager.aggregate([
      { $match: { deletedAt: null, rating: { $gt: 0 } } },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ])
  ]);
  return {
    total,
    active,
    suspended,
    activeProjects,
    averageRating: ratingRows[0]?.average ? Number(ratingRows[0].average.toFixed(1)) : null
  };
}

async function listProjectManagers({ status, search, page, limit }) {
  const filter = { deletedAt: null };
  if (status) {
    filter.status = status === 'active' ? { $in: ['active', null] } : status;
  }
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { role: regex }];
  }

  const [managers, total, stats] = await Promise.all([
    Manager.find(filter)
      .populate('businessId', 'displayName legalName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Manager.countDocuments(filter),
    projectManagerStats()
  ]);
  const ids = managers.map(item => item._id);
  const projectRows = ids.length ? await ProjectAssignment.aggregate([
    { $match: { manager: { $in: ids }, status: { $ne: 'Completed' } } },
    { $group: { _id: '$manager', count: { $sum: 1 } } }
  ]) : [];
  const projectsByManager = new Map(projectRows.map(item => [String(item._id), item.count]));

  return {
    data: managers.map(manager => ({
      id: manager._id,
      name: manager.name,
      email: manager.email,
      phone: manager.phone,
      role: manager.role || 'Project Manager',
      business: manager.businessId ? {
        id: manager.businessId._id,
        name: manager.businessId.displayName || manager.businessId.legalName
      } : null,
      activeProjects: projectsByManager.get(String(manager._id)) || 0,
      rating: manager.rating || null,
      teamSize: manager.teamSize || 0,
      performancePct: manager.performancePct || 0,
      status: manager.status || 'active',
      createdAt: manager.createdAt
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats
  };
}

async function findProjectManagerById(id) {
  return Manager.findOne({ _id: id, deletedAt: null })
    .populate('businessId', 'displayName legalName')
    .lean();
}

async function createProjectManager(data) {
  return Manager.create(data);
}

async function updateProjectManager(id, updates) {
  return Manager.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('businessId', 'displayName legalName');
}

module.exports = {
  createProjectManager,
  findOrganizationById,
  findProjectManagerById,
  findUserById,
  getOverview,
  getPlatformRevenue,
  getPlatformSettings,
  createAuditEvent,
  listAuditEvents,
  listBusinesses,
  listFarmers,
  listPendingApprovals,
  listProjectManagers,
  updateProjectManager,
  updatePlatformSettings,
  updateOrganizationStatus,
  updateUserStatus,
  updateUserProfile
};
