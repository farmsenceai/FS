const repository = require('./farm-assignments.repository');
const policy = require('./farm-assignments.policy');
const validator = require('./farm-assignments.validator');
const User = require('../../../models/User');
const { isAdmin, isBusiness } = require('../../shared/auth/roleAccess');

class FarmAssignmentServiceError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = 'FarmAssignmentServiceError';
    this.code = code;
    this.status = status;
    if (details) this.details = details;
  }
}

function actorId(actorUser) {
  return actorUser?._id || actorUser?.userId || actorUser?.id;
}

function assertPolicy(allowed) {
  if (!allowed) {
    throw new FarmAssignmentServiceError(
      'You are not allowed to perform this action',
      'POLICY_DENIED',
      403
    );
  }
}

function assertFound(assignment) {
  if (!assignment) {
    throw new FarmAssignmentServiceError('Farm assignment not found', 'NOT_FOUND', 404);
  }
}

function writeAuditEvent(actorUser, action, assignment, metadata = {}) {
  // TODO: replace with real audit_events write once that module exists
  console.log({
    event: 'audit_event',
    occurredAt: new Date().toISOString(),
    actor: { type: 'user', id: actorId(actorUser) },
    action,
    entity: { type: 'farm_assignment', id: assignment._id },
    outcome: 'success',
    metadata
  });
}

async function assignUserToFarm(actorUser, businessId, farmId, payload) {
  assertPolicy(await policy.canCreateAssignment(actorUser, businessId));
  const validated = validator.validateCreate(payload);
  const assignedUser = await User.findById(validated.userId).select('role').lean().exec();
  if (!assignedUser || assignedUser.role !== 'farmer') {
    throw new FarmAssignmentServiceError(
      'Farm assignments can only be created for farmer accounts',
      'VALIDATION_ERROR',
      400
    );
  }
  const activeAssignment = await repository.findActiveForUserAndFarm(farmId, validated.userId);

  if (activeAssignment) {
    throw new FarmAssignmentServiceError(
      'This farmer already has an active assignment for this farm',
      'CONFLICT',
      409
    );
  }

  try {
    const assignedBy = actorId(actorUser);
    const assignment = await repository.create(businessId, farmId, {
      ...validated,
      assignedBy,
      createdBy: assignedBy
    });
    writeAuditEvent(actorUser, 'farm_assignment.created', assignment);
    return assignment;
  } catch (error) {
    if (error?.code === 11000) {
      throw new FarmAssignmentServiceError(
        'This farmer already has an active assignment for this farm',
        'CONFLICT',
        409
      );
    }
    throw error;
  }
}

async function listFarmAssignments(actorUser, businessId, farmId, filters = {}) {
  assertPolicy(await policy.canListFarmAssignments(actorUser, farmId));
  if (isBusiness(actorUser)) return repository.listForBusinessRole(farmId, filters);
  return repository.listForFarm(businessId, farmId, filters);
}

async function listUserAssignments(actorUser, userId) {
  assertPolicy(await policy.canListUserAssignments(actorUser, userId));
  return repository.listForUser(userId, { status: 'active' });
}

async function getFarmRoster(actorUser, farmId) {
  assertPolicy(isAdmin(actorUser) || isBusiness(actorUser));
  const assignments = await repository.listActiveWithFarmerDetails(farmId);
  return assignments
    .filter(assignment => assignment.userId)
    .map(assignment => ({
      assignmentId: assignment._id,
      farmerId: assignment.userId._id,
      name: assignment.userId.name || '',
      email: assignment.userId.email || '',
      phone: assignment.userId.phone || '',
      accountStatus: assignment.userId.accountStatus || 'active',
      startsAt: assignment.startsAt,
      status: assignment.status
    }));
}

async function endAssignment(actorUser, businessId, farmId, assignmentId) {
  assertPolicy(await policy.canEndAssignment(actorUser, businessId));
  const assignment = await repository.endAssignment(
    businessId,
    farmId,
    assignmentId,
    actorId(actorUser)
  );
  assertFound(assignment);
  writeAuditEvent(actorUser, 'farm_assignment.ended', assignment);
  return assignment;
}

module.exports = {
  FarmAssignmentServiceError,
  assignUserToFarm,
  listFarmAssignments,
  listUserAssignments,
  getFarmRoster,
  endAssignment
};
