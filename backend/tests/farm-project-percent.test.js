const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');
const repository = require('../src/modules/farm-projects/farm-projects.repository');
const service = require('../src/modules/farm-projects/farm-projects.service');
const validator = require('../src/modules/farm-projects/farm-projects.validator');
const FarmWorkUpdate = require('../src/modules/farm-projects/farm-work-updates.model');

const originalUpdateProject = repository.updateProject;
const originalFindWorkUpdates = FarmWorkUpdate.find;
afterEach(() => {
  repository.updateProject = originalUpdateProject;
  FarmWorkUpdate.find = originalFindWorkUpdates;
});

describe('farm project percent completion', () => {
  it('accepts only integer percentages from 0 through 100', () => {
    assert.equal(validator.validateProjectCreate({ title: 'Barn upgrade', percentComplete: 45 }).percentComplete, 45);
    assert.equal(validator.validateProjectUpdate({ percentComplete: 0 }).percentComplete, 0);
    assert.equal(validator.validateProjectUpdate({ percentComplete: 100 }).percentComplete, 100);

    for (const percentComplete of [-1, 101, 45.5, '45']) {
      assert.throws(
        () => validator.validateProjectUpdate({ percentComplete }),
        error => error.code === 'VALIDATION_ERROR' && error.status === 400
      );
    }
  });

  it('defaults progress to 100 when an update completes a project', async () => {
    let saved;
    repository.updateProject = async (farmId, projectId, data, updatedBy) => {
      saved = { farmId, projectId, data, updatedBy };
      return { _id: projectId, ...data };
    };

    await service.updateProject(
      { _id: 'admin-1', role: 'admin' },
      'farm-1',
      'project-1',
      { status: 'completed' }
    );

    assert.equal(saved.data.percentComplete, 100);
    assert.ok(saved.data.completedAt instanceof Date);
  });

  it('respects an explicit percentage supplied with completed status', async () => {
    let saved;
    repository.updateProject = async (_farmId, _projectId, data) => {
      saved = data;
      return { _id: 'project-1', ...data };
    };

    await service.updateProject(
      { _id: 'admin-1', role: 'admin' },
      'farm-1',
      'project-1',
      { status: 'completed', percentComplete: 45 }
    );

    assert.equal(saved.percentComplete, 45);
  });

  it('populates work-update authors using only ID and name', async () => {
    const populated = [];
    const query = {
      model: { countDocuments: () => ({ exec: async () => 0 }) },
      getFilter: () => ({ farmId: 'farm-1' }),
      populate(path, projection) { populated.push([path, projection]); return this; },
      sort() { return this; },
      skip() { return this; },
      limit() { return this; },
      exec: async () => []
    };
    FarmWorkUpdate.find = () => query;

    await repository.listWorkUpdates('farm-1', { limit: 100 });

    assert.deepEqual(populated, [['projectId', undefined], ['createdBy', '_id name']]);
  });

  it('populates farm and author names for platform-wide recent updates', async () => {
    const populated = [];
    const query = {
      sort() { return this; },
      limit() { return this; },
      populate(path, projection) { populated.push([path, projection]); return this; },
      lean() { return this; },
      exec: async () => []
    };
    FarmWorkUpdate.find = () => query;
    await repository.listRecentWorkUpdates({ limit: 10 });
    assert.deepEqual(populated, [
      ['farmId', '_id name'],
      ['projectId', '_id title'],
      ['createdBy', '_id name']
    ]);
  });
});
