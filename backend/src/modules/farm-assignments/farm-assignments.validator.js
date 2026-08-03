const ALLOWED_FIELDS = new Set([
  'userId',
  'startsAt',
  'endsAt',
  'notes'
]);

class FarmAssignmentValidationError extends Error {
  constructor(details) {
    super('Farm assignment request validation failed');
    this.name = 'FarmAssignmentValidationError';
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function isPresent(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function validDate(value) {
  return isPresent(value) && !Number.isNaN(new Date(value).getTime());
}

function validatePayload(payload, { partial }) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const fields = Object.keys(value);
  const errors = [];

  for (const field of fields) {
    if (!ALLOWED_FIELDS.has(field)) errors.push(`${field} is not an allowed field`);
  }
  if (partial && fields.length === 0) errors.push('At least one field must be provided');

  if (!partial || Object.hasOwn(value, 'userId')) {
    if (!isPresent(value.userId)) errors.push('userId is required');
  }
  if (!partial || Object.hasOwn(value, 'startsAt')) {
    if (!validDate(value.startsAt)) errors.push('startsAt must be a valid date');
  }

  if (Object.hasOwn(value, 'endsAt')) {
    if (!validDate(value.endsAt)) {
      errors.push('endsAt must be a valid date');
    } else if (validDate(value.startsAt) && new Date(value.endsAt) <= new Date(value.startsAt)) {
      errors.push('endsAt must be after startsAt');
    }
  }

  if (errors.length > 0) throw new FarmAssignmentValidationError(errors);

  const sanitized = {};
  for (const field of fields) {
    if (ALLOWED_FIELDS.has(field)) sanitized[field] = value[field];
  }
  return sanitized;
}

function validateCreate(payload) {
  return validatePayload(payload, { partial: false });
}

function validateUpdate(payload) {
  return validatePayload(payload, { partial: true });
}

module.exports = {
  FarmAssignmentValidationError,
  validateCreate,
  validateUpdate
};
