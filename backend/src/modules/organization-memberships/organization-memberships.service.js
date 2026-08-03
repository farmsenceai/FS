const repository = require('./organization-memberships.repository');
const policy = require('./organization-memberships.policy');
const validator = require('./organization-memberships.validator');
const { actorId } = require('../../shared/auth/roleAccess');

class OrganizationMembershipServiceError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = 'OrganizationMembershipServiceError';
    this.code = code;
    this.status = status;
    if (details) this.details = details;
  }
}

function assertPolicy(allowed) {
  if (!allowed) throw new OrganizationMembershipServiceError(
    'You are not allowed to perform this action', 'POLICY_DENIED', 403
  );
}

function assertFound(value) {
  if (!value) throw new OrganizationMembershipServiceError(
    'Organization membership not found', 'NOT_FOUND', 404
  );
}

async function createMembership(actorUser, businessId, payload) {
  assertPolicy(await policy.canCreateMembership(actorUser, businessId));
  const validated = validator.validateCreate(payload);
  try {
    return await repository.create(businessId, {
      ...validated,
      invitedBy: actorId(actorUser),
      createdBy: actorId(actorUser)
    });
  } catch (error) {
    if (error?.code === 11000) throw new OrganizationMembershipServiceError(
      'This user already has an active or invited membership', 'CONFLICT', 409
    );
    throw error;
  }
}

async function listMemberships(actorUser, businessId, filters = {}) {
  assertPolicy(await policy.canListMemberships(actorUser, businessId));
  return repository.listForBusiness(businessId, filters);
}

async function updateMembership(actorUser, businessId, membershipId, payload) {
  assertPolicy(await policy.canUpdateMembership(actorUser, businessId));
  const membership = await repository.updateById(
    businessId, membershipId, validator.validateUpdate(payload), actorId(actorUser)
  );
  assertFound(membership);
  return membership;
}

async function removeMembership(actorUser, businessId, membershipId) {
  assertPolicy(await policy.canDeleteMembership(actorUser, businessId));
  const membership = await repository.softDeleteById(
    businessId, membershipId, actorId(actorUser)
  );
  assertFound(membership);
  return membership;
}

module.exports = {
  OrganizationMembershipServiceError,
  createMembership,
  listMemberships,
  updateMembership,
  removeMembership
};
