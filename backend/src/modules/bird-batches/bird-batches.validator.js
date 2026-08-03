const mongoose = require('mongoose');

const BIRD_TYPES = new Set(['broiler', 'layer', 'breeder']);
const STATUSES = new Set(['planned', 'active', 'completed', 'terminated']);
const ALLOWED_FIELDS = new Set([
  'facilityId',
  'breed',
  'birdType',
  'initialBirdCount',
  'placedAt',
  'expectedHarvestAt',
  'status',
  'sourceHatchery',
  'notes'
]);

class BirdBatchValidationError extends Error {
  constructor(details) {
    super('Bird batch request validation failed');
    this.name = 'BirdBatchValidationError';
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validDate(value) {
  return value !== undefined && value !== null && !Number.isNaN(new Date(value).getTime());
}

function validatePayload(payload, { partial }) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const fields = Object.keys(value);
  const errors = [];

  for (const field of fields) {
    if (!ALLOWED_FIELDS.has(field)) errors.push(`${field} is not an allowed field`);
  }
  if (partial && fields.length === 0) errors.push('At least one field must be provided');

  for (const field of ['breed']) {
    if (!partial || Object.hasOwn(value, field)) {
      if (!isNonEmptyString(value[field])) errors.push(`${field} is required`);
    }
  }
  if (!partial || Object.hasOwn(value, 'facilityId')) {
    if (!mongoose.isObjectIdOrHexString(value.facilityId)) {
      errors.push('facilityId must be a valid ObjectId string');
    }
  }
  if (!partial || Object.hasOwn(value, 'birdType')) {
    if (!BIRD_TYPES.has(value.birdType)) {
      errors.push(`birdType must be one of: ${[...BIRD_TYPES].join(', ')}`);
    }
  }
  if (!partial || Object.hasOwn(value, 'initialBirdCount')) {
    if (!Number.isInteger(value.initialBirdCount) || value.initialBirdCount <= 0) {
      errors.push('initialBirdCount must be an integer greater than 0');
    }
  }
  if (!partial || Object.hasOwn(value, 'placedAt')) {
    if (!validDate(value.placedAt)) errors.push('placedAt must be a valid date');
  }
  if (Object.hasOwn(value, 'expectedHarvestAt') && !validDate(value.expectedHarvestAt)) {
    errors.push('expectedHarvestAt must be a valid date');
  }
  if (Object.hasOwn(value, 'status') && !STATUSES.has(value.status)) {
    errors.push(`status must be one of: ${[...STATUSES].join(', ')}`);
  }

  if (errors.length > 0) throw new BirdBatchValidationError(errors);

  const sanitized = {};
  for (const field of fields) {
    if (ALLOWED_FIELDS.has(field)) sanitized[field] = value[field];
  }
  if (sanitized.breed) sanitized.breed = sanitized.breed.trim();
  return sanitized;
}

function validateCreate(payload) {
  return validatePayload(payload, { partial: false });
}

function validateUpdate(payload) {
  return validatePayload(payload, { partial: true });
}

module.exports = { BirdBatchValidationError, validateCreate, validateUpdate };
