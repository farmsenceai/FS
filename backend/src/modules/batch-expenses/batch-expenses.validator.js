const mongoose = require('mongoose');
const { normalizeMoney } = require('../../shared/finance/decimal');

const CATEGORIES = new Set(['feed', 'chicks', 'labor', 'medicine_vaccines', 'utilities', 'transport', 'other']);
const ALLOWED_FIELDS = new Set(['batchId', 'category', 'amount', 'expenseDate', 'description']);

class BatchExpenseValidationError extends Error {
  constructor(details) { super('Batch expense request validation failed'); this.code = 'VALIDATION_ERROR'; this.status = 400; this.details = details; }
}
function validDate(value) { return value !== undefined && value !== null && !Number.isNaN(new Date(value).getTime()); }
function validate(payload, { partial }) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const fields = Object.keys(value);
  const errors = [];
  for (const field of fields) if (!ALLOWED_FIELDS.has(field)) errors.push(`${field} is not an allowed field`);
  if (partial && fields.length === 0) errors.push('At least one field must be provided');
  if (!partial && !Object.hasOwn(value, 'batchId')) errors.push('batchId is required; use null explicitly for a shared farm expense');
  if (Object.hasOwn(value, 'batchId') && value.batchId !== null && !mongoose.isObjectIdOrHexString(value.batchId)) errors.push('batchId must be a valid ObjectId string or null for a shared farm expense');
  if (!partial || Object.hasOwn(value, 'category')) if (!CATEGORIES.has(value.category)) errors.push(`category must be one of: ${[...CATEGORIES].join(', ')}`);
  let amount;
  if (!partial || Object.hasOwn(value, 'amount')) {
    try { amount = normalizeMoney(value.amount); } catch (error) { errors.push(error.message); }
  }
  if (!partial || Object.hasOwn(value, 'expenseDate')) if (!validDate(value.expenseDate)) errors.push('expenseDate must be a valid date');
  if (!partial || Object.hasOwn(value, 'description')) if (typeof value.description !== 'string' || !value.description.trim()) errors.push('description is required');
  if (errors.length) throw new BatchExpenseValidationError(errors);
  const sanitized = {};
  for (const field of fields) if (ALLOWED_FIELDS.has(field)) sanitized[field] = value[field];
  if (amount !== undefined) sanitized.amount = amount;
  if (typeof sanitized.description === 'string') sanitized.description = sanitized.description.trim();
  return sanitized;
}
module.exports = { BatchExpenseValidationError, validateCreate: payload => validate(payload, { partial: false }), validateUpdate: payload => validate(payload, { partial: true }) };
