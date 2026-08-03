const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');
const repository = require('../src/modules/farm-project-reviews/farm-project-reviews.repository');
const service = require('../src/modules/farm-project-reviews/farm-project-reviews.service');
const validator = require('../src/modules/farm-project-reviews/farm-project-reviews.validator');
const FarmAssignment = require('../src/modules/farm-assignments/farm-assignments.model');

const originals = {
  findProject: repository.findProject,
  create: repository.create,
  findById: repository.findById,
  listForProject: repository.listForProject,
  updateById: repository.updateById,
  deleteById: repository.deleteById,
  getAverageRatingForProject: repository.getAverageRatingForProject,
  getAverageRatingForFarm: repository.getAverageRatingForFarm,
  assignmentExists: FarmAssignment.exists
};
afterEach(() => {
  repository.findProject = originals.findProject;
  repository.create = originals.create;
  repository.findById = originals.findById;
  repository.listForProject = originals.listForProject;
  repository.updateById = originals.updateById;
  repository.deleteById = originals.deleteById;
  repository.getAverageRatingForProject = originals.getAverageRatingForProject;
  repository.getAverageRatingForFarm = originals.getAverageRatingForFarm;
  FarmAssignment.exists = originals.assignmentExists;
});

describe('canonical farm project reviews', () => {
  it('validates integer ratings from 1 through 5', () => {
    assert.equal(validator.validateCreate({ rating: 4, reviewText: ' Good work ' }).reviewText, 'Good work');
    for (const rating of [0, 6, 4.5, '4']) {
      assert.throws(() => validator.validateCreate({ rating }), error => error.code === 'VALIDATION_ERROR');
    }
  });

  it('rejects reviews for projects that are not completed', async () => {
    repository.findProject = async () => ({ _id: 'project-1', farmId: 'farm-1', status: 'in_progress' });
    await assert.rejects(
      service.createReview({ _id: 'farmer-1', role: 'farmer' }, 'farm-1', 'project-1', { rating: 4 }),
      error => error.status === 403 && /completed/.test(error.message)
    );
  });

  it('rejects farmers without an active assignment at the project farm', async () => {
    repository.findProject = async () => ({ _id: 'project-1', farmId: 'farm-1', status: 'completed' });
    FarmAssignment.exists = async () => null;
    await assert.rejects(
      service.createReview({ _id: 'farmer-1', role: 'farmer' }, 'farm-1', 'project-1', { rating: 4 }),
      error => error.status === 403 && /active assignment/.test(error.message)
    );
  });

  it('creates an assigned farmer review and returns aggregate data when listed', async () => {
    repository.findProject = async () => ({ _id: 'project-1', farmId: 'farm-1', status: 'completed' });
    FarmAssignment.exists = async () => ({ _id: 'assignment-1' });
    repository.create = async data => ({ _id: 'review-1', ...data });
    repository.listForProject = async () => ({ data: [{ _id: 'review-1', rating: 4 }], page: 1, limit: 20, total: 1, pages: 1 });
    repository.getAverageRatingForProject = async () => ({ averageRating: 4, reviewCount: 1 });

    const review = await service.createReview(
      { _id: 'farmer-1', role: 'farmer' }, 'farm-1', 'project-1', { rating: 4, reviewText: 'Useful upgrade' }
    );
    assert.equal(review.farmerId, 'farmer-1');
    const result = await service.listReviews({ _id: 'farmer-1', role: 'farmer' }, 'farm-1', 'project-1');
    assert.equal(result.averageRating, 4);
    assert.equal(result.reviewCount, 1);
  });

  it('returns the farm-level review rollup', async () => {
    repository.getAverageRatingForFarm = async farmId => ({ farmId, averageRating: 4.5, reviewCount: 2 });
    const result = await service.getAverageRatingForFarm('farm-1');
    assert.equal(result.averageRating, 4.5);
    assert.equal(result.reviewCount, 2);
  });

  it('allows a farmer to edit only their own review and keeps admin/business read-only', async () => {
    repository.findProject = async () => ({ _id: 'project-1', farmId: 'farm-1', status: 'completed' });
    FarmAssignment.exists = async () => ({ _id: 'assignment-1' });
    repository.findById = async () => ({ _id: 'review-1', farmerId: 'farmer-other' });
    await assert.rejects(
      service.updateReview({ _id: 'farmer-1', role: 'farmer' }, 'farm-1', 'project-1', 'review-1', { rating: 5 }),
      error => error.status === 403 && /own/.test(error.message)
    );
    await assert.rejects(
      service.createReview({ _id: 'admin-1', role: 'admin' }, 'farm-1', 'project-1', { rating: 5 }),
      error => error.status === 403
    );
    await assert.rejects(
      service.updateReview({ _id: 'business-1', role: 'business' }, 'farm-1', 'project-1', 'review-1', { rating: 5 }),
      error => error.status === 403
    );
  });

  it('allows a farmer to delete only their own review', async () => {
    repository.findProject = async () => ({ _id: 'project-1', farmId: 'farm-1', status: 'completed' });
    FarmAssignment.exists = async () => ({ _id: 'assignment-1' });
    repository.findById = async () => ({ _id: 'review-1', farmerId: 'farmer-1' });
    repository.deleteById = async () => ({ _id: 'review-1' });
    const deleted = await service.deleteReview({ _id: 'farmer-1', role: 'farmer' }, 'farm-1', 'project-1', 'review-1');
    assert.equal(deleted._id, 'review-1');
  });
});
