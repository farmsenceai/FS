const FarmProject = require('./farm-projects.model');
const FarmWorkUpdate = require('./farm-work-updates.model');
const paginate = require('../../shared/db/pagination');

async function createProject(data) { return new FarmProject(data).save(); }
async function findProject(farmId, id) { return FarmProject.findOne({ _id: id, farmId }).exec(); }
async function listProjects(farmId, { status, priority, page, limit } = {}) {
  const filter = { farmId }; if (status) filter.status = status; if (priority) filter.priority = priority;
  return paginate(FarmProject.find(filter).populate('managerIds'), { page, limit });
}
async function updateProject(farmId, id, updates, actorId) {
  const project = await findProject(farmId, id); if (!project) return null;
  Object.entries(updates).forEach(([field, value]) => project.set(field, value)); project.updatedBy = actorId; return project.save();
}
async function createWorkUpdate(data) { return new FarmWorkUpdate(data).save(); }
async function listWorkUpdates(farmId, { projectId, page, limit } = {}) {
  const filter = { farmId }; if (projectId) filter.projectId = projectId;
  return paginate(
    FarmWorkUpdate.find(filter)
      .populate('projectId')
      .populate('createdBy', '_id name'),
    { page, limit, sort: '-createdAt' }
  );
}
async function listRecentWorkUpdates({ limit = 10 } = {}) {
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  return FarmWorkUpdate.find({})
    .sort('-createdAt')
    .limit(safeLimit)
    .populate('farmId', '_id name')
    .populate('projectId', '_id title')
    .populate('createdBy', '_id name')
    .lean()
    .exec();
}
module.exports = { createProject, findProject, listProjects, updateProject, createWorkUpdate, listWorkUpdates, listRecentWorkUpdates };
