const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');
const repository = require('../src/modules/farms/farms.repository');
const service = require('../src/modules/farms/farms.service');

const originalListDirectory = repository.listDirectory;
afterEach(() => { repository.listDirectory = originalListDirectory; });

describe('farm selection directory', () => {
  it('allows every authenticated platform role and returns repository projection', async () => {
    const rows = [{ _id: 'farm-1', name: 'Green Farm', code: 'GRN', location: { address: 'Patna' } }];
    repository.listDirectory = async () => rows;
    for (const role of ['admin', 'business', 'farmer']) {
      assert.deepEqual(await service.listFarmDirectory({ _id: `${role}-1`, role }), rows);
    }
  });

  it('denies unknown roles', async () => {
    await assert.rejects(service.listFarmDirectory({ role: 'unknown' }), error => error.status === 403);
  });
});
