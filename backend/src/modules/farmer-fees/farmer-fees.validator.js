const mongoose = require('mongoose');
const CREATE_FIELDS = new Set(['farmerId', 'farmId', 'amount', 'currency', 'description', 'status', 'dueDate']);
const UPDATE_FIELDS = new Set(['farmerId', 'farmId', 'amount', 'currency', 'description', 'dueDate']);
const PAID_FIELDS = new Set(['paidAt', 'paymentReference']);

class FarmerFeeValidationError extends Error {
  constructor(details) { super('Farmer fee request validation failed'); this.code = 'VALIDATION_ERROR'; this.status = 400; this.details = details; }
}
function validate(payload, fields, partial = false) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const keys = Object.keys(value); const errors = [];
  keys.filter(key => !fields.has(key)).forEach(key => errors.push(`${key} is not allowed`));
  if (partial && !keys.length) errors.push('At least one field must be provided');
  if ((!partial || Object.hasOwn(value, 'farmerId')) && !mongoose.isValidObjectId(value.farmerId)) errors.push('farmerId must be a valid ObjectId');
  if ((!partial || Object.hasOwn(value, 'farmId')) && !mongoose.isValidObjectId(value.farmId)) errors.push('farmId must be a valid ObjectId');
  if ((!partial || Object.hasOwn(value, 'amount')) && (!Number.isFinite(value.amount) || value.amount <= 0)) errors.push('amount must be greater than 0');
  if ((!partial || Object.hasOwn(value, 'description')) && (typeof value.description !== 'string' || !value.description.trim())) errors.push('description is required');
  if (value.status !== undefined && value.status !== 'pending') errors.push('new fees must have pending status');
  if (value.dueDate !== undefined && Number.isNaN(new Date(value.dueDate).getTime())) errors.push('dueDate must be a valid date');
  if (errors.length) throw new FarmerFeeValidationError(errors);
  const result = {}; keys.filter(key => fields.has(key)).forEach(key => { result[key] = value[key]; });
  if (result.description) result.description = result.description.trim();
  if (result.currency) result.currency = result.currency.trim().toUpperCase();
  if (result.dueDate) result.dueDate = new Date(result.dueDate);
  return result;
}
function validateMarkPaid(payload) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const errors = [];
  Object.keys(value).filter(key => !PAID_FIELDS.has(key)).forEach(key => errors.push(`${key} is not allowed`));
  if (value.paidAt !== undefined && Number.isNaN(new Date(value.paidAt).getTime())) errors.push('paidAt must be a valid date');
  if (value.paymentReference !== undefined && typeof value.paymentReference !== 'string') errors.push('paymentReference must be a string');
  if (errors.length) throw new FarmerFeeValidationError(errors);
  return { paidAt: value.paidAt ? new Date(value.paidAt) : new Date(),
    ...(value.paymentReference !== undefined ? { paymentReference: value.paymentReference.trim() } : {}) };
}
module.exports = { FarmerFeeValidationError,
  validateCreate: payload => validate(payload, CREATE_FIELDS),
  validateUpdate: payload => validate(payload, UPDATE_FIELDS, true), validateMarkPaid };
