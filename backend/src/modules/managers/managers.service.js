const repository = require('./managers.repository');
const validator = require('./managers.validator');
const policy = require('./managers.policy');
const Farm = require('../farms/farms.model');
const { actorId } = require('../../shared/auth/roleAccess');

class ManagerServiceError extends Error {
  constructor(message, code, status) { super(message); this.code = code; this.status = status; }
}
function allow(value) { if (!value) throw new ManagerServiceError('You are not allowed to perform this action', 'POLICY_DENIED', 403); }
function found(value, label = 'Manager') { if (!value) throw new ManagerServiceError(`${label} not found`, 'NOT_FOUND', 404); return value; }

async function createManager(user, payload) {
  allow(policy.canWriteManagers(user));
  try { return await repository.create({ ...validator.validateCreate(payload), createdBy: actorId(user) }); }
  catch (error) { if (error?.code === 11000) throw new ManagerServiceError('A manager with this email already exists', 'CONFLICT', 409); throw error; }
}
async function listManagers(user, filters) { allow(policy.canReadManagers(user)); return repository.list(filters); }
async function getManager(user, id) { allow(policy.canReadManagers(user)); return found(await repository.findById(id)); }
async function updateManager(user, id, payload) {
  allow(policy.canWriteManagers(user));
  try { return found(await repository.updateById(id, validator.validateUpdate(payload), actorId(user))); }
  catch (error) { if (error?.code === 11000) throw new ManagerServiceError('A manager with this email already exists', 'CONFLICT', 409); throw error; }
}
async function deleteManager(user, id) { allow(policy.canWriteManagers(user)); return found(await repository.softDeleteById(id, actorId(user))); }
async function assignManager(user, farmId, payload) {
  allow(policy.canWriteManagers(user));
  const data = validator.validateAssignment(payload);
  const [manager, farm] = await Promise.all([repository.findById(data.managerId), Farm.findById(farmId).exec()]);
  found(manager);
  found(farm, 'Farm');
  if (manager.status === 'inactive') throw new ManagerServiceError('Inactive managers cannot be assigned', 'CONFLICT', 409);
  if (await repository.findActiveAssignment(manager._id, farmId)) throw new ManagerServiceError('Manager is already active on this farm', 'CONFLICT', 409);
  try { return await repository.createAssignment({ ...data, farmId, assignedBy: actorId(user) }); }
  catch (error) { if (error?.code === 11000) throw new ManagerServiceError('Manager is already active on this farm', 'CONFLICT', 409); throw error; }
}
async function listFarmManagers(user, farmId) { allow(policy.canReadManagers(user)); return repository.listCurrentForFarm(farmId); }
async function listManagerFarms(user, managerId) { allow(policy.canReadManagers(user)); found(await repository.findById(managerId)); return repository.listHistoryForManager(managerId); }
async function getPerformanceRatings(user) { allow(policy.canReadManagers(user)); return repository.getPerformanceRatings(); }
async function endManagerAssignment(user, farmId, assignmentId) { allow(policy.canWriteManagers(user)); return found(await repository.endAssignment(farmId, assignmentId), 'Manager assignment'); }

module.exports = { ManagerServiceError, createManager, listManagers, getManager, updateManager,
  deleteManager, assignManager, listFarmManagers, listManagerFarms, getPerformanceRatings, endManagerAssignment };
