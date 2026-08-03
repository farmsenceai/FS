const mongoose = require('mongoose');

const FACILITY_TYPES = new Set([
  'shed',
  'house',
  'feed_store',
  'medicine_store',
  'water_system',
  'utility',
  'office',
  'other'
]);
const STATUSES = new Set(['active', 'maintenance', 'inactive']);
const NON_NEGATIVE_GROUPS = {
  dimensions: ['lengthM', 'widthM', 'heightM'],
  environmentTargets: [
    'temperatureMin',
    'temperatureMax',
    'humidityMin',
    'humidityMax',
    'ammoniaMax',
    'co2Max'
  ]
};
const ALLOWED_FIELDS = new Set([
  'code',
  'name',
  'type',
  'parentFacilityId',
  'status',
  'capacity',
  'dimensions',
  'geo',
  'environmentTargets',
  'metadata'
]);

class FacilityValidationError extends Error {
  constructor(details) {
    super('Facility request validation failed');
    this.name = 'FacilityValidationError';
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateNonNegativeGroups(value, errors) {
  for (const [group, fields] of Object.entries(NON_NEGATIVE_GROUPS)) {
    if (!Object.hasOwn(value, group)) continue;
    if (!value[group] || typeof value[group] !== 'object' || Array.isArray(value[group])) {
      errors.push(`${group} must be an object`);
      continue;
    }
    for (const field of fields) {
      const candidate = value[group][field];
      if (candidate !== undefined && (!Number.isFinite(candidate) || candidate < 0)) {
        errors.push(`${group}.${field} must be a non-negative number`);
      }
    }
  }
}

function validatePayload(payload, { partial }) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const fields = Object.keys(value);
  const errors = [];

  for (const field of fields) {
    if (!ALLOWED_FIELDS.has(field)) errors.push(`${field} is not an allowed field`);
  }
  if (partial && fields.length === 0) errors.push('At least one field must be provided');

  for (const field of ['code', 'name']) {
    if (!partial || Object.hasOwn(value, field)) {
      if (!isNonEmptyString(value[field])) errors.push(`${field} is required`);
    }
  }
  if (!partial || Object.hasOwn(value, 'type')) {
    if (!FACILITY_TYPES.has(value.type)) {
      errors.push(`type must be one of: ${[...FACILITY_TYPES].join(', ')}`);
    }
  }
  if (Object.hasOwn(value, 'status') && !STATUSES.has(value.status)) {
    errors.push(`status must be one of: ${[...STATUSES].join(', ')}`);
  }
  if (
    value.parentFacilityId !== undefined &&
    value.parentFacilityId !== null &&
    !mongoose.isObjectIdOrHexString(value.parentFacilityId)
  ) {
    errors.push('parentFacilityId must be a valid ObjectId string');
  }

  validateNonNegativeGroups(value, errors);

  if (errors.length > 0) throw new FacilityValidationError(errors);

  const sanitized = {};
  for (const field of fields) {
    if (ALLOWED_FIELDS.has(field)) sanitized[field] = value[field];
  }
  if (sanitized.code) sanitized.code = sanitized.code.trim().toUpperCase();
  if (sanitized.name) sanitized.name = sanitized.name.trim();
  return sanitized;
}

function validateCreate(payload) {
  return validatePayload(payload, { partial: false });
}

function validateUpdate(payload) {
  return validatePayload(payload, { partial: true });
}

module.exports = { FacilityValidationError, validateCreate, validateUpdate };
