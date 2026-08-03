const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');
const repository = require('../src/modules/farm-projects/farm-projects.repository');
const service = require('../src/modules/farm-projects/farm-projects.service');
const FarmAssignment = require('../src/modules/farm-assignments/farm-assignments.model');

const originalListProjects = repository.listProjects;
const originalAssignmentExists = FarmAssignment.exists;
afterEach(() => {
  repository.listProjects = originalListProjects;
  FarmAssignment.exists = originalAssignmentExists;
});

describe('farmer project reads for reviews', () => {
  it('allows an actively assigned farmer to list completed projects at that farm', async () => {
    FarmAssignment.exists = async () => ({ _id: 'assignment-1' });
    repository.listProjects = async (farmId, filters) => ({ farmId, filters, data: [] });
    const result = await service.listProjects(
      { _id: 'farmer-1', role: 'farmer' },
      'farm-1',
      { status: 'completed' }
    );
    assert.equal(result.farmId, 'farm-1');
    assert.equal(result.filters.status, 'completed');
  });

  it('denies an unassigned farmer', async () => {
    FarmAssignment.exists = async () => null;
    await assert.rejects(
      service.listProjects({ _id: 'farmer-1', role: 'farmer' }, 'farm-1', { status: 'completed' }),
      error => error.status === 403 && error.code === 'POLICY_DENIED'
    );
  });
});
