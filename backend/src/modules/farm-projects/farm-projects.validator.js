const mongoose = require('mongoose');
const PROJECT_FIELDS = new Set(['title', 'description', 'status', 'priority', 'startDate', 'targetDate', 'completedAt', 'percentComplete', 'managerIds']);
const UPDATE_FIELDS = new Set(['projectId', 'note']);
const STATUSES = new Set(['planned', 'in_progress', 'blocked', 'completed', 'cancelled']);
const PRIORITIES = new Set(['low', 'medium', 'high']);

class FarmProjectValidationError extends Error {
  constructor(details) { super('Farm project request validation failed'); this.code = 'VALIDATION_ERROR'; this.status = 400; this.details = details; }
}
function project(payload, partial = false) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const fields = Object.keys(value); const errors = [];
  fields.filter(field => !PROJECT_FIELDS.has(field)).forEach(field => errors.push(`${field} is not allowed`));
  if (partial && !fields.length) errors.push('At least one field must be provided');
  if ((!partial || Object.hasOwn(value, 'title')) && (typeof value.title !== 'string' || !value.title.trim())) errors.push('title is required');
  if (value.status !== undefined && !STATUSES.has(value.status)) errors.push('status is invalid');
  if (value.priority !== undefined && !PRIORITIES.has(value.priority)) errors.push('priority is invalid');
  if (value.percentComplete !== undefined && (!Number.isInteger(value.percentComplete) || value.percentComplete < 0 || value.percentComplete > 100)) errors.push('percentComplete must be an integer between 0 and 100');
  for (const field of ['startDate', 'targetDate', 'completedAt']) if (value[field] !== undefined && Number.isNaN(new Date(value[field]).getTime())) errors.push(`${field} must be a valid date`);
  if (value.managerIds !== undefined && (!Array.isArray(value.managerIds) || value.managerIds.some(id => !mongoose.isValidObjectId(id)))) errors.push('managerIds must contain valid ObjectIds');
  if (errors.length) throw new FarmProjectValidationError(errors);
  const result = {}; fields.filter(field => PROJECT_FIELDS.has(field)).forEach(field => { result[field] = value[field]; });
  for (const field of ['title', 'description']) if (typeof result[field] === 'string') result[field] = result[field].trim();
  for (const field of ['startDate', 'targetDate', 'completedAt']) if (result[field] !== undefined) result[field] = new Date(result[field]);
  return result;
}
function workUpdate(payload) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  const errors = [];
  Object.keys(value).filter(field => !UPDATE_FIELDS.has(field)).forEach(field => errors.push(`${field} is not allowed`));
  if (typeof value.note !== 'string' || !value.note.trim()) errors.push('note is required');
  if (value.projectId !== undefined && !mongoose.isValidObjectId(value.projectId)) errors.push('projectId must be a valid ObjectId');
  if (errors.length) throw new FarmProjectValidationError(errors);
  return { note: value.note.trim(), ...(value.projectId ? { projectId: value.projectId } : {}) };
}
module.exports = { FarmProjectValidationError, validateProjectCreate: p => project(p), validateProjectUpdate: p => project(p, true), validateWorkUpdate: workUpdate };
