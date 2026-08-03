const mongoose = require('mongoose');
const { normalizeNonNegativeMoney, normalizeWeight, calculateRevenue } = require('../../shared/finance/decimal');

const ALLOWED_FIELDS = new Set(['batchId', 'saleDate', 'quantitySold', 'avgWeightKg', 'pricePerKg', 'buyerName', 'notes']);

class BatchSaleValidationError extends Error {
  constructor(details) {
    super('Batch sale request validation failed');
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function validDate(value) {
  return value !== undefined && value !== null && !Number.isNaN(new Date(value).getTime());
}

function validate(payload, { partial }) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const fields = Object.keys(value);
  const errors = [];
  for (const field of fields) if (!ALLOWED_FIELDS.has(field)) errors.push(`${field} is not an allowed field`);
  if (partial && fields.length === 0) errors.push('At least one field must be provided');
  if (!partial || Object.hasOwn(value, 'batchId')) {
    if (!mongoose.isObjectIdOrHexString(value.batchId)) errors.push('batchId must be a valid ObjectId string');
  }
  if (!partial || Object.hasOwn(value, 'saleDate')) {
    if (!validDate(value.saleDate)) errors.push('saleDate must be a valid date');
  }
  if (!partial || Object.hasOwn(value, 'quantitySold')) {
    if (!Number.isInteger(value.quantitySold) || value.quantitySold <= 0) errors.push('quantitySold must be an integer greater than 0');
  }
  let avgWeightKg;
  if (!partial || Object.hasOwn(value, 'avgWeightKg')) {
    try { avgWeightKg = normalizeWeight(value.avgWeightKg); } catch (error) { errors.push(error.message); }
  }
  let pricePerKg;
  if (!partial || Object.hasOwn(value, 'pricePerKg')) {
    try { pricePerKg = normalizeNonNegativeMoney(value.pricePerKg, 'pricePerKg'); } catch (error) { errors.push(error.message); }
  }
  for (const field of ['buyerName', 'notes']) {
    if (Object.hasOwn(value, field) && value[field] !== null && typeof value[field] !== 'string') errors.push(`${field} must be a string`);
  }
  if (errors.length) throw new BatchSaleValidationError(errors);

  const sanitized = {};
  for (const field of fields) if (ALLOWED_FIELDS.has(field)) sanitized[field] = value[field];
  if (avgWeightKg !== undefined) sanitized.avgWeightKg = avgWeightKg;
  if (pricePerKg !== undefined) sanitized.pricePerKg = pricePerKg;
  for (const field of ['buyerName', 'notes']) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].trim();
      if (!sanitized[field]) delete sanitized[field];
    }
  }
  return sanitized;
}

function withRevenue(data) {
  return { ...data, revenue: calculateRevenue(data.quantitySold, data.avgWeightKg, data.pricePerKg) };
}

module.exports = {
  BatchSaleValidationError,
  validateCreate: payload => withRevenue(validate(payload, { partial: false })),
  validateUpdate: payload => validate(payload, { partial: true }),
  withRevenue
};
