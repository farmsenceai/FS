const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');
const FarmAssignment = require('../src/modules/farm-assignments/farm-assignments.model');
const repository = require('../src/modules/compensation-claims/compensation-claims.repository');
const batches = require('../src/modules/bird-batches/bird-batches.repository');
const policy = require('../src/modules/compensation-claims/compensation-claims.policy');
const service = require('../src/modules/compensation-claims/compensation-claims.service');
const validator = require('../src/modules/compensation-claims/compensation-claims.validator');

const ids = {
  business: '507f1f77bcf86cd799439010',
  farm: '507f1f77bcf86cd799439011',
  batch: '507f1f77bcf86cd799439012',
  farmer: '507f1f77bcf86cd799439013',
  claim: '507f1f77bcf86cd799439014'
};
const originals = {
  assignmentExists: FarmAssignment.exists,
  batchFind: batches.findById,
  create: repository.create,
  findScoped: repository.findScoped,
  findById: repository.findById,
  update: repository.update,
  remove: repository.remove
};
afterEach(() => {
  FarmAssignment.exists = originals.assignmentExists;
  batches.findById = originals.batchFind;
  repository.create = originals.create;
  repository.findScoped = originals.findScoped;
  repository.findById = originals.findById;
  repository.update = originals.update;
  repository.remove = originals.remove;
});

describe('canonical compensation claims', () => {
  it('normalizes money and rejects free-text references or future service dates', () => {
    const value = validator.validateCreate({ amount: '123.4', serviceDate: '2026-07-20', description: 'Batch work' });
    assert.equal(value.amount, '123.40');
    assert.throws(() => validator.validateCreate({
      amount: '1.001',
      serviceDate: '2999-01-01',
      description: 'Invalid',
      farm: 'free text',
      batchId: 'free text'
    }), error => error.code === 'VALIDATION_ERROR' && error.details.some(item => item.includes('not an allowed field')));
  });

  it('allows only assigned farmers to submit against a same-tenant batch', async () => {
    const farmer = { _id: ids.farmer, role: 'farmer' };
    FarmAssignment.exists = async filter => String(filter.farmId) === ids.farm ? { _id: 'assignment' } : null;
    batches.findById = async (businessId, farmId, batchId) =>
      String(businessId) === ids.business && String(farmId) === ids.farm && String(batchId) === ids.batch ? { _id: ids.batch } : null;
    repository.create = async value => value;
    const claim = await service.createClaim(farmer, ids.business, ids.farm, ids.batch, {
      amount: '500.00', serviceDate: '2026-07-20', description: 'Growing service'
    });
    assert.equal(String(claim.farmerId), ids.farmer);
    assert.equal(String(claim.businessId), ids.business);
    assert.equal(String(claim.farmId), ids.farm);
    assert.equal(String(claim.batchId), ids.batch);

    await assert.rejects(
      service.createClaim(farmer, ids.business, '507f1f77bcf86cd799439099', ids.batch, {
        amount: '500.00', serviceDate: '2026-07-20', description: 'Wrong farm'
      }),
      error => error.status === 403
    );
    await assert.rejects(
      service.createClaim(farmer, ids.business, ids.farm, '507f1f77bcf86cd799439099', {
        amount: '500.00', serviceDate: '2026-07-20', description: 'Wrong batch'
      }),
      error => error.status === 404
    );
  });

  it('limits farmer mutation to owned pending claims', async () => {
    const farmer = { _id: ids.farmer, role: 'farmer' };
    FarmAssignment.exists = async () => ({ _id: 'assignment' });
    batches.findById = async () => ({ _id: ids.batch });
    repository.findScoped = async () => ({ _id: ids.claim, farmerId: ids.farmer, status: 'approved' });
    await assert.rejects(
      service.updateMine(farmer, ids.business, ids.farm, ids.batch, ids.claim, { amount: '600.00' }),
      error => error.status === 403
    );
    repository.findScoped = async () => ({ _id: ids.claim, farmerId: '507f1f77bcf86cd799439099', status: 'pending' });
    await assert.rejects(
      service.deleteMine(farmer, ids.business, ids.farm, ids.batch, ids.claim),
      error => error.status === 403
    );
  });

  it('allows business/admin review and enforces the approval-before-payment transition', async () => {
    assert.equal(policy.canReview({ role: 'business' }), true);
    assert.equal(policy.canReview({ role: 'admin' }), true);
    assert.equal(policy.canReview({ role: 'farmer' }), false);
    repository.findById = async () => ({ _id: ids.claim, status: 'pending' });
    repository.update = async (claim, values) => ({ ...claim, ...values });
    const approved = await service.reviewClaim({ _id: 'reviewer', role: 'business' }, ids.claim, { status: 'approved', reviewerNote: 'Verified' });
    assert.equal(approved.status, 'approved');
    await assert.rejects(
      service.reviewClaim({ _id: ids.farmer, role: 'farmer' }, ids.claim, { status: 'approved' }),
      error => error.status === 403
    );
    await assert.rejects(
      service.reviewClaim({ _id: 'reviewer', role: 'admin' }, ids.claim, { status: 'paid', paymentReference: 'BANK-1' }),
      error => error.status === 409
    );
  });
});
