const repository = require('./admin-dashboard.repository');
const { isPlatformAdmin } = require('./admin-dashboard.policy');
const {
  AdminDashboardValidationError,
  validateDecision,
  validateId,
  validateListQuery,
  validateStatus,
} = require('./admin-dashboard.validator');

const USER_STATUSES = ['pending', 'active', 'suspended', 'rejected'];
const ORGANIZATION_STATUSES = ['pending', 'active', 'suspended', 'closed'];
const PROJECT_MANAGER_STATUSES = ['active', 'suspended'];

class AdminDashboardServiceError extends Error {
  constructor(message, status = 400, code = 'ADMIN_DASHBOARD_ERROR') {
    super(message);
    this.name = 'AdminDashboardServiceError';
    this.status = status;
    this.code = code;
  }
}

function requireAdmin(actor) {
  if (!isPlatformAdmin(actor)) {
    throw new AdminDashboardServiceError('Platform administrator access is required', 403, 'FORBIDDEN');
  }
}

function getActorId(actor) {
  return actor?._id || actor?.userId || actor?.id;
}

function validateOptionalListStatus(status, allowedStatuses) {
  if (!status || status === 'all') return;
  if (!allowedStatuses.includes(status)) {
    throw new AdminDashboardValidationError(`status must be one of: all, ${allowedStatuses.join(', ')}`);
  }
}

