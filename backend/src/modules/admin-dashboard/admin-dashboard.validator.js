const mongoose = require('mongoose');

const DECISIONS = new Set(['approve', 'reject']);
const USER_STATUSES = new Set(['pending', 'active', 'suspended', 'rejected']);
const ORGANIZATION_STATUSES = new Set(['pending', 'active', 'suspended', 'closed']);

class AdminDashboardValidationError extends Error {
  constructor(details) {
    super('Admin dashboard request validation failed');
    this.name = 'AdminDashboardValidationError';
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function validateListQuery(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return {
    page,
    limit,
    search: typeof query.search === 'string' ? query.search.trim() : '',
    status: typeof query.status === 'string' ? query.status.trim().toLowerCase() : ''
  };
}

function validateId(id, label = 'id') {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AdminDashboardValidationError([`${label} must be a valid ObjectId`]);
  }
  return id;
}

function validateDecision(payload = {}) {
  const decision = typeof payload.decision === 'string' ? payload.decision.toLowerCase() : '';
  if (!DECISIONS.has(decision)) {
    throw new AdminDashboardValidationError(['decision must be approve or reject']);
  }
  return {
    decision,
    reason: typeof payload.reason === 'string' ? payload.reason.trim() : ''
  };
}

function validateStatus(payload = {}, entityType) {
  const status = typeof payload.status === 'string' ? payload.status.toLowerCase() : '';
  const allowed = entityType === 'organization' ? ORGANIZATION_STATUSES : USER_STATUSES;
  if (!allowed.has(status)) {
    throw new AdminDashboardValidationError([
      `status must be one of: ${[...allowed].join(', ')}`
    ]);
  }
  return {
    status,
    reason: typeof payload.reason === 'string' ? payload.reason.trim() : ''
  };
}

module.exports = {
  AdminDashboardValidationError,
  validateDecision,
  validateId,
  validateListQuery,
  validateStatus
};
