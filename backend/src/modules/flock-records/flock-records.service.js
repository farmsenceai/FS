const mongoose = require('mongoose');
const withTransaction = require('../../shared/db/transactionHelper');
const repository = require('./flock-records.repository');
// Accepted cross-module dependency: flock writes and the bird-count cache must
// commit together through the same MongoDB session.
const birdBatchesRepository = require('../bird-batches/bird-batches.repository');
const policy = require('./flock-records.policy');
const validator = require('./flock-records.validator');
const { isBusiness } = require('../../shared/auth/roleAccess');

class FlockRecordServiceError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = 'FlockRecordServiceError';
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
    throw new FlockRecordServiceError(
      'You are not allowed to perform this action',
      'POLICY_DENIED',
      403
    );
  }
}

function assertBatchFound(batch) {
  if (!batch) throw new FlockRecordServiceError('Bird batch not found', 'NOT_FOUND', 404);
}

function assertRecordFound(record) {
  if (!record) throw new FlockRecordServiceError('Flock record not found', 'NOT_FOUND', 404);
}

function sameInstant(left, right) {
  return new Date(left).getTime() === new Date(right).getTime();
}

function assertCountsFitBatch(validated, batch) {
  const losses = Number(validated.mortality?.count || 0) + Number(validated.culls?.count || 0);
  const capacity = Number(batch.initialBirdCount || 0);
  if (losses > capacity) {
    throw new FlockRecordServiceError(
      'Mortality and cull counts cannot exceed the batch initial bird count',
      'VALIDATION_ERROR',
      400
    );
  }
}

function mapDuplicateWrite(error) {
  if (error?.code !== 11000) throw error;
  throw new FlockRecordServiceError(
    'A primary or correction record already exists for this batch and operational date',
    'CONFLICT',
    409
  );
}

function writeAuditEvent(actorUser, action, record, metadata = {}) {
  // TODO: replace with real audit_events write once that module exists
  console.log({
    event: 'audit_event',
    occurredAt: new Date().toISOString(),
    actor: { type: 'user', id: actorId(actorUser) },
    action,
    entity: { type: 'flock_record', id: record._id },
    outcome: 'success',
    metadata
  });
}

async function submitDailyRecord(actorUser, businessId, farmId, batchId, payload) {
  assertPolicy(await policy.canCreateFlockRecord(actorUser, businessId, farmId));
  const validated = validator.validate(payload);

  try {
    const record = await withTransaction(mongoose.connection, async session => {
      const batch = await birdBatchesRepository.findById(
        businessId,
        farmId,
        batchId,
        { session }
      );
      assertBatchFound(batch);
      assertCountsFitBatch(validated, batch);

      const existing = await repository.findForBatchAndDate(
        businessId,
        farmId,
        batchId,
        validated.recordDate,
        { session }
      );
      if (existing) {
        throw new FlockRecordServiceError(
          'A primary flock record already exists for this batch and operational date',
          'CONFLICT',
          409
        );
      }

      const created = await repository.create(
        businessId,
        farmId,
        batchId,
        { ...validated, createdBy: actorId(actorUser) },
        { session }
      );
      const recalculatedBatch = await birdBatchesRepository.recalculateCurrentBirdCount(
        businessId,
        farmId,
        batchId,
        { session }
      );
      assertBatchFound(recalculatedBatch);
      return created;
    });

    writeAuditEvent(actorUser, 'flock_record.submitted', record);
    return record;
  } catch (error) {
    return mapDuplicateWrite(error);
  }
}

async function listBatchRecords(actorUser, businessId, farmId, batchId, filters = {}) {
  assertPolicy(await policy.canReadFlockRecords(actorUser, businessId, farmId));
  if (isBusiness(actorUser)) return repository.listForBusinessRole(farmId, batchId, filters);
  return repository.listForBatch(businessId, farmId, batchId, filters);
}

async function correctRecord(
  actorUser,
  businessId,
  farmId,
  batchId,
  originalRecordId,
  correctionPayload
) {
  assertPolicy(await policy.canCreateFlockRecord(actorUser, businessId, farmId));
  const validated = validator.validate(correctionPayload);

  try {
    const record = await withTransaction(mongoose.connection, async session => {
      const batch = await birdBatchesRepository.findById(
        businessId,
        farmId,
        batchId,
        { session }
      );
      assertBatchFound(batch);
      assertCountsFitBatch(validated, batch);

      const original = await repository.findById(
        businessId,
        farmId,
        batchId,
        originalRecordId,
        { session }
      );
      assertRecordFound(original);
      if (!sameInstant(validated.recordDate, original.recordDate)) {
        throw new FlockRecordServiceError(
          'A correction must use the same operational date as the original record',
          'VALIDATION_ERROR',
          400
        );
      }

      const correction = await repository.createCorrection(
        businessId,
        farmId,
        batchId,
        originalRecordId,
        validated,
        actorId(actorUser),
        { session }
      );
      const recalculatedBatch = await birdBatchesRepository.recalculateCurrentBirdCount(
        businessId,
        farmId,
        batchId,
        { session }
      );
      assertBatchFound(recalculatedBatch);
      return correction;
    });

    writeAuditEvent(actorUser, 'flock_record.corrected', record, { originalRecordId });
    return record;
  } catch (error) {
    return mapDuplicateWrite(error);
  }
}

module.exports = {
  FlockRecordServiceError,
  submitDailyRecord,
  listBatchRecords,
  correctRecord
};