function normalizeUser(user) {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    requestedFarmId: user.requestedFarmId || null,
    profileCompletedAt: user.profileCompletedAt || null,
    role: user.role,
    accountStatus: user.accountStatus || 'active',
    approvedAt: user.approvedAt || null,
    approvedBy: user.approvedBy || null,
    suspendedAt: user.suspendedAt || null,
    suspendedBy: user.suspendedBy || null,
    statusReason: user.statusReason || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function normalizeOrganization(organization) {
  if (!organization) return null;
  const value = typeof organization.toObject === 'function' ? organization.toObject() : organization;
  return {
    id: value._id,
    legalName: value.legalName,
    displayName: value.displayName,
    slug: value.slug,
    status: value.status,
    billingEmail: value.contacts?.billingEmail || null,
    phone: value.contacts?.phone || null,
    countryCode: value.legal?.countryCode || null,
    timezone: value.timezone,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function validateProjectManagerPayload(payload, { partial = false } = {}) {
  const fields = {};
  for (const key of ['name', 'email', 'phone', 'role']) {
    if (payload[key] !== undefined) fields[key] = String(payload[key]).trim();
  }
  if (!partial && (!fields.name || !fields.email || !fields.phone)) {
    throw new AdminDashboardValidationError(['name, email and phone are required']);
  }
  if (fields.email && !/^\S+@\S+\.\S+$/.test(fields.email)) {
    throw new AdminDashboardValidationError(['email must be valid']);
  }
  if (payload.businessId) {
    validateId(payload.businessId, 'businessId');
    fields.businessId = payload.businessId;
  } else if (payload.businessId === null || payload.businessId === '') {
    fields.businessId = null;
  }
  if (payload.teamSize !== undefined) {
    const teamSize = Number(payload.teamSize);
    if (!Number.isFinite(teamSize) || teamSize < 0) {
      throw new AdminDashboardValidationError(['teamSize must be zero or greater']);
    }
    fields.teamSize = teamSize;
  }
  return fields;
}

function normalizeProjectManager(manager) {
  if (!manager) return null;
  const value = typeof manager.toObject === 'function' ? manager.toObject() : manager;
  return {
    id: value._id,
    name: value.name,
    email: value.email,
    phone: value.phone,
    role: value.role || 'Project Manager',
    business: value.businessId ? {
      id: value.businessId._id,
      name: value.businessId.displayName || value.businessId.legalName
    } : null,
    status: value.status || 'active',
    teamSize: value.teamSize || 0,
    projectsCount: value.projectsCount || 0,
    rating: value.rating || null,
    performancePct: value.performancePct || 0,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

async function recordAdminAction(action, actor, targetType, targetId, metadata = {}) {
  return repository.createAuditEvent({
    action,
    actorId: getActorId(actor),
    actorName: actor?.name || actor?.email || 'Platform admin',
    actorEmail: actor?.email,
    targetType,
    targetId: String(targetId),
    targetLabel: metadata.targetLabel,
    ipAddress: actor?.requestIp,
    metadata,
  });
}

async function getOverview(actor) {
  requireAdmin(actor);
  return repository.getOverview();
}

async function listFarmers(actor, query = {}) {
  requireAdmin(actor);
  const filters = validateListQuery(query);
  validateOptionalListStatus(filters.status, USER_STATUSES);
  if (filters.status === 'all') filters.status = '';
  return repository.listFarmers(filters);
}

async function getFarmer(actor, id) {
  requireAdmin(actor);
  validateId(id, 'farmerId');
  const user = await repository.findUserById(id);
  if (!user || user.role !== 'farmer') {
    throw new AdminDashboardServiceError('Farmer not found', 404, 'NOT_FOUND');
  }
  return normalizeUser(user);
}

async function updateFarmerStatus(actor, id, payload = {}) {
  requireAdmin(actor);
  validateId(id, 'farmerId');
  const { status, reason } = validateStatus(payload, 'user');
  const existing = await repository.findUserById(id);
  if (!existing || existing.role !== 'farmer') {
    throw new AdminDashboardServiceError('Farmer not found', 404, 'NOT_FOUND');
  }
  const updated = await repository.updateUserStatus(id, status, getActorId(actor), reason);
  await recordAdminAction('farmer.status_changed', actor, 'User', id, {
    previousStatus: existing.accountStatus || 'active', status, reason: reason || null,
  });
  return normalizeUser(updated);
}

async function updateFarmer(actor, id, payload = {}) {
  requireAdmin(actor);
  validateId(id, 'farmerId');
  const existing = await repository.findUserById(id);
  if (!existing || existing.role !== 'farmer') throw new AdminDashboardServiceError('Farmer not found', 404, 'NOT_FOUND');
  const updates = {};
  for (const key of ['name', 'email', 'phone']) {
    if (payload[key] !== undefined) updates[key] = String(payload[key]).trim();
  }
  if (!updates.name && payload.name !== undefined) throw new AdminDashboardValidationError(['name is required']);
  if (updates.email && !/^\S+@\S+\.\S+$/.test(updates.email)) throw new AdminDashboardValidationError(['email must be valid']);
  if (!Object.keys(updates).length) throw new AdminDashboardValidationError(['At least one editable field is required']);
  try {
    const updated = await repository.updateUserProfile(id, updates);
    await recordAdminAction('farmer.profile_updated', actor, 'User', id, { fields: Object.keys(updates), targetLabel: updates.name || existing.name || existing.email });
    return normalizeUser(updated);
  } catch (error) {
    if (error?.code === 11000) throw new AdminDashboardServiceError('That email or phone number is already in use', 409, 'DUPLICATE_PROFILE');
    throw error;
  }
}

async function listBusinesses(actor, query = {}) {
  requireAdmin(actor);
  const filters = validateListQuery(query);
  validateOptionalListStatus(filters.status, ORGANIZATION_STATUSES);
  if (filters.status === 'all') filters.status = '';
  return repository.listBusinesses(filters);
}

async function getBusiness(actor, id) {
  requireAdmin(actor);
  validateId(id, 'businessId');
  const organization = await repository.findOrganizationById(id);
  if (!organization) {
    throw new AdminDashboardServiceError('Business not found', 404, 'NOT_FOUND');
  }
  return normalizeOrganization(organization);
}

async function updateBusinessStatus(actor, id, payload = {}) {
  requireAdmin(actor);
  validateId(id, 'businessId');
  const { status } = validateStatus(payload, 'organization');
  const existing = await repository.findOrganizationById(id);
  if (!existing) {
    throw new AdminDashboardServiceError('Business not found', 404, 'NOT_FOUND');
  }
  const updated = await repository.updateOrganizationStatus(id, status, getActorId(actor));
  await recordAdminAction('business.status_changed', actor, 'Organization', id, {
    previousStatus: existing.status, status, reason: payload.reason || null,
  });
  return normalizeOrganization(updated);
}

async function listPendingApprovals(actor, query = {}) {
  requireAdmin(actor);
  const { limit } = validateListQuery({ ...query, page: 1 });
  return repository.listPendingApprovals(limit);
}

async function decideApproval(actor, entityType, id, payload = {}) {
  requireAdmin(actor);
  validateId(id, 'approvalId');
  const { decision, reason } = validateDecision(payload);
  const actorId = getActorId(actor);

  if (entityType === 'user') {
    const existing = await repository.findUserById(id);
    if (!existing) throw new AdminDashboardServiceError('User approval request not found', 404, 'NOT_FOUND');
    if ((existing.accountStatus || 'active') !== 'pending') {
      throw new AdminDashboardServiceError('This user approval request has already been decided', 409, 'ALREADY_DECIDED');
    }
    const updated = await repository.updateUserStatus(
      id, decision === 'approve' ? 'active' : 'rejected', actorId, reason
    );
    await recordAdminAction(`approval.${decision}`, actor, 'User', id, { reason: reason || null, targetLabel: existing.name || existing.email });
    return { entityType, entity: normalizeUser(updated) };
  }

  if (entityType === 'organization') {
    const existing = await repository.findOrganizationById(id);
    if (!existing) throw new AdminDashboardServiceError('Business approval request not found', 404, 'NOT_FOUND');
    if (existing.status !== 'pending') {
      throw new AdminDashboardServiceError('This business approval request has already been decided', 409, 'ALREADY_DECIDED');
    }
    const updated = await repository.updateOrganizationStatus(
      id,
      decision === 'approve' ? 'active' : 'closed',
      actorId
    );
    await recordAdminAction(`approval.${decision}`, actor, 'Organization', id, { reason: reason || null, targetLabel: existing.displayName });
    return { entityType, entity: normalizeOrganization(updated) };
  }

  throw new AdminDashboardValidationError('entityType must be either user or organization');
}

async function listProjectManagers(actor, query = {}) {
  requireAdmin(actor);
  const filters = validateListQuery(query);
  validateOptionalListStatus(filters.status, PROJECT_MANAGER_STATUSES);
  if (filters.status === 'all') filters.status = '';
  return repository.listProjectManagers(filters);
}

async function getProjectManager(actor, id) {
  requireAdmin(actor);
  validateId(id, 'projectManagerId');
  const manager = await repository.findProjectManagerById(id);
  if (!manager) throw new AdminDashboardServiceError('Project manager not found', 404, 'NOT_FOUND');
  return normalizeProjectManager(manager);
}

async function createProjectManager(actor, payload = {}) {
  requireAdmin(actor);
  const data = validateProjectManagerPayload(payload);
  try {
    const manager = await repository.createProjectManager({
      ...data,
      status: 'active',
      projectsCount: 0,
      performancePct: 0,
      rating: 0,
    });
    await recordAdminAction('project_manager.created', actor, 'Manager', manager._id, { email: manager.email, targetLabel: manager.name });
    return normalizeProjectManager(manager);
  } catch (error) {
    if (error?.code === 11000) {
      throw new AdminDashboardServiceError('A project manager with this email already exists', 409, 'DUPLICATE_EMAIL');
    }
    throw error;
  }
}

async function updateProjectManager(actor, id, payload = {}) {
  requireAdmin(actor);
  validateId(id, 'projectManagerId');
  const data = validateProjectManagerPayload(payload, { partial: true });
  if (!Object.keys(data).length) {
    throw new AdminDashboardValidationError(['At least one editable field is required']);
  }
  try {
    const manager = await repository.updateProjectManager(id, data);
    if (!manager) throw new AdminDashboardServiceError('Project manager not found', 404, 'NOT_FOUND');
    await recordAdminAction('project_manager.updated', actor, 'Manager', id, { fields: Object.keys(data), targetLabel: manager.name });
    return normalizeProjectManager(manager);
  } catch (error) {
    if (error?.code === 11000) {
      throw new AdminDashboardServiceError('A project manager with this email already exists', 409, 'DUPLICATE_EMAIL');
    }
    throw error;
  }
}

async function updateProjectManagerStatus(actor, id, payload = {}) {
  requireAdmin(actor);
  validateId(id, 'projectManagerId');
  const { status } = validateStatus(payload, 'user');
  if (!PROJECT_MANAGER_STATUSES.includes(status)) {
    throw new AdminDashboardValidationError(['status must be active or suspended']);
  }
  const manager = await repository.updateProjectManager(id, { status });
  if (!manager) throw new AdminDashboardServiceError('Project manager not found', 404, 'NOT_FOUND');
  await recordAdminAction('project_manager.status_changed', actor, 'Manager', id, { status, reason: payload.reason || null, targetLabel: manager.name });
  return normalizeProjectManager(manager);
}

const PLATFORM_SETTING_KEYS = [
  'requireBusinessApproval', 'requireFarmerApproval', 'autoSuspendPaymentFailures',
  'monthlyPayoutCycle', 'holdPayoutsForBatchReview', 'emailAdminsOnSignup',
  'emailAdminsOnHealthEvents'
];

async function getPlatformSettings(actor) {
  requireAdmin(actor);
  return repository.getPlatformSettings();
}

async function updatePlatformSettings(actor, payload = {}) {
  requireAdmin(actor);
  const updates = {};
  PLATFORM_SETTING_KEYS.forEach(key => {
    if (payload[key] !== undefined) {
      if (typeof payload[key] !== 'boolean') throw new AdminDashboardValidationError([`${key} must be a boolean`]);
      updates[key] = payload[key];
    }
  });
  if (!Object.keys(updates).length) throw new AdminDashboardValidationError(['At least one setting is required']);
  const settings = await repository.updatePlatformSettings(updates, getActorId(actor));
  await recordAdminAction('platform_settings.updated', actor, 'PlatformSettings', 'global', { fields: Object.keys(updates), targetLabel: 'Platform settings' });
  return settings;
}

async function listAuditEvents(actor, query = {}) {
  requireAdmin(actor);
  const filters = validateListQuery(query);
  filters.action = String(query.action || '').trim();
  return repository.listAuditEvents(filters);
}

async function getPlatformRevenue(actor) {
  requireAdmin(actor);
  return repository.getPlatformRevenue();
}

module.exports = {
  AdminDashboardServiceError,
  createProjectManager,
  decideApproval,
  getBusiness,
  getFarmer,
  getOverview,
  getPlatformRevenue,
  getPlatformSettings,
  getProjectManager,
  listBusinesses,
  listFarmers,
  listPendingApprovals,
  listProjectManagers,
  listAuditEvents,
  updateBusinessStatus,
  updateFarmerStatus,
  updateFarmer,
  updateProjectManager,
  updateProjectManagerStatus,
  updatePlatformSettings,
};
