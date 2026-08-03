const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');
const repository = require('../src/modules/business-dashboard/business-dashboard.repository');
const service = require('../src/modules/business-dashboard/business-dashboard.service');
const originals = { ...repository };
afterEach(() => Object.assign(repository, originals));

const emptyData = { organization: null, farms: [], selectedFarm: null, batches: [], activeBatch: null, latestRecord: null, sales: [], expenses: [], projects: [], fees: [], managerAssignment: null };

describe('business dashboard service', () => {
  it('rejects non-business accounts', async () => {
    await assert.rejects(() => service.getDashboard({ role: 'farmer' }), error => error.status === 403);
  });
  it('loads platform data without organization membership', async () => {
    repository.resolveBusinessId = async () => assert.fail('membership lookup should not run');
    repository.loadDashboard = async businessId => { assert.equal(businessId, null); return emptyData; };
    const result = await service.getDashboard({ role: 'business', userId: 'any-business-user' });
    assert.equal(result.scope, 'platform');
    assert.equal(result.organization.name, 'All organizations');
  });
  it('calculates financial values from all canonical organizations', async () => {
    repository.loadDashboard = async () => ({ ...emptyData, sales: [{ revenue: 5000 }, { revenue: 2500 }], expenses: [{ amount: 3000 }] });
    const result = await service.getDashboard({ role: 'business' });
    assert.deepEqual(result.finance, { revenue: 7500, expenses: 3000, profit: 4500, saleCount: 2, expenseCount: 1 });
  });
});
