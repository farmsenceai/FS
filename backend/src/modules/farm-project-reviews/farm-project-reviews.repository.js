const FarmProjectReview = require('./farm-project-reviews.model');
const FarmProject = require('../farm-projects/farm-projects.model');
const paginate = require('../../shared/db/pagination');

async function findProject(farmId, projectId) {
  return FarmProject.findOne({ _id: projectId, farmId }).exec();
}

async function create(data) {
  return new FarmProjectReview(data).save();
}

async function findById(farmId, projectId, reviewId) {
  return FarmProjectReview.findOne({ _id: reviewId, farmId, projectId }).exec();
}

async function listForProject(farmId, projectId, { page, limit } = {}) {
  return paginate(
    FarmProjectReview.find({ farmId, projectId })
      .populate('farmerId', '_id name'),
    { page, limit, sort: '-createdAt' }
  );
}

async function updateById(farmId, projectId, reviewId, updates) {
  const review = await findById(farmId, projectId, reviewId);
  if (!review) return null;
  Object.entries(updates).forEach(([field, value]) => review.set(field, value));
  return review.save();
}

async function deleteById(farmId, projectId, reviewId) {
  return FarmProjectReview.findOneAndDelete({ _id: reviewId, farmId, projectId }).exec();
}

async function getAverageRatingForProject(projectId) {
  const [summary] = await FarmProjectReview.aggregate([
    { $match: {
      projectId: FarmProjectReview.db.base.Types.ObjectId.createFromHexString(String(projectId)),
      deletedAt: null
    } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
  ]).exec();
  return summary
    ? { averageRating: summary.averageRating, reviewCount: summary.reviewCount }
    : { averageRating: 0, reviewCount: 0 };
}

async function getAverageRatingForFarm(farmId) {
  const objectId = FarmProjectReview.db.base.Types.ObjectId.createFromHexString(String(farmId));
  const projectIds = await FarmProject.distinct('_id', { farmId: objectId, deletedAt: null });
  if (!projectIds.length) {
    return { averageRating: 0, reviewCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, recentReviews: [] };
  }
  const [summary, recentReviews] = await Promise.all([
    FarmProjectReview.aggregate([
      { $match: { projectId: { $in: projectIds }, deletedAt: null } },
      { $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
        ratings: { $push: '$rating' }
      } }
    ]).exec(),
    FarmProjectReview.find({ projectId: { $in: projectIds }, deletedAt: null })
      .sort('-createdAt')
      .limit(2)
      .populate('farmerId', '_id name')
      .populate('projectId', '_id title')
      .lean()
      .exec()
  ]);
  const row = summary[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const rating of row?.ratings || []) distribution[rating] += 1;
  return {
    averageRating: row?.averageRating || 0,
    reviewCount: row?.reviewCount || 0,
    distribution,
    recentReviews
  };
}

module.exports = { findProject, create, findById, listForProject, updateById, deleteById, getAverageRatingForProject, getAverageRatingForFarm };
