const repository = require('./farm-projects.repository');
const validator = require('./farm-projects.validator');
const policy = require('./farm-projects.policy');
const Farm = require('../farms/farms.model');
const Manager = require('../managers/managers.model');
const { actorId, isFarmer, hasActiveFarmAssignment } = require('../../shared/auth/roleAccess');

class FarmProjectServiceError extends Error {
  constructor(message, code, status) { super(message); this.code = code; this.status = status; }
}
function allow(value) { if (!value) throw new FarmProjectServiceError('You are not allowed to perform this action', 'POLICY_DENIED', 403); }
function found(value, label) { if (!value) throw new FarmProjectServiceError(`${label} not found`, 'NOT_FOUND', 404); return value; }
async function verifyFarm(farmId) { return found(await Farm.findById(farmId).exec(), 'Farm'); }
async function verifyManagers(managerIds = []) {
  if (!managerIds.length) return;
  const count = await Manager.countDocuments({ _id: { $in: managerIds }, status: 'active' });
  if (count !== new Set(managerIds.map(String)).size) throw new FarmProjectServiceError('Every managerId must reference an active canonical manager', 'VALIDATION_ERROR', 400);
}
async function createProject(user, farmId, payload) {
  allow(policy.canWriteFarmProjects(user)); const data = validator.validateProjectCreate(payload);
  await Promise.all([verifyFarm(farmId), verifyManagers(data.managerIds)]);
  if (data.status === 'completed' && !data.completedAt) data.completedAt = new Date();
  return repository.createProject({ ...data, farmId, createdBy: actorId(user) });
}
async function listProjects(user, farmId, filters) {
  const canRead = policy.canReadFarmProjects(user) || (isFarmer(user) && await hasActiveFarmAssignment(actorId(user), farmId));
  allow(canRead);
  return repository.listProjects(farmId, filters);
}
async function updateProject(user, farmId, id, payload) {
  allow(policy.canWriteFarmProjects(user)); const data = validator.validateProjectUpdate(payload);
  await verifyManagers(data.managerIds);
  if (data.status === 'completed' && !data.completedAt) data.completedAt = new Date();
  if (data.status === 'completed' && !Object.hasOwn(data, 'percentComplete')) data.percentComplete = 100;
  return found(await repository.updateProject(farmId, id, data, actorId(user)), 'Farm project');
}
async function createWorkUpdate(user, farmId, payload, options = {}) {
  allow(policy.canWriteFarmProjects(user)); const data = validator.validateWorkUpdate(payload); await verifyFarm(farmId);
  if (data.projectId) found(await repository.findProject(farmId, data.projectId), 'Farm project');
  const createdAt = options.createdAt === undefined ? undefined : new Date(options.createdAt);
  if (createdAt && Number.isNaN(createdAt.getTime())) {
    throw new FarmProjectServiceError('createdAt must be a valid date', 'VALIDATION_ERROR', 400);
  }
  return repository.createWorkUpdate({
    ...data,
    farmId,
    createdBy: actorId(user),
    ...(createdAt ? { createdAt, updatedAt: createdAt } : {})
  });
}
async function listWorkUpdates(user, farmId, filters) { allow(policy.canReadFarmProjects(user)); return repository.listWorkUpdates(farmId, filters); }
async function listRecentWorkUpdates(user, filters) { allow(policy.canReadFarmProjects(user)); return repository.listRecentWorkUpdates(filters); }

module.exports = { FarmProjectServiceError, createProject, listProjects, updateProject, createWorkUpdate, listWorkUpdates, listRecentWorkUpdates };
