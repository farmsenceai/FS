const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');

const FarmAssignment = require('../src/modules/farm-assignments/farm-assignments.model');
const roleAccess = require('../src/shared/auth/roleAccess');
const organizationsPolicy = require('../src/modules/organizations/organizations.policy');
const farmsPolicy = require('../src/modules/farms/farms.policy');
const facilitiesPolicy = require('../src/modules/facilities/facilities.policy');
const batchesPolicy = require('../src/modules/bird-batches/bird-batches.policy');
const flockRecordsPolicy = require('../src/modules/flock-records/flock-records.policy');
const assignmentsPolicy = require('../src/modules/farm-assignments/farm-assignments.policy');
const organizationsRepository = require('../src/modules/organizations/organizations.repository');
const organizationsService = require('../src/modules/organizations/organizations.service');
const assignmentsRepository = require('../src/modules/farm-assignments/farm-assignments.repository');
const assignmentsService = require('../src/modules/farm-assignments/farm-assignments.service');

const originals = {
  assignmentExists: FarmAssignment.exists,
  findOrganizationBySlug: organizationsRepository.findBySlug,
  findOrganizationById: organizationsRepository.findById,
  getOrganizationDashboardRelations: organizationsRepository.getDashboardRelations,
  createOrganization: organizationsRepository.create,
  listActiveWithFarmerDetails: assignmentsRepository.listActiveWithFarmerDetails
};

afterEach(() => {
  FarmAssignment.exists = originals.assignmentExists;
  organizationsRepository.findBySlug = originals.findOrganizationBySlug;
  organizationsRepository.findById = originals.findOrganizationById;
  organizationsRepository.getDashboardRelations = originals.getOrganizationDashboardRelations;
  organizationsRepository.create = originals.createOrganization;
  assignmentsRepository.listActiveWithFarmerDetails = originals.listActiveWithFarmerDetails;
});

