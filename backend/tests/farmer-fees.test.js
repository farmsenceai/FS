const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');
const repository = require('../src/modules/farmer-fees/farmer-fees.repository');
const service = require('../src/modules/farmer-fees/farmer-fees.service');
const policy = require('../src/modules/farmer-fees/farmer-fees.policy');

const originals = {
  listForFarmer: repository.listForFarmer,
  findById: repository.findById,
  summaryForFarmer: repository.summaryForFarmer,
  getSummaryForFarm: repository.getSummaryForFarm,
  markPaid: repository.markPaid
};
afterEach(() => Object.assign(repository, originals));

describe('farmer fee authorization and isolation', () => {
  it('forces farmer list queries to the authenticated farmer ID', async () => {
    let call;
    repository.listForFarmer = async (farmerId, filters) => { call = { farmerId, filters }; return { data: [] }; };
    const actor = { _id: 'farmer-self', role: 'farmer' };
    await service.listFees(actor, { farmerId: 'farmer-other', farmId: 'farm-other', status: 'pending', page: 2 });
    assert.deepEqual(call, {
      farmerId: 'farmer-self',
      filters: { status: 'pending', page: 2, limit: undefined }
    });
  });

  it('denies a farmer reading another farmer fee by ID', async () => {
    repository.findById = async () => ({ _id: 'fee-1', farmerId: 'farmer-other' });
    await assert.rejects(
      service.getFee({ _id: 'farmer-self', role: 'farmer' }, 'fee-1'),
      error => error.code === 'POLICY_DENIED' && error.status === 403
    );
  });

  it('forces farmer summaries to self and rejects a manipulated farmerId', async () => {
    repository.summaryForFarmer = async farmerId => ({ farmerId });
    const actor = { _id: 'farmer-self', role: 'farmer' };
    assert.deepEqual(await service.getFeeSummaryForFarmer(actor), { farmerId: 'farmer-self' });
    await assert.rejects(
      service.getFeeSummaryForFarmer(actor, 'farmer-other'),
      error => error.code === 'POLICY_DENIED' && error.status === 403
    );
  });

  it('allows admin and business farm summaries but denies farmers', async () => {
    repository.getSummaryForFarm = async farmId => ({ farmId });
    assert.deepEqual(await service.getFeeSummaryForFarm({ role: 'admin' }, 'farm-1'), { farmId: 'farm-1' });
    assert.deepEqual(await service.getFeeSummaryForFarm({ role: 'business' }, 'farm-1'), { farmId: 'farm-1' });
    await assert.rejects(
      service.getFeeSummaryForFarm({ _id: 'farmer-self', role: 'farmer' }, 'farm-1'),
      error => error.code === 'POLICY_DENIED' && error.status === 403
    );
  });

  it('allows business reads but reserves every mutation for admins', () => {
    const business = { _id: 'business-1', role: 'business' };
    assert.equal(policy.canListFees(business), true);
    assert.equal(policy.canReadFee(business, {}), true);
    assert.equal(policy.canCreateFee(business), false);
    assert.equal(policy.canUpdateFee(business), false);
    assert.equal(policy.canMarkPaid(business), false);
    assert.equal(policy.canDeleteFee(business), false);
  });

  it('denies farmers from marking any fee paid', async () => {
    repository.findById = async feeId => ({ _id: feeId, farmerId: 'farmer-self', status: 'pending' });
    await assert.rejects(
      service.markFeeAsPaid(
        { _id: 'farmer-self', role: 'farmer' },
        'fee-1',
        { paymentReference: 'UPI-123' }
      ),
      error => error.code === 'POLICY_DENIED' && error.status === 403
    );

    repository.findById = async () => ({ _id: 'fee-2', farmerId: 'farmer-other', status: 'pending' });
    await assert.rejects(
      service.markFeeAsPaid(
        { _id: 'farmer-self', role: 'farmer' },
        'fee-2',
        { paymentReference: 'UPI-456' }
      ),
      error => error.code === 'POLICY_DENIED' && error.status === 403
    );
  });
});
