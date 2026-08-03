const ROLES = ['owner', 'admin', 'manager', 'member'];
const STATUSES = ['active', 'invited', 'suspended'];

class OrganizationMembershipValidationError extends Error {
  constructor(details) {
    super('Organization membership validation failed');
    this.name = 'OrganizationMembershipValidationError';
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function validateCreate(payload) {
  const value = payload && typeof payload === 'object' ? payload : {};
  const errors = [];
  if (!value.userId) errors.push('userId is required');
  if (!ROLES.includes(value.role)) errors.push(`role must be one of: ${ROLES.join(', ')}`);
  if (value.status !== undefined && !STATUSES.includes(value.status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  }
  if (errors.length) throw new OrganizationMembershipValidationError(errors);
  return {
    userId: value.userId,
    role: value.role,
    status: value.status || 'active',
    joinedAt: value.joinedAt || (value.status === 'invited' ? undefined : new Date())
  };
}

function validateUpdate(payload) {
  const value = payload && typeof payload === 'object' ? payload : {};
  const errors = [];
  const allowed = new Set(['role', 'status']);
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) errors.push(`${field} is not an allowed field`);
  }
  if (Object.hasOwn(value, 'role') && !ROLES.includes(value.role)) {
    errors.push(`role must be one of: ${ROLES.join(', ')}`);
  }
  if (Object.hasOwn(value, 'status') && !STATUSES.includes(value.status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  }
  if (!Object.keys(value).length) errors.push('At least one field must be provided');
  if (errors.length) throw new OrganizationMembershipValidationError(errors);
  const result = {};
  if (Object.hasOwn(value, 'role')) result.role = value.role;
  if (Object.hasOwn(value, 'status')) result.status = value.status;
  if (value.status === 'active') result.joinedAt = new Date();
  return result;
}

module.exports = {
  OrganizationMembershipValidationError,
  validateCreate,
  validateUpdate
};
