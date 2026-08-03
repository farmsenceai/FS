const Manager = require('./managers.model');
const ManagerFarmAssignment = require('./manager-farm-assignments.model');
const paginate = require('../../shared/db/pagination');
const FarmProjectReview = require('../farm-project-reviews/farm-project-reviews.model');

async function create(data) { return new Manager(data).save(); }
async function findById(id) { return Manager.findById(id).exec(); }
async function list({ status, page, limit } = {}) {
  return paginate(Manager.find(status ? { status } : {}), { page, limit });
}
async function updateById(id, updates, actorId) {
  const manager = await findById(id);
  if (!manager) return null;
  Object.entries(updates).forEach(([field, value]) => manager.set(field, value));
  manager.updatedBy = actorId;
  return manager.save();
}
async function softDeleteById(id, actorId) {
  const manager = await findById(id);
  if (!manager) return null;
  manager.deletedAt = new Date();
  manager.deletedBy = actorId;
  manager.status = 'inactive';
  return manager.save();
}
async function findActiveAssignment(managerId, farmId) {
  return ManagerFarmAssignment.findOne({ managerId, farmId, status: 'active' }).exec();
}
async function createAssignment(data) { return new ManagerFarmAssignment(data).save(); }
async function listCurrentForFarm(farmId) {
  return ManagerFarmAssignment.find({ farmId, status: 'active' })
    .populate('managerId').sort('managerId.name').exec();
}
async function listHistoryForManager(managerId) {
  return ManagerFarmAssignment.find({ managerId }).populate('farmId').sort('-startsAt').exec();
}
async function getPerformanceRatings() {
  const [overall, byManager] = await Promise.all([
    FarmProjectReview.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
    ]).exec(),
    FarmProjectReview.aggregate([
      { $match: { deletedAt: null } },
      { $lookup: { from: 'farm_projects', localField: 'projectId', foreignField: '_id', as: 'project' } },
      { $unwind: '$project' },
      { $unwind: '$project.managerIds' },
      { $group: { _id: '$project.managerIds', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
    ]).exec()
  ]);
  return {
    overallAverageRating: overall[0]?.averageRating || 0,
    overallReviewCount: overall[0]?.reviewCount || 0,
    managers: byManager.map(row => ({ managerId: row._id, averageRating: row.averageRating, reviewCount: row.reviewCount }))
  };
}
async function endAssignment(farmId, assignmentId) {
  const assignment = await ManagerFarmAssignment.findOne({ _id: assignmentId, farmId, status: 'active' }).exec();
  if (!assignment) return null;
  assignment.status = 'ended';
  assignment.endsAt = new Date();
  return assignment.save();
}

module.exports = { create, findById, list, updateById, softDeleteById, findActiveAssignment,
  createAssignment, listCurrentForFarm, listHistoryForManager, getPerformanceRatings, endAssignment };
