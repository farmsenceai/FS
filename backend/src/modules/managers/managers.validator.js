const mongoose = require('mongoose');

const MANAGER_FIELDS = new Set(['name', 'email', 'phone', 'title', 'status', 'notes']);
const ASSIGNMENT_FIELDS = new Set(['managerId', 'startsAt']);
const STATUSES = new Set(['active', 'inactive']);

class ManagerValidationError extends Error {
  constructor(details) {
    super('Manager request validation failed');
    this.code = 'VALIDATION_ERROR';
    this.status = 400;
    this.details = details;
  }
}

function manager(payload, partial = false) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const errors = [];
  const fields = Object.keys(value);
  fields.filter(field => !MANAGER_FIELDS.has(field)).forEach(field => errors.push(`${field} is not allowed`));
  if (partial && fields.length === 0) errors.push('At least one field must be provided');
  if ((!partial || Object.hasOwn(value, 'name')) &&
      (typeof value.name !== 'string' || !value.name.trim())) errors.push('name is required');
  if (Object.hasOwn(value, 'email') && value.email !== '' &&
      (typeof value.email !== 'string' || !/^\S+@\S+\.\S+$/.test(value.email))) errors.push('email must be valid');
  if (Object.hasOwn(value, 'status') && !STATUSES.has(value.status)) errors.push('status must be active or inactive');
  if (errors.length) throw new ManagerValidationError(errors);
  const result = {};
  fields.filter(field => MANAGER_FIELDS.has(field)).forEach(field => { result[field] = value[field]; });
  for (const field of ['name', 'email', 'phone', 'title', 'notes']) {
    if (typeof result[field] === 'string') result[field] = result[field].trim();
  }
  if (result.email === '') delete result.email;
  return result;
}

function assignment(payload) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const errors = [];
  Object.keys(value).filter(field => !ASSIGNMENT_FIELDS.has(field)).forEach(field => errors.push(`${field} is not allowed`));
  if (!mongoose.isValidObjectId(value.managerId)) errors.push('managerId must be a valid ObjectId');
  if (value.startsAt !== undefined && Number.isNaN(new Date(value.startsAt).getTime())) errors.push('startsAt must be a valid date');
  if (errors.length) throw new ManagerValidationError(errors);
  return { managerId: value.managerId, ...(value.startsAt ? { startsAt: new Date(value.startsAt) } : {}) };
}

module.exports = {
  ManagerValidationError,
  validateCreate: payload => manager(payload),
  validateUpdate: payload => manager(payload, true),
  validateAssignment: assignment
};
