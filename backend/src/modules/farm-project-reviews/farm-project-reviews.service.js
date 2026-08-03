const repository = require('./farm-project-reviews.repository');
const validator = require('./farm-project-reviews.validator');
const { actorId, isAdmin, isBusiness, isFarmer, hasActiveFarmAssignment } = require('../../shared/auth/roleAccess');

class FarmProjectReviewServiceError extends Error {
  constructor(message, code, status) { super(message); this.code = code; this.status = status; }
}
function deny(message = 'You are not allowed to perform this action') {
  throw new FarmProjectReviewServiceError(message, 'POLICY_DENIED', 403);
}
function found(value, label) {
  if (!value) throw new FarmProjectReviewServiceError(`${label} not found`, 'NOT_FOUND', 404);
  return value;
}
async function assignedFarmer(actorUser, farmId) {
  return isFarmer(actorUser) && hasActiveFarmAssignment(actorId(actorUser), farmId);
}
async function projectForFarm(farmId, projectId) {
  return found(await repository.findProject(farmId, projectId), 'Farm project');
}

async function createReview(actorUser, farmId, projectId, payload) {
  if (!isFarmer(actorUser)) deny('Only farmers can submit project reviews');
  const project = await projectForFarm(farmId, projectId);
  if (project.status !== 'completed') deny('Only completed projects can be reviewed');
  if (!(await assignedFarmer(actorUser, project.farmId))) deny('You can only review projects at a farm where you have an active assignment');
  const data = validator.validateCreate(payload);
  try {
    return await repository.create({ ...data, projectId, farmId: project.farmId, farmerId: actorId(actorUser) });
  } catch (error) {
    if (error?.code === 11000) throw new FarmProjectReviewServiceError('You have already reviewed this project', 'CONFLICT', 409);
    throw error;
  }
}

async function listReviews(actorUser, farmId, projectId, filters = {}) {
  const project = await projectForFarm(farmId, projectId);
  if (!(isAdmin(actorUser) || isBusiness(actorUser)) && !(await assignedFarmer(actorUser, project.farmId))) deny();
  const [reviews, rating] = await Promise.all([
    repository.listForProject(farmId, projectId, filters),
    repository.getAverageRatingForProject(projectId)
  ]);
  return { ...reviews, ...rating };
}

async function updateReview(actorUser, farmId, projectId, reviewId, payload) {
  if (!isFarmer(actorUser)) deny('Only farmers can edit project reviews');
  const project = await projectForFarm(farmId, projectId);
  if (!(await assignedFarmer(actorUser, project.farmId))) deny('You can only edit reviews for your actively assigned farm');
  const review = found(await repository.findById(farmId, projectId, reviewId), 'Project review');
  if (String(review.farmerId) !== String(actorId(actorUser))) deny('You can only edit your own project review');
  return found(await repository.updateById(farmId, projectId, reviewId, validator.validateUpdate(payload)), 'Project review');
}

async function deleteReview(actorUser, farmId, projectId, reviewId) {
  if (!isFarmer(actorUser)) deny('Only farmers can delete project reviews');
  const project = await projectForFarm(farmId, projectId);
  if (!(await assignedFarmer(actorUser, project.farmId))) deny('You can only delete reviews for your actively assigned farm');
  const review = found(await repository.findById(farmId, projectId, reviewId), 'Project review');
  if (String(review.farmerId) !== String(actorId(actorUser))) deny('You can only delete your own project review');
  return found(await repository.deleteById(farmId, projectId, reviewId), 'Project review');
}

async function getAverageRatingForProject(projectId) {
  return repository.getAverageRatingForProject(projectId);
}

async function getAverageRatingForFarm(farmId) {
  return repository.getAverageRatingForFarm(farmId);
}

module.exports = {
  FarmProjectReviewServiceError,
  createReview,
  listReviews,
  updateReview,
  deleteReview,
  getAverageRatingForProject,
  getAverageRatingForFarm
};
