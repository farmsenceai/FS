const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');
const mongoose = require('mongoose');

const repository = require('../src/modules/admin-dashboard/admin-dashboard.repository');
const service = require('../src/modules/admin-dashboard/admin-dashboard.service');
const { isPlatformAdmin } = require('../src/modules/admin-dashboard/admin-dashboard.policy');

const originalRepository = { ...repository };
const admin = { userId: new mongoose.Types.ObjectId().toString(), role: 'admin' };

afterEach(() => {
  Object.assign(repository, originalRepository);
});

describe('admin dashboard service', () => {
  it('accepts both current role and future platformRole admin claims', () => {
    assert.equal(isPlatformAdmin({ role: 'admin' }), true);
    assert.equal(isPlatformAdmin({ platformRole: 'admin' }), true);
    assert.equal(isPlatformAdmin({ role: 'business' }), false);
  });

  it('rejects non-admin actors before calling the repository', async () => {
    repository.getOverview = async () => assert.fail('repository should not be called');
    await assert.rejects(
      service.getOverview({ role: 'business' }),
      error => error.status === 403 && error.code === 'FORBIDDEN'
    );
  });

  it('normalizes all status and delegates farmer pagination', async () => {
    repository.listFarmers = async filters => filters;
    const result = await service.listFarmers(admin, {
      page: '2', limit: '500', search: '  henry  ', status: 'all',
    });
    assert.deepEqual(result, { page: 2, limit: 100, search: 'henry', status: '' });
  });

  it('rejects unknown business list statuses', async () => {
    await assert.rejects(
      service.listBusinesses(admin, { status: 'unknown' }),
      error => error.status === 400 && error.code === 'VALIDATION_ERROR'
    );
  });

  it('approves a pending user and passes the admin actor to the repository', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    repository.findUserById = async () => ({
      _id: id, name: 'Test Farmer', email: 'farmer@example.test', role: 'farmer',
      accountStatus: 'pending',
    });
    repository.updateUserStatus = async (...args) => {
      assert.deepEqual(args, [id, 'active', admin.userId, 'Reviewed']);
      return { _id: id, name: 'Test Farmer', email: 'farmer@example.test', role: 'farmer', accountStatus: 'active' };
    };

    const result = await service.decideApproval(admin, 'user', id, {
      decision: 'approve', reason: ' Reviewed ',
    });
    assert.equal(result.entity.accountStatus, 'active');
  });

  it('rejects repeated approval decisions with a conflict', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    repository.findUserById = async () => ({ _id: id, role: 'farmer', accountStatus: 'active' });
    await assert.rejects(
      service.decideApproval(admin, 'user', id, { decision: 'approve' }),
      error => error.status === 409 && error.code === 'ALREADY_DECIDED'
    );
  });

  it('updates only farmer accounts through the farmer status endpoint', async () => {
    const id = new mongoose.Types.ObjectId().toString();
    repository.findUserById = async () => ({ _id: id, role: 'business', accountStatus: 'active' });
    await assert.rejects(
      service.updateFarmerStatus(admin, id, { status: 'suspended' }),
      error => error.status === 404 && error.code === 'NOT_FOUND'
    );
  });

  it('lists project managers with normalized pagination filters', async () => {
    repository.listProjectManagers = async filters => filters;
    const result = await service.listProjectManagers(admin, { page: '2', limit: '10', status: 'all' });
    assert.deepEqual(result, { page: 2, limit: 10, search: '', status: '' });
  });

  it('creates a project manager and returns a frontend-safe result', async () => {
    const id = new mongoose.Types.ObjectId();
    repository.createProjectManager = async payload => ({ _id: id, ...payload });
    const result = await service.createProjectManager(admin, {
      name: 'Priya Shah', email: 'priya@example.test', phone: '+91 90000 00000',
      role: 'Project Lead', teamSize: 4,
    });
    assert.equal(result.name, 'Priya Shah');
    assert.equal(result.status, 'active');
    assert.equal(result.teamSize, 4);
  });

  it('requires the project manager identity fields', async () => {
    await assert.rejects(
      service.createProjectManager(admin, { name: 'Incomplete' }),
      error => error.status === 400 && error.code === 'VALIDATION_ERROR'
    );
  });
});