describe('simplified three-role authorization', () => {
  it('gives admins full access without a membership', async () => {
    const admin = { _id: 'admin-1', role: 'admin' };
    assert.equal(organizationsPolicy.canCreateOrganization(admin), true);
    assert.equal(await farmsPolicy.canReadFarm(admin, null, { _id: 'farm-1' }), true);
    assert.equal(batchesPolicy.canUpdateBatch(admin), true);
    assert.equal(await flockRecordsPolicy.canCreateFlockRecord(admin, null, 'farm-1'), true);
  });

  it('gives business users platform-wide reads and no writes', async () => {
    const business = { _id: 'business-user-1', role: 'business' };
    assert.equal(organizationsPolicy.canListOrganizations(business), true);
    assert.equal(await farmsPolicy.canReadFarm(business, null, { _id: 'farm-anywhere' }), true);
    assert.equal(await facilitiesPolicy.canReadFacility(business, null, { farmId: 'farm-2' }), true);
    assert.equal(farmsPolicy.canCreateFarm(business), false);
    assert.equal(batchesPolicy.canUpdateBatch(business), false);
    assert.equal(await flockRecordsPolicy.canCreateFlockRecord(business, null, 'farm-2'), false);
  });

  it('allows assigned farmers to read and write flock records only for their farm', async () => {
    FarmAssignment.exists = async filter => filter.farmId === 'farm-1' ? { _id: 'a-1' } : null;
    const farmer = { _id: 'farmer-1', role: 'farmer' };

    assert.equal(await farmsPolicy.canReadFarm(farmer, null, { _id: 'farm-1' }), true);
    assert.equal(await farmsPolicy.canReadFarm(farmer, null, { _id: 'farm-2' }), false);
    assert.equal(await batchesPolicy.canReadBatch(farmer, null, 'farm-1'), true);
    assert.equal(await batchesPolicy.canCreateBatch(farmer, null, 'farm-1'), false);
    assert.equal(await batchesPolicy.canCreateBatch(farmer, null, 'farm-2'), false);
    assert.equal(batchesPolicy.canUpdateBatch(farmer), false);
    assert.equal(await flockRecordsPolicy.canCreateFlockRecord(farmer, null, 'farm-1'), true);
    assert.equal(await flockRecordsPolicy.canCreateFlockRecord(farmer, null, 'farm-2'), false);
  });

  it('denies unassigned farmers and organization-level farmer access', async () => {
    FarmAssignment.exists = async () => null;
    const farmer = { _id: 'farmer-1', role: 'farmer' };
    assert.equal(organizationsPolicy.canReadOrganization(farmer), false);
    assert.equal(await roleAccess.canAccess(farmer, { farmId: 'farm-1' }), false);
    assert.equal(await batchesPolicy.canCreateBatch(farmer, null, 'farm-1'), false);
  });

  it('allows farmers to list only their own assignments', () => {
    const farmer = { _id: 'farmer-1', role: 'farmer' };
    assert.equal(assignmentsPolicy.canListUserAssignments(farmer, 'farmer-1'), true);
    assert.equal(assignmentsPolicy.canListUserAssignments(farmer, 'farmer-2'), false);
    assert.equal(assignmentsPolicy.canCreateAssignment(farmer), false);
  });

  it('returns a safe farm roster to admin and business but denies farmers', async () => {
    assignmentsRepository.listActiveWithFarmerDetails = async () => [{
      _id: 'assignment-1',
      userId: {
        _id: 'farmer-1',
        name: 'Test Farmer',
        email: 'farmer@example.test',
        phone: '9999999999',
        accountStatus: 'active',
        password: 'must-not-leak'
      },
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      status: 'active'
    }];

    const roster = await assignmentsService.getFarmRoster({ _id: 'admin-1', role: 'admin' }, 'farm-1');
    assert.deepEqual(Object.keys(roster[0]), [
      'assignmentId', 'farmerId', 'name', 'email', 'phone', 'accountStatus', 'startsAt', 'status'
    ]);
    assert.equal(roster[0].farmerId, 'farmer-1');
    assert.equal(Object.hasOwn(roster[0], 'password'), false);

    const businessRoster = await assignmentsService.getFarmRoster(
      { _id: 'business-1', role: 'business' },
      'farm-1'
    );
    assert.equal(businessRoster.length, 1);

    await assert.rejects(
      assignmentsService.getFarmRoster({ _id: 'farmer-1', role: 'farmer' }, 'farm-1'),
      error => error.code === 'POLICY_DENIED' && error.status === 403
    );
  });

  it('creates an organization without creating an owner membership', async () => {
    organizationsRepository.findBySlug = async () => null;
    organizationsRepository.create = async payload => ({ _id: 'business-1', ...payload });

    const organization = await organizationsService.createOrganization(
      { _id: 'admin-1', role: 'admin' },
      {
        legalName: 'FarmSence Test Private Limited',
        displayName: 'FarmSence Test',
        slug: 'farmsence-test',
        contacts: { billingEmail: 'owner@example.com' },
        legal: { countryCode: 'IN' }
      }
    );
    assert.equal(organization._id, 'business-1');
  });

  it('aggregates an organization dashboard and denies farmers', async () => {
    organizationsRepository.findById = async () => ({ _id: 'business-1', displayName: 'Test Org' });
    organizationsRepository.getDashboardRelations = async () => ({
      farms: [
        { _id: 'farm-1', name: 'North Farm' },
        { _id: 'farm-2', name: 'South Farm' }
      ],
      managerAssignments: [
        { farmId: 'farm-1', managerId: { _id: 'manager-1', name: 'Manager One' } },
        { farmId: 'farm-2', managerId: { _id: 'manager-1', name: 'Manager One' } }
      ],
      farmerAssignments: [
        { farmId: 'farm-1', userId: { _id: 'farmer-1', name: 'Farmer One', email: 'one@example.test', phone: '111' } },
        { farmId: 'farm-2', userId: { _id: 'farmer-1', name: 'Farmer One', email: 'one@example.test', phone: '111' } },
        { farmId: 'farm-2', userId: { _id: 'farmer-2', name: 'Farmer Two', email: 'two@example.test', phone: '222' } }
      ]
    });

    const dashboard = await organizationsService.getOrganizationDashboard(
      { _id: 'admin-1', role: 'admin' },
      'business-1'
    );
    assert.deepEqual(dashboard.summary, { farmCount: 2, managerCount: 1, farmerCount: 2 });
    assert.equal(dashboard.managers[0].farms.length, 2);
    assert.equal(dashboard.farmers[0].farms.length, 2);

    const businessDashboard = await organizationsService.getOrganizationDashboard(
      { _id: 'business-user-1', role: 'business' },
      'business-1'
    );
    assert.equal(businessDashboard.summary.farmCount, 2);

    await assert.rejects(
      organizationsService.getOrganizationDashboard(
        { _id: 'farmer-1', role: 'farmer' },
        'business-1'
      ),
      error => error.code === 'POLICY_DENIED' && error.status === 403
    );
  });
});
