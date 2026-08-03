const repository = require('./organizations.repository');
const policy = require('./organizations.policy');
const validator = require('./organizations.validator');

class OrganizationServiceError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = 'OrganizationServiceError';
    this.code = code;
    this.status = status;
    if (details) this.details = details;
  }
}

function actorId(actorUser) {
  return actorUser?._id || actorUser?.userId || actorUser?.id;
}

function assertPolicy(allowed, message = 'You are not allowed to perform this action') {
  if (!allowed) throw new OrganizationServiceError(message, 'POLICY_DENIED', 403);
}

function assertFound(organization) {
  if (!organization) {
    throw new OrganizationServiceError('Organization not found', 'NOT_FOUND', 404);
  }
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function availableSlug(preferredSlug) {
  const base = slugify(preferredSlug);
  if (!base) return base;

  let candidate = base;
  let suffix = 2;
  while (await repository.findBySlug(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function mapDuplicateWrite(error, slug) {
  if (error?.code !== 11000) throw error;
  const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'unique field';
  const message = field === 'slug' ? `Organization slug '${slug}' already exists` : `${field} already exists`;
  throw new OrganizationServiceError(message, 'SLUG_CONFLICT', 409);
}

function writeAuditEvent(actorUser, action, organization, metadata = {}) {
  // TODO: replace with real audit_events write once that module exists
  console.log({
    event: 'audit_event',
    occurredAt: new Date().toISOString(),
    actor: { type: 'user', id: actorId(actorUser) },
    action,
    entity: { type: 'organization', id: organization._id },
    outcome: 'success',
    metadata
  });
}

async function createOrganization(actorUser, payload) {
  assertPolicy(policy.canCreateOrganization(actorUser));

  const candidate = { ...(payload || {}) };
  if (!candidate.slug) candidate.slug = slugify(candidate.displayName);
  const validated = validator.validateCreate(candidate);
  validated.slug = await availableSlug(validated.slug);

  try {
    const organization = await repository.create(validated, {
      actorUserId: actorId(actorUser)
    });
    writeAuditEvent(actorUser, 'organization.created', organization);
    return organization;
  } catch (error) {
    return mapDuplicateWrite(error, validated.slug);
  }
}

async function getOrganization(actorUser, orgId) {
  const organization = await repository.findById(orgId);
  assertFound(organization);
  assertPolicy(await policy.canReadOrganization(actorUser, organization));
  return organization;
}

async function listOrganizations(actorUser, filters = {}) {
  assertPolicy(policy.canListOrganizations(actorUser));
  return repository.list(filters);
}

async function getOrganizationDashboard(actorUser, organizationId) {
  const organization = await repository.findById(organizationId);
  assertFound(organization);
  assertPolicy(await policy.canReadOrganization(actorUser, organization));

  const { farms, managerAssignments, farmerAssignments } =
    await repository.getDashboardRelations(organizationId);
  const farmsById = new Map(farms.map(farm => [String(farm._id), farm]));
  const managersById = new Map();
  const farmersById = new Map();

  for (const assignment of managerAssignments) {
    const manager = assignment.managerId;
    const farm = farmsById.get(String(assignment.farmId));
    if (!manager || !farm) continue;
    const key = String(manager._id);
    if (!managersById.has(key)) managersById.set(key, { manager, farms: [] });
    managersById.get(key).farms.push(farm);
  }

  for (const assignment of farmerAssignments) {
    const farmer = assignment.userId;
    const farm = farmsById.get(String(assignment.farmId));
    if (!farmer || !farm) continue;
    const key = String(farmer._id);
    if (!farmersById.has(key)) {
      farmersById.set(key, {
        farmerId: farmer._id,
        name: farmer.name,
        email: farmer.email,
        phone: farmer.phone,
        farms: []
      });
    }
    farmersById.get(key).farms.push(farm);
  }

  const managers = [...managersById.values()];
  const farmers = [...farmersById.values()];
  return {
    organization,
    summary: {
      farmCount: farms.length,
      managerCount: managers.length,
      farmerCount: farmers.length
    },
    farms,
    managers,
    farmers
  };
}

async function updateOrganization(actorUser, orgId, payload) {
  const existing = await repository.findById(orgId);
  assertFound(existing);
  assertPolicy(await policy.canUpdateOrganization(actorUser, existing));

  const validated = validator.validateUpdate(payload);
  if (validated.slug) {
    const slugOwner = await repository.findBySlug(validated.slug);
    if (slugOwner && String(slugOwner._id) !== String(existing._id)) {
      throw new OrganizationServiceError(
        `Organization slug '${validated.slug}' already exists`,
        'SLUG_CONFLICT',
        409
      );
    }
  }

  try {
    const organization = await repository.updateById(
      orgId,
      validated,
      actorId(actorUser)
    );
    assertFound(organization);
    writeAuditEvent(actorUser, 'organization.updated', organization, {
      changedFields: Object.keys(validated)
    });
    return organization;
  } catch (error) {
    return mapDuplicateWrite(error, validated.slug);
  }
}

async function suspendOrganization(actorUser, orgId, reason) {
  assertPolicy(policy.isPlatformAdmin(actorUser));
  if (typeof reason !== 'string' || !reason.trim()) {
    throw new validator.OrganizationValidationError(['reason is required']);
  }

  const existing = await repository.findById(orgId);
  assertFound(existing);
  const organization = await repository.updateById(
    orgId,
    { status: 'suspended' },
    actorId(actorUser)
  );
  assertFound(organization);
  writeAuditEvent(actorUser, 'organization.suspended', organization, { reason: reason.trim() });
  return organization;
}

async function deleteOrganization(actorUser, orgId) {
  const existing = await repository.findById(orgId);
  assertFound(existing);
  assertPolicy(policy.canDeleteOrganization(actorUser, existing));

  const organization = await repository.softDeleteById(orgId, actorId(actorUser));
  assertFound(organization);
  writeAuditEvent(actorUser, 'organization.deleted', organization);
  return organization;
}

module.exports = {
  OrganizationServiceError,
  createOrganization,
  getOrganization,
  listOrganizations,
  getOrganizationDashboard,
  updateOrganization,
  suspendOrganization,
  deleteOrganization
};
