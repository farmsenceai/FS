const ENTERED_VIA_VALUES = new Set(['manual', 'offline_sync', 'import']);
const SYNC_STATUSES = new Set(['draft', 'submitted', 'verified', 'locked']);
const SENSOR_SOURCES = new Set(['manual', 'sensor_device', 'estimated']);
const ALLOWED_FIELDS = new Set([
  'recordDate',
  'feed',
  'water',
  'mortality',
  'culls',
  'avgWeightGrams',
  'observations',
  'roi',
  'sensorReadings',
  'enteredVia',
  'syncStatus'
]);

class FlockRecordValidationError extends Error {
  constructor(details) {
    super('Flock record request validation failed');
    this.name = 'FlockRecordValidationError';
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function validateNonNegativeNumber(value, path, errors) {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    errors.push(`${path} must be a non-negative number`);
  }
}

function validateMaximum(value, maximum, path, errors) {
  if (value !== undefined && Number.isFinite(value) && value > maximum) {
    errors.push(`${path} must be no greater than ${maximum}`);
  }
}

function validateText(value, maximum, path, errors) {
  if (value !== undefined && (typeof value !== 'string' || value.trim().length > maximum)) {
    errors.push(`${path} must be text no longer than ${maximum} characters`);
  }
}

function validateCount(group, name, errors) {
  if (group === undefined) return;
  if (!group || typeof group !== 'object' || Array.isArray(group)) {
    errors.push(`${name} must be an object`);
    return;
  }
  if (
    group.count !== undefined &&
    (!Number.isInteger(group.count) || group.count < 0)
  ) {
    errors.push(`${name}.count must be a non-negative integer`);
  }
}

function validateMetricGroup(group, name, fields, errors) {
  if (group === undefined) return;
  if (!group || typeof group !== 'object' || Array.isArray(group)) {
    errors.push(`${name} must be an object`);
    return;
  }
  for (const field of fields) {
    validateNonNegativeNumber(group[field], `${name}.${field}`, errors);
  }
}

function validateAllowedNestedFields(group, name, allowedFields, errors) {
  if (group === undefined || !group || typeof group !== 'object' || Array.isArray(group)) return;
  for (const field of Object.keys(group)) {
    if (!allowedFields.includes(field)) errors.push(`${name}.${field} is not an allowed field`);
  }
}

function validate(payload) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const fields = Object.keys(value);
  const errors = [];

  for (const field of fields) {
    if (!ALLOWED_FIELDS.has(field)) errors.push(`${field} is not an allowed field`);
  }
  if (!value.recordDate || Number.isNaN(new Date(value.recordDate).getTime())) {
    errors.push('recordDate must be a valid date');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value.recordDate))) {
    errors.push('recordDate must use YYYY-MM-DD');
  } else {
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    if (new Date(`${value.recordDate}T00:00:00.000Z`).getTime() > todayUtc) {
      errors.push('recordDate cannot be in the future');
    }
  }

  validateCount(value.mortality, 'mortality', errors);
  validateCount(value.culls, 'culls', errors);
  validateMetricGroup(value.feed, 'feed', ['consumedKg', 'remainingStockKg'], errors);
  validateMetricGroup(value.water, 'water', ['consumedLiters'], errors);
  validateAllowedNestedFields(value.feed, 'feed', ['consumedKg', 'remainingStockKg'], errors);
  validateAllowedNestedFields(value.water, 'water', ['consumedLiters'], errors);
  validateAllowedNestedFields(value.mortality, 'mortality', ['count', 'cause'], errors);
  validateAllowedNestedFields(value.culls, 'culls', ['count', 'reason'], errors);
  validateNonNegativeNumber(value.avgWeightGrams, 'avgWeightGrams', errors);
  validateMaximum(value.avgWeightGrams, 100000, 'avgWeightGrams', errors);
  validateMetricGroup(value.roi, 'roi', ['reportedRevenue', 'reportedCost', 'reportedProfit'], errors);
  validateAllowedNestedFields(
    value.roi,
    'roi',
    ['reportedRevenue', 'reportedCost', 'reportedProfit', 'notes'],
    errors
  );
  validateMetricGroup(
    value.sensorReadings,
    'sensorReadings',
    ['temperatureC', 'humidityPct', 'ammoniaPpm', 'co2Ppm'],
    errors
  );
  validateAllowedNestedFields(
    value.sensorReadings,
    'sensorReadings',
    ['temperatureC', 'humidityPct', 'ammoniaPpm', 'co2Ppm', 'source'],
    errors
  );
  if (
    value.sensorReadings?.source !== undefined &&
    !SENSOR_SOURCES.has(value.sensorReadings.source)
  ) {
    errors.push(`sensorReadings.source must be one of: ${[...SENSOR_SOURCES].join(', ')}`);
  }
  validateMaximum(value.sensorReadings?.temperatureC, 60, 'sensorReadings.temperatureC', errors);
  validateMaximum(value.sensorReadings?.humidityPct, 100, 'sensorReadings.humidityPct', errors);
  validateMaximum(value.sensorReadings?.ammoniaPpm, 1000, 'sensorReadings.ammoniaPpm', errors);
  validateMaximum(value.sensorReadings?.co2Ppm, 100000, 'sensorReadings.co2Ppm', errors);
  validateText(value.mortality?.cause, 300, 'mortality.cause', errors);
  validateText(value.culls?.reason, 300, 'culls.reason', errors);
  validateText(value.observations, 2000, 'observations', errors);
  validateText(value.roi?.notes, 1000, 'roi.notes', errors);

  if (value.enteredVia !== undefined && !ENTERED_VIA_VALUES.has(value.enteredVia)) {
    errors.push(`enteredVia must be one of: ${[...ENTERED_VIA_VALUES].join(', ')}`);
  }
  if (value.syncStatus !== undefined && !SYNC_STATUSES.has(value.syncStatus)) {
    errors.push(`syncStatus must be one of: ${[...SYNC_STATUSES].join(', ')}`);
  }

  if (errors.length > 0) throw new FlockRecordValidationError(errors);

  const sanitized = {};
  for (const field of fields) {
    if (ALLOWED_FIELDS.has(field)) sanitized[field] = value[field];
  }
  if (sanitized.recordDate) sanitized.recordDate = `${sanitized.recordDate}T00:00:00.000Z`;
  return sanitized;
}

module.exports = { FlockRecordValidationError, validate };
