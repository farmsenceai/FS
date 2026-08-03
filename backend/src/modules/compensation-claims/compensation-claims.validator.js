const { normalizeMoney } = require('../../shared/finance/decimal');

const CLAIM_FIELDS = new Set(['amount', 'serviceDate', 'description']);
const REVIEW_FIELDS = new Set(['status', 'reviewerNote', 'paymentReference']);

class CompensationClaimValidationError extends Error {
  constructor(details) {
    super('Compensation claim request validation failed');
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function dateOnly(value, errors) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())) {
    errors.push('serviceDate must use YYYY-MM-DD');
    return undefined;
  }
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (parsed.getTime() > todayUtc) errors.push('serviceDate cannot be in the future');
  return parsed;
}

function claim(payload, partial) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const fields = Object.keys(value);
  const errors = [];
  fields.forEach(field => { if (!CLAIM_FIELDS.has(field)) errors.push(`${field} is not an allowed field`); });
  if (partial && !fields.length) errors.push('At least one field must be provided');
  let amount;
  if (!partial || Object.hasOwn(value, 'amount')) {
    try { amount = normalizeMoney(value.amount); } catch (error) { errors.push(error.message); }
  }
  let serviceDate;
  if (!partial || Object.hasOwn(value, 'serviceDate')) serviceDate = dateOnly(value.serviceDate, errors);
  if (!partial || Object.hasOwn(value, 'description')) {
    if (typeof value.description !== 'string' || !value.description.trim()) errors.push('description is required');
    else if (value.description.trim().length > 1000) errors.push('description must be no longer than 1000 characters');
  }
  if (errors.length) throw new CompensationClaimValidationError(errors);
  const result = {};
  if (amount !== undefined) result.amount = amount;
  if (serviceDate) result.serviceDate = serviceDate;
  if (Object.hasOwn(value, 'description')) result.description = value.description.trim();
  return result;
}

function review(payload) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const errors = [];
  Object.keys(value).forEach(field => { if (!REVIEW_FIELDS.has(field)) errors.push(`${field} is not an allowed field`); });
  if (!['approved', 'rejected', 'paid'].includes(value.status)) errors.push('status must be approved, rejected, or paid');
  if (value.reviewerNote !== undefined && (typeof value.reviewerNote !== 'string' || value.reviewerNote.trim().length > 1000)) errors.push('reviewerNote must be text no longer than 1000 characters');
  if (value.paymentReference !== undefined && (typeof value.paymentReference !== 'string' || value.paymentReference.trim().length > 200)) errors.push('paymentReference must be text no longer than 200 characters');
  if (value.status === 'rejected' && !String(value.reviewerNote || '').trim()) errors.push('reviewerNote is required when rejecting a claim');
  if (value.status === 'paid' && !String(value.paymentReference || '').trim()) errors.push('paymentReference is required when marking a claim paid');
  if (errors.length) throw new CompensationClaimValidationError(errors);
  return {
    status: value.status,
    reviewerNote: String(value.reviewerNote || '').trim(),
    paymentReference: String(value.paymentReference || '').trim() || undefined
  };
}

module.exports = {
  CompensationClaimValidationError,
  validateCreate: payload => claim(payload, false),
  validateUpdate: payload => claim(payload, true),
  validateReview: review
};
