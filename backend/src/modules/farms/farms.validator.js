const FARM_TYPES = new Set(['broiler', 'layer', 'breeder', 'mixed']);
const STATUSES = new Set(['planned', 'active', 'inactive', 'closed']);
const COUNTRY_CODE_PATTERN = /^[A-Za-z]{2}$/;
const ALLOWED_FIELDS = new Set([
  'code',
  'name',
  'status',
  'location',
  'capacity',
  'farmType',
  'contacts',
  'openedAt',
  'expectedTenureEndDate',
  'closedAt',
  'tags'
]);

class FarmValidationError extends Error {
  constructor(details) {
    super('Farm request validation failed');
    this.name = 'FarmValidationError';
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateCoordinates(coordinates, errors) {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !coordinates.every(Number.isFinite)
  ) {
    errors.push('location.geo.coordinates must be a [longitude, latitude] number pair');
    return;
  }
  const [longitude, latitude] = coordinates;
  if (longitude < -180 || longitude > 180) {
    errors.push('location.geo.coordinates longitude must be between -180 and 180');
  }
  if (latitude < -90 || latitude > 90) {
    errors.push('location.geo.coordinates latitude must be between -90 and 90');
  }
}

function validateLocation(location, { partial }, errors) {
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    errors.push('location must be an object');
    return;
  }

  for (const field of ['address', 'countryCode', 'timezone']) {
    if (!partial || Object.hasOwn(location, field)) {
      if (!isNonEmptyString(location[field])) errors.push(`location.${field} is required`);
    }
  }

  if (
    Object.hasOwn(location, 'countryCode') &&
    isNonEmptyString(location.countryCode) &&
    !COUNTRY_CODE_PATTERN.test(location.countryCode)
  ) {
    errors.push('location.countryCode must be a 2-letter ISO country code');
  }

  if (Object.hasOwn(location, 'stateProvince') && !isNonEmptyString(location.stateProvince)) {
    errors.push('location.stateProvince must be a non-empty string');
  }

  if (Object.hasOwn(location, 'geo')) {
    if (!location.geo || typeof location.geo !== 'object' || Array.isArray(location.geo)) {
      errors.push('location.geo must be an object');
    } else if (Object.hasOwn(location.geo, 'coordinates')) {
      validateCoordinates(location.geo.coordinates, errors);
    } else {
      errors.push('location.geo.coordinates is required when location.geo is provided');
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

  if (!partial || Object.hasOwn(value, 'location')) {
    validateLocation(value.location, { partial }, errors);
  }

  if (!partial || Object.hasOwn(value, 'farmType')) {
    if (!FARM_TYPES.has(value.farmType)) {
      errors.push(`farmType must be one of: ${[...FARM_TYPES].join(', ')}`);
    }
  }

  if (Object.hasOwn(value, 'status') && !STATUSES.has(value.status)) {
    errors.push(`status must be one of: ${[...STATUSES].join(', ')}`);
  }

  if (value.capacity?.birdCapacity !== undefined) {
    if (!Number.isFinite(value.capacity.birdCapacity) || value.capacity.birdCapacity < 0) {
      errors.push('capacity.birdCapacity must be a non-negative number');
    }
  }

  if (Object.hasOwn(value, 'contacts') && !Array.isArray(value.contacts)) {
    errors.push('contacts must be an array');
  }
  if (Object.hasOwn(value, 'tags') && !Array.isArray(value.tags)) {
    errors.push('tags must be an array');
  }
  if (
    Object.hasOwn(value, 'expectedTenureEndDate') &&
    value.expectedTenureEndDate !== null &&
    Number.isNaN(new Date(value.expectedTenureEndDate).getTime())
  ) {
    errors.push('expectedTenureEndDate must be a valid date or null');
  }
  if (Object.hasOwn(value, 'openedAt') && value.openedAt !== null && Number.isNaN(new Date(value.openedAt).getTime())) {
    errors.push('openedAt must be a valid date or null');
  }

  if (errors.length > 0) throw new FarmValidationError(errors);

  const sanitized = {};
  for (const field of fields) {
    if (ALLOWED_FIELDS.has(field)) sanitized[field] = value[field];
  }
  if (sanitized.code) sanitized.code = sanitized.code.trim().toUpperCase();
  if (sanitized.name) sanitized.name = sanitized.name.trim();
  if (sanitized.location) {
    sanitized.location = { ...sanitized.location };
    if (sanitized.location.address) sanitized.location.address = sanitized.location.address.trim();
    if (sanitized.location.stateProvince) sanitized.location.stateProvince = sanitized.location.stateProvince.trim();
    if (sanitized.location.countryCode) {
      sanitized.location.countryCode = sanitized.location.countryCode.trim().toUpperCase();
    }
    if (sanitized.location.timezone) {
      sanitized.location.timezone = sanitized.location.timezone.trim();
    }
  }
  if (sanitized.expectedTenureEndDate !== undefined && sanitized.expectedTenureEndDate !== null) {
    sanitized.expectedTenureEndDate = new Date(sanitized.expectedTenureEndDate);
  }
  if (sanitized.openedAt !== undefined && sanitized.openedAt !== null) {
    sanitized.openedAt = new Date(sanitized.openedAt);
  }
  return sanitized;
}

function validateCreate(payload) {
  return validatePayload(payload, { partial: false });
}

function validateUpdate(payload) {
  return validatePayload(payload, { partial: true });
}

module.exports = { FarmValidationError, validateCreate, validateUpdate };
