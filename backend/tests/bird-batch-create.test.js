const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');
const FarmAssignment = require('../src/modules/farm-assignments/farm-assignments.model');
const BirdBatch = require('../src/modules/bird-batches/bird-batches.model');
const facilitiesRepository = require('../src/modules/facilities/facilities.repository');
const farmsRepository = require('../src/modules/farms/farms.repository');
const batchesRepository = require('../src/modules/bird-batches/bird-batches.repository');
const service = require('../src/modules/bird-batches/bird-batches.service');
const { farmCodePrefix, formatBatchCode, generateUniqueBatchCode } = require('../src/modules/bird-batches/batch-code');

const originals = {
  assignmentExists: FarmAssignment.exists,
  facilityFind: facilitiesRepository.findById,
  farmFind: farmsRepository.findById,
  batchCreate: batchesRepository.create,
  batchFindByCode: batchesRepository.findByCode,
  batchSave: BirdBatch.prototype.save
};
afterEach(() => {
  FarmAssignment.exists = originals.assignmentExists;
  facilitiesRepository.findById = originals.facilityFind;
  farmsRepository.findById = originals.farmFind;
  batchesRepository.create = originals.batchCreate;
  batchesRepository.findByCode = originals.batchFindByCode;
  BirdBatch.prototype.save = originals.batchSave;
});

describe('admin-only batch creation', () => {
  const businessId = '507f1f77bcf86cd799439010';
  const farmId = '507f1f77bcf86cd799439011';
  const facilityId = '507f1f77bcf86cd799439012';
  const payload = { facilityId, breed: 'Cobb 500', birdType: 'broiler', initialBirdCount: 500, placedAt: '2026-07-19', status: 'active' };

  it('persists the generated short code supplied by the service', async () => {
    BirdBatch.prototype.save = async function save() { return this; };
    const batch = await batchesRepository.create(businessId, farmId, { ...payload, code: 'GVF104' });
    assert.match(String(batch._id), /^[a-f0-9]{24}$/);
    assert.equal(batch.code, 'GVF104');
  });

  it('creates a farm-prefixed short code for an admin', async () => {
    facilitiesRepository.findById = async () => ({ _id: facilityId, businessId, farmId });
    farmsRepository.findById = async () => ({ _id: farmId, businessId, code: 'GVF-001' });
    batchesRepository.findByCode = async () => null;
    batchesRepository.create = async (_businessId, _farmId, data) => ({ _id: '507f1f77bcf86cd799439099', ...data });
    const batch = await service.createBatch({ _id: 'admin-1', role: 'admin' }, businessId, farmId, payload);
    assert.match(batch.code, /^GVF\d{3}$/);
    assert.equal(batch.currentBirdCountCached, 500);
  });

  it('denies assigned farmers, unassigned farmers, and business users', async () => {
    FarmAssignment.exists = async () => ({ _id: 'assignment-1' });
    await assert.rejects(service.createBatch({ _id: 'farmer-1', role: 'farmer' }, businessId, farmId, payload), error => error.status === 403);
    FarmAssignment.exists = async () => null;
    await assert.rejects(service.createBatch({ _id: 'farmer-1', role: 'farmer' }, businessId, farmId, payload), error => error.status === 403);
    await assert.rejects(service.createBatch({ _id: 'business-1', role: 'business' }, businessId, farmId, payload), error => error.status === 403);
  });
});

describe('batch code generation', () => {
  it('normalizes and pads farm prefixes', () => {
    assert.equal(farmCodePrefix('GVF-001'), 'GVF');
    assert.equal(farmCodePrefix('9-a!'), 'AXX');
    assert.equal(formatBatchCode('GVF-001', 4), 'GVF004');
  });

  it('retries collisions', async () => {
    const values = [0.104, 0.105];
    const code = await generateUniqueBatchCode({
      farmCode: 'GVF-001',
      random: () => values.shift(),
      isTaken: candidate => candidate === 'GVF104'
    });
    assert.equal(code, 'GVF105');
  });
});
