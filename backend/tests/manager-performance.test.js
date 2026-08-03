const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');
const repository = require('../src/modules/managers/managers.repository');
const service = require('../src/modules/managers/managers.service');

const original = repository.getPerformanceRatings;
afterEach(() => { repository.getPerformanceRatings = original; });

describe('manager performance ratings', () => {
  it('allows business read access and returns the repository rollup', async () => {
    repository.getPerformanceRatings = async () => ({
      overallAverageRating: 4.5,
      overallReviewCount: 2,
      managers: [{ managerId: 'manager-1', averageRating: 4.5, reviewCount: 2 }]
    });
    const result = await service.getPerformanceRatings({ _id: 'business-1', role: 'business' });
    assert.equal(result.overallAverageRating, 4.5);
    assert.equal(result.managers.length, 1);
  });

  it('keeps farmer access read-restricted', async () => {
    await assert.rejects(
      service.getPerformanceRatings({ _id: 'farmer-1', role: 'farmer' }),
      error => error.status === 403
    );
  });
});
