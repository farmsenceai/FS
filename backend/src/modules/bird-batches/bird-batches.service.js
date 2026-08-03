const repository = require('./bird-batches.repository');
const facilitiesRepository = require('../facilities/facilities.repository');
const farmsRepository = require('../farms/farms.repository');
const { generateUniqueBatchCode } = require('./batch-code');
const policy = require('./bird-batches.policy');
const validator = require('./bird-batches.validator');
const { isBusiness } = require('../../shared/auth/roleAccess');

class BirdBatchServiceError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = 'BirdBatchServiceError';
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
    throw new BirdBatchServiceError(
      'You are not allowed to perform this action',
      'POLICY_DENIED',
      403
    );
  }
}

function assertFound(batch) {
  if (!batch) throw new BirdBatchServiceError('Bird batch not found', 'NOT_FOUND', 404);
}

async function verifyFacility(businessId, farmId, facilityId) {
  const facility = await facilitiesRepository.findById(businessId, farmId, facilityId);
  if (
    !facility ||
    String(facility.businessId) !== String(businessId) ||
    String(facility.farmId) !== String(farmId)
  ) {
    throw new BirdBatchServiceError(
      'Facility does not exist in this organization and farm',
      'VALIDATION_ERROR',
      400
    );
  }
}

function mapDuplicateWrite(error, code) {
  if (error?.code !== 11000) throw error;
  throw new BirdBatchServiceError(`Batch code '${code}' already exists`, 'CONFLICT', 409);
}

function writeAuditEvent(actorUser, action, batch, metadata = {}) {
  // TODO: replace with real audit_events write once that module exists
  console.log({
    event: 'audit_event',
    occurredAt: new Date().toISOString(),
    actor: { type: 'user', id: actorId(actorUser) },
    action,
    entity: { type: 'bird_batch', id: batch._id },
    outcome: 'success',
    metadata
  });
}

async function createBatch(actorUser, businessId, farmId, payload) {
  assertPolicy(await policy.canCreateBatch(actorUser, businessId, farmId));
  const validated = validator.validateCreate(payload);
  await verifyFacility(businessId, farmId, validated.facilityId);
  const farm = isBusiness(actorUser)
    ? await farmsRepository.findByIdForBusinessRole(farmId)
    : await farmsRepository.findById(businessId, farmId);
  if (!farm) throw new BirdBatchServiceError('Farm not found', 'NOT_FOUND', 404);
  const code = await generateUniqueBatchCode({
    farmCode: farm.code,
    isTaken: async candidate => Boolean(await repository.findByCode(businessId, farmId, candidate))
  }).catch(error => {
    throw new BirdBatchServiceError(error.message, 'BATCH_CODE_EXHAUSTED', 409);
  });

  try {
    const batch = await repository.create(businessId, farmId, {
      ...validated,
      code,
      currentBirdCountCached: validated.initialBirdCount,
      createdBy: actorId(actorUser)
    });
    writeAuditEvent(actorUser, 'bird_batch.created', batch);
    return batch;
  } catch (error) {
    return mapDuplicateWrite(error, code);
  }
}

async function getBatch(actorUser, businessId, farmId, batchId) {
  const batch = isBusiness(actorUser)
    ? await repository.findByIdForBusinessRole(farmId, batchId)
    : await repository.findById(businessId, farmId, batchId);
  assertFound(batch);
  assertPolicy(await policy.canReadBatch(actorUser, businessId, farmId, batch));
  return batch;
}

async function listFarmBatches(actorUser, businessId, farmId, filters = {}) {
  assertPolicy(await policy.canReadBatch(actorUser, businessId, farmId));
  if (isBusiness(actorUser)) return repository.listForBusinessRole(farmId, filters);
  return repository.listForFarm(businessId, farmId, filters);
}

async function updateBatch(actorUser, businessId, farmId, batchId, payload) {
  const existing = await repository.findById(businessId, farmId, batchId);
  assertFound(existing);
  assertPolicy(await policy.canUpdateBatch(actorUser, businessId, existing));
  const validated = validator.validateUpdate(payload);

  if (validated.facilityId) {
    await verifyFacility(businessId, farmId, validated.facilityId);
  }
  if (validated.code) {
    const codeOwner = await repository.findByCode(businessId, farmId, validated.code);
    if (codeOwner && String(codeOwner._id) !== String(existing._id)) {
      throw new BirdBatchServiceError(
        `Batch code '${validated.code}' already exists`,
        'CONFLICT',
        409
      );
    }
  }

  try {
    let batch = await repository.updateById(
      businessId,
      farmId,
      batchId,
      validated,
      actorId(actorUser)
    );
    assertFound(batch);
    if (Object.hasOwn(validated, 'initialBirdCount')) {
      batch = await repository.recalculateCurrentBirdCount(businessId, farmId, batchId);
      assertFound(batch);
    }
    writeAuditEvent(actorUser, 'bird_batch.updated', batch, {
      changedFields: Object.keys(validated)
    });
    return batch;
  } catch (error) {
    return mapDuplicateWrite(error, validated.code);
  }
}

async function harvestBatch(actorUser, businessId, farmId, batchId, harvestData = {}) {
  const existing = await repository.findById(businessId, farmId, batchId);
  assertFound(existing);
  assertPolicy(await policy.canUpdateBatch(actorUser, businessId, existing));

  const additionalUpdates =
    harvestData && Object.keys(harvestData).length > 0
      ? validator.validateUpdate(harvestData)
      : {};
  const batch = await repository.updateById(
    businessId,
    farmId,
    batchId,
    { ...additionalUpdates, status: 'completed', actualHarvestAt: new Date() },
    actorId(actorUser)
  );
  assertFound(batch);
  writeAuditEvent(actorUser, 'bird_batch.harvested', batch);
  return batch;
}

module.exports = {
  BirdBatchServiceError,
  createBatch,
  getBatch,
  listFarmBatches,
  updateBatch,
  harvestBatch
};
