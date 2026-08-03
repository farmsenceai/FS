const repository = require('./facilities.repository');
const policy = require('./facilities.policy');
const validator = require('./facilities.validator');
const { isBusiness } = require('../../shared/auth/roleAccess');

class FacilityServiceError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = 'FacilityServiceError';
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
    throw new FacilityServiceError(
      'You are not allowed to perform this action',
      'POLICY_DENIED',
      403
    );
  }
}

function assertFound(facility) {
  if (!facility) throw new FacilityServiceError('Facility not found', 'NOT_FOUND', 404);
}

function assertParentBelongsToFarm(parent, businessId, farmId) {
  if (
    !parent ||
    String(parent.businessId) !== String(businessId) ||
    String(parent.farmId) !== String(farmId)
  ) {
    throw new FacilityServiceError(
      'Parent facility does not exist in this organization and farm',
      'VALIDATION_ERROR',
      400
    );
  }
}

async function verifyParent(businessId, farmId, parentFacilityId, facilityId) {
  if (parentFacilityId === undefined || parentFacilityId === null) return;
  if (facilityId && String(parentFacilityId) === String(facilityId)) {
    throw new FacilityServiceError(
      'A facility cannot be its own parent',
      'VALIDATION_ERROR',
      400
    );
  }
  const parent = await repository.findById(businessId, farmId, parentFacilityId);
  assertParentBelongsToFarm(parent, businessId, farmId);
}

function mapDuplicateWrite(error, code) {
  if (error?.code !== 11000) throw error;
  throw new FacilityServiceError(`Facility code '${code}' already exists`, 'CONFLICT', 409);
}

function writeAuditEvent(actorUser, action, facility, metadata = {}) {
  // TODO: replace with real audit_events write once that module exists
  console.log({
    event: 'audit_event',
    occurredAt: new Date().toISOString(),
    actor: { type: 'user', id: actorId(actorUser) },
    action,
    entity: { type: 'facility', id: facility._id },
    outcome: 'success',
    metadata
  });
}

async function createFacility(actorUser, businessId, farmId, payload) {
  assertPolicy(await policy.canCreateFacility(actorUser, businessId));
  const validated = validator.validateCreate(payload);
  await verifyParent(businessId, farmId, validated.parentFacilityId);

  const existing = await repository.findByCode(businessId, farmId, validated.code);
  if (existing) {
    throw new FacilityServiceError(
      `Facility code '${validated.code}' already exists`,
      'CONFLICT',
      409
    );
  }

  try {
    const facility = await repository.create(businessId, farmId, {
      ...validated,
      createdBy: actorId(actorUser)
    });
    writeAuditEvent(actorUser, 'facility.created', facility);
    return facility;
  } catch (error) {
    return mapDuplicateWrite(error, validated.code);
  }
}

async function getFacility(actorUser, businessId, farmId, facilityId) {
  const facility = isBusiness(actorUser)
    ? await repository.findByIdForBusinessRole(farmId, facilityId)
    : await repository.findById(businessId, farmId, facilityId);
  assertFound(facility);
  assertPolicy(await policy.canReadFacility(actorUser, businessId, facility));
  return facility;
}

async function listFarmFacilities(actorUser, businessId, farmId, filters = {}) {
  assertPolicy(await policy.canReadFacility(actorUser, businessId, { farmId }));
  if (isBusiness(actorUser)) return repository.listForBusinessRole(farmId, filters);
  return repository.listForFarm(businessId, farmId, filters);
}

async function updateFacility(actorUser, businessId, farmId, facilityId, payload) {
  const existing = await repository.findById(businessId, farmId, facilityId);
  assertFound(existing);
  assertPolicy(await policy.canUpdateFacility(actorUser, businessId, existing));
  const validated = validator.validateUpdate(payload);

  if (Object.hasOwn(validated, 'parentFacilityId')) {
    await verifyParent(businessId, farmId, validated.parentFacilityId, facilityId);
  }
  if (validated.code) {
    const codeOwner = await repository.findByCode(businessId, farmId, validated.code);
    if (codeOwner && String(codeOwner._id) !== String(existing._id)) {
      throw new FacilityServiceError(
        `Facility code '${validated.code}' already exists`,
        'CONFLICT',
        409
      );
    }
  }

  try {
    const facility = await repository.updateById(
      businessId,
      farmId,
      facilityId,
      validated,
      actorId(actorUser)
    );
    assertFound(facility);
    writeAuditEvent(actorUser, 'facility.updated', facility, {
      changedFields: Object.keys(validated)
    });
    return facility;
  } catch (error) {
    return mapDuplicateWrite(error, validated.code);
  }
}

async function deleteFacility(actorUser, businessId, farmId, facilityId) {
  const existing = await repository.findById(businessId, farmId, facilityId);
  assertFound(existing);
  assertPolicy(await policy.canDeleteFacility(actorUser, businessId, existing));

  const facility = await repository.softDeleteById(
    businessId,
    farmId,
    facilityId,
    actorId(actorUser)
  );
  assertFound(facility);
  writeAuditEvent(actorUser, 'facility.deleted', facility);
  return facility;
}

module.exports = {
  FacilityServiceError,
  createFacility,
  getFacility,
  listFarmFacilities,
  updateFacility,
  deleteFacility
};
