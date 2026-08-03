const repository = require('./farms.repository');
const policy = require('./farms.policy');
const validator = require('./farms.validator');
const farmProjectReviewsService = require('../farm-project-reviews/farm-project-reviews.service');
const { isAdmin, isBusiness, isFarmer } = require('../../shared/auth/roleAccess');

class FarmServiceError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = 'FarmServiceError';
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
    throw new FarmServiceError('You are not allowed to perform this action', 'POLICY_DENIED', 403);
  }
}

function assertFound(farm) {
  if (!farm) throw new FarmServiceError('Farm not found', 'NOT_FOUND', 404);
}

function mapDuplicateWrite(error, code) {
  if (error?.code !== 11000) throw error;
  throw new FarmServiceError(`Farm code '${code}' already exists`, 'CONFLICT', 409);
}

function writeAuditEvent(actorUser, action, farm, metadata = {}) {
  // TODO: replace with real audit_events write once that module exists
  console.log({
    event: 'audit_event',
    occurredAt: new Date().toISOString(),
    actor: { type: 'user', id: actorId(actorUser) },
    action,
    entity: { type: 'farm', id: farm._id },
    outcome: 'success',
    metadata
  });
}

async function createFarm(actorUser, businessId, payload) {
  assertPolicy(await policy.canCreateFarm(actorUser, businessId));
  if (!businessId) {
    throw new FarmServiceError('businessId is required when creating a farm', 'VALIDATION_ERROR', 400);
  }
  const validated = validator.validateCreate(payload);
  const existing = await repository.findByCode(businessId, validated.code);
  if (existing) {
    throw new FarmServiceError(`Farm code '${validated.code}' already exists`, 'CONFLICT', 409);
  }

  try {
    const farm = await repository.create(businessId, {
      ...validated,
      createdBy: actorId(actorUser)
    });
    writeAuditEvent(actorUser, 'farm.created', farm);
    return farm;
  } catch (error) {
    return mapDuplicateWrite(error, validated.code);
  }
}

async function getFarm(actorUser, businessId, farmId) {
  const farm = isBusiness(actorUser) || ((isAdmin(actorUser) || isFarmer(actorUser)) && !businessId)
    ? await repository.findByIdForBusinessRole(farmId)
    : await repository.findById(businessId, farmId);
  assertFound(farm);
  assertPolicy(await policy.canReadFarm(actorUser, businessId, farm));
  return farm;
}

async function getFarmRating(actorUser, businessId, farmId) {
  const farm = await getFarm(actorUser, businessId, farmId);
  return { farmId: farm._id, ...(await farmProjectReviewsService.getAverageRatingForFarm(farm._id)) };
}

async function listFarms(actorUser, businessId, filters = {}) {
  assertPolicy(await policy.canReadFarm(actorUser, businessId));
  if (isBusiness(actorUser)) return repository.listAllForBusinessRole(filters);
  if (isAdmin(actorUser) && !businessId) return repository.listAllForBusinessRole(filters);
  if (isFarmer(actorUser)) return repository.listForFarmerRole(actorId(actorUser), filters);
  return repository.list(businessId, filters);
}

async function listFarmDirectory(actorUser) {
  assertPolicy(isAdmin(actorUser) || isBusiness(actorUser) || isFarmer(actorUser));
  return repository.listDirectory();
}

async function updateFarm(actorUser, businessId, farmId, payload) {
  const existing = await repository.findById(businessId, farmId);
  assertFound(existing);
  assertPolicy(await policy.canUpdateFarm(actorUser, businessId, existing));
  const validated = validator.validateUpdate(payload);

  if (validated.code) {
    const codeOwner = await repository.findByCode(businessId, validated.code);
    if (codeOwner && String(codeOwner._id) !== String(existing._id)) {
      throw new FarmServiceError(`Farm code '${validated.code}' already exists`, 'CONFLICT', 409);
    }
  }

  try {
    const farm = await repository.updateById(
      businessId,
      farmId,
      validated,
      actorId(actorUser)
    );
    assertFound(farm);
    writeAuditEvent(actorUser, 'farm.updated', farm, { changedFields: Object.keys(validated) });
    return farm;
  } catch (error) {
    return mapDuplicateWrite(error, validated.code);
  }
}

async function closeFarm(actorUser, businessId, farmId) {
  const existing = await repository.findById(businessId, farmId);
  assertFound(existing);
  assertPolicy(await policy.canUpdateFarm(actorUser, businessId, existing));

  const farm = await repository.updateById(
    businessId,
    farmId,
    { status: 'closed', closedAt: new Date() },
    actorId(actorUser)
  );
  assertFound(farm);
  writeAuditEvent(actorUser, 'farm.closed', farm);
  return farm;
}

async function deleteFarm(actorUser, businessId, farmId) {
  const existing = await repository.findById(businessId, farmId);
  assertFound(existing);
  assertPolicy(await policy.canDeleteFarm(actorUser, businessId, existing));

  const farm = await repository.softDeleteById(businessId, farmId, actorId(actorUser));
  assertFound(farm);
  writeAuditEvent(actorUser, 'farm.deleted', farm);
  return farm;
}

module.exports = {
  FarmServiceError,
  createFarm,
  getFarm,
  getFarmRating,
  listFarms,
  listFarmDirectory,
  updateFarm,
  closeFarm,
  deleteFarm
};
