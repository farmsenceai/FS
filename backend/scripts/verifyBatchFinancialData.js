const assert = require('node:assert/strict');
const path = require('node:path');
const mongoose = require('mongoose');
const { initializeMigrationSafety } = require('../src/migrations/lib/safety');
const fixture = require('../tests/fixtures/batch-financial-verification.json');

const Organization = require('../src/modules/organizations/organizations.model');
const Farm = require('../src/modules/farms/farms.model');
const Facility = require('../src/modules/facilities/facilities.model');
const BirdBatch = require('../src/modules/bird-batches/bird-batches.model');
const FlockRecord = require('../src/modules/flock-records/flock-records.model');
const BatchSale = require('../src/modules/batch-sales/batch-sales.model');
const BatchExpense = require('../src/modules/batch-expenses/batch-expenses.model');
const User = require('../models/User');
const salesService = require('../src/modules/batch-sales/batch-sales.service');
const expensesService = require('../src/modules/batch-expenses/batch-expenses.service');
const aggregations = require('../src/modules/financial-aggregations/financial-aggregations.service');

const VERIFICATION_SLUGS = [fixture.tenantA.slug, fixture.tenantB.slug];
const VERIFICATION_EMAILS = ['verify-financial-admin@example.test', 'verify-financial-business@example.test', 'verify-financial-farmer@example.test'];
const actorIds = {
  admin: new mongoose.Types.ObjectId(),
  business: new mongoose.Types.ObjectId(),
  farmer: new mongoose.Types.ObjectId()
};
const actors = {
  admin: { _id: actorIds.admin, role: 'admin' },
  business: { _id: actorIds.business, role: 'business' },
  farmer: { _id: actorIds.farmer, role: 'farmer' }
};
const observedAuditEvents = [];
const originalLog = console.log;

function decimal(value) {
  return Number(value?.toString?.() ?? value);
}
function money(value) {
  return decimal(value).toFixed(2);
}
function sumMoney(rows, field) {
  return rows.reduce((total, row) => total + decimal(row[field]), 0).toFixed(2);
}
async function rejectedStatus(promise) {
  try { await promise; throw new Error('Expected operation to be rejected'); }
  catch (error) {
    if (!error?.status) throw error;
    return error.status;
  }
}
function recordAuditLog(value, ...rest) {
  if (value?.event === 'audit_event' && ['batch_sale', 'batch_expense'].includes(value.entity?.type)) {
    observedAuditEvents.push(value);
  }
  originalLog(value, ...rest);
}

async function purgeVerificationTenants() {
  const organizations = await Organization.find({ slug: { $in: VERIFICATION_SLUGS } })
    .setOptions({ withDeleted: true })
    .select('_id slug')
    .lean();
  const businessIds = organizations.map(item => item._id);
  await User.deleteMany({ email: { $in: VERIFICATION_EMAILS } });
  if (!businessIds.length) return;
  const exactSlugs = new Set(organizations.map(item => item.slug));
  assert.deepEqual([...exactSlugs].every(slug => VERIFICATION_SLUGS.includes(slug)), true);
  await Promise.all([
    BatchSale.deleteMany({ businessId: { $in: businessIds } }),
    BatchExpense.deleteMany({ businessId: { $in: businessIds } }),
    FlockRecord.deleteMany({ businessId: { $in: businessIds } }),
    BirdBatch.deleteMany({ businessId: { $in: businessIds } }),
    Facility.deleteMany({ businessId: { $in: businessIds } }),
    Farm.deleteMany({ businessId: { $in: businessIds } })
  ]);
  await Organization.deleteMany({ _id: { $in: businessIds }, slug: { $in: VERIFICATION_SLUGS } });
}

async function createTenant(slug, suffix) {
  const organization = await Organization.create({
    legalName: `Financial Verification ${suffix} Pvt Ltd`,
    displayName: `Financial Verification ${suffix}`,
    slug,
    status: 'active',
    legal: { countryCode: 'IN' },
    contacts: { billingEmail: `${slug}@example.test` },
    approvedAt: new Date(),
    approvedBy: actorIds.admin
  });
  const farm = await Farm.create({
    businessId: organization._id,
    createdBy: actorIds.admin,
    code: `VF${suffix}`,
    name: `Verification Farm ${suffix}`,
    status: 'active',
    farmType: 'broiler',
    location: { address: `Verification ${suffix}`, countryCode: 'IN', timezone: 'Asia/Kolkata' },
    tags: ['financial-verification']
  });
  const facility = await Facility.create({
    businessId: organization._id,
    farmId: farm._id,
    createdBy: actorIds.admin,
    code: `SHED${suffix}`,
    name: `Verification Shed ${suffix}`,
    type: 'shed',
    status: 'active',
    capacity: 500
  });
  return { organization, farm, facility };
}

async function createBatch(tenant, definition) {
  return BirdBatch.create({
    businessId: tenant.organization._id,
    farmId: tenant.farm._id,
    batchId: undefined,
    createdBy: actorIds.admin,
    facilityId: tenant.facility._id,
    code: definition.code,
    breed: 'Cobb 500',
    birdType: 'broiler',
    initialBirdCount: definition.initialBirdCount,
    currentBirdCountCached: definition.initialBirdCount - (definition.mortality || 0) - (definition.culls || 0),
    placedAt: new Date('2026-06-01T00:00:00.000Z'),
    status: 'active'
  });
}

async function run() {
  const { options, environment } = initializeMigrationSafety(process.argv.slice(2));
  if (!options.commit) throw new Error('This verification writes isolated staging fixtures; rerun with --commit');
  if (environment.databaseName.toLowerCase() !== 'staging') throw new Error(`Refusing to run against non-staging database '${environment.databaseName}'`);

  await mongoose.connect(environment.mongoUri);
  originalLog(`Connected to isolated verification database: ${mongoose.connection.name}`);
  console.log = recordAuditLog;

  await purgeVerificationTenants();
  await User.create([
    { _id: actorIds.admin, email: VERIFICATION_EMAILS[0], authMethod: 'email', role: 'admin', accountStatus: 'active', name: 'Financial Verification Admin', agreedToTerms: true, approvedAt: new Date() },
    { _id: actorIds.business, email: VERIFICATION_EMAILS[1], authMethod: 'email', role: 'business', accountStatus: 'active', name: 'Financial Verification Business', agreedToTerms: true, approvedAt: new Date(), approvedBy: actorIds.admin },
    { _id: actorIds.farmer, email: VERIFICATION_EMAILS[2], authMethod: 'email', role: 'farmer', accountStatus: 'active', name: 'Financial Verification Farmer', agreedToTerms: true, approvedAt: new Date(), approvedBy: actorIds.admin }
  ]);
  const tenantA = await createTenant(fixture.tenantA.slug, 'A');
  const tenantB = await createTenant(fixture.tenantB.slug, 'B');
  const batchA = await createBatch(tenantA, fixture.tenantA.batchA);
  const batchB = await createBatch(tenantA, fixture.tenantA.batchB);
  const foreignBatch = await createBatch(tenantB, fixture.tenantB.batch);

  await FlockRecord.create({
    businessId: tenantA.organization._id,
    farmId: tenantA.farm._id,
    batchId: batchA._id,
    createdBy: actorIds.admin,
    recordDate: new Date('2026-07-01T00:00:00.000Z'),
    mortality: { count: fixture.tenantA.batchA.mortality, cause: 'Verification fixture' },
    culls: { count: fixture.tenantA.batchA.culls, reason: 'Verification fixture' },
    avgWeightGrams: 1800
  });

  const salePayload = (batchId, quantitySold, avgWeightKg, pricePerKg, notes) => ({
    batchId, saleDate: '2026-07-20', quantitySold, avgWeightKg, pricePerKg, buyerName: 'Verification Buyer', notes
  });
  const sale1 = await salesService.createSale(actors.admin, tenantA.organization._id, tenantA.farm._id, salePayload(batchA._id, 90, '2.000', '100.00', 'First partial sale'));
  await salesService.createSale(actors.admin, tenantA.organization._id, tenantA.farm._id, salePayload(batchA._id, 50, '2.200', '110.00', 'Second partial sale'));
  await salesService.createSale(actors.admin, tenantA.organization._id, tenantA.farm._id, salePayload(batchB._id, 80, '1.800', '120.00', 'Second batch sale'));
  const deletedSale = await salesService.createSale(actors.admin, tenantA.organization._id, tenantA.farm._id, salePayload(batchB._id, 10, '2.000', '100.00', 'Delete verification'));
  await salesService.updateSale(actors.admin, tenantA.organization._id, tenantA.farm._id, sale1._id, { quantitySold: 100 });
  await salesService.deleteSale(actors.admin, tenantA.organization._id, tenantA.farm._id, deletedSale._id);

  const expensePayload = (batchId, category, amount, description) => ({ batchId, category, amount, expenseDate: '2026-07-20', description });
  const feedExpense = await expensesService.createExpense(actors.admin, tenantA.organization._id, tenantA.farm._id, expensePayload(batchA._id, 'feed', '5000.00', 'Feed invoice'));
  await expensesService.createExpense(actors.admin, tenantA.organization._id, tenantA.farm._id, expensePayload(batchA._id, 'chicks', '3000.00', 'Chick placement'));
  await expensesService.createExpense(actors.admin, tenantA.organization._id, tenantA.farm._id, expensePayload(batchB._id, 'medicine_vaccines', '1000.00', 'Vaccination'));
  await expensesService.createExpense(actors.admin, tenantA.organization._id, tenantA.farm._id, expensePayload(null, 'utilities', '2000.00', 'Shared electricity'));
  const deletedExpense = await expensesService.createExpense(actors.admin, tenantA.organization._id, tenantA.farm._id, expensePayload(batchB._id, 'transport', '500.00', 'Delete verification'));
  await expensesService.updateExpense(actors.admin, tenantA.organization._id, tenantA.farm._id, feedExpense._id, { amount: '5500.00' });
  await expensesService.deleteExpense(actors.admin, tenantA.organization._id, tenantA.farm._id, deletedExpense._id);

  const oversaleStatus = await rejectedStatus(salesService.createSale(actors.admin, tenantA.organization._id, tenantA.farm._id, salePayload(batchA._id, fixture.expected.oversaleAttemptQuantity, '2.000', '100.00', 'Must fail')));
  const crossTenantSaleStatus = await rejectedStatus(salesService.createSale(actors.admin, tenantA.organization._id, tenantA.farm._id, salePayload(foreignBatch._id, 1, '2.000', '100.00', 'Must fail cross tenant')));
  const crossTenantExpenseStatus = await rejectedStatus(expensesService.createExpense(actors.admin, tenantA.organization._id, tenantA.farm._id, expensePayload(foreignBatch._id, 'feed', '1.00', 'Must fail cross tenant')));

  const businessSales = await salesService.listSales(actors.business, null, tenantA.farm._id, { limit: 100 });
  const businessExpenses = await expensesService.listExpenses(actors.business, null, tenantA.farm._id, { limit: 100 });
  const farmerSaleReadStatus = await rejectedStatus(salesService.listSales(actors.farmer, tenantA.organization._id, tenantA.farm._id, {}));
  const farmerExpenseReadStatus = await rejectedStatus(expensesService.listExpenses(actors.farmer, tenantA.organization._id, tenantA.farm._id, {}));

  const activeSales = await BatchSale.find({ businessId: tenantA.organization._id, farmId: tenantA.farm._id }).lean();
  const activeExpenses = await BatchExpense.find({ businessId: tenantA.organization._id, farmId: tenantA.farm._id }).lean();
  const directExpenses = activeExpenses.filter(item => item.batchId);
  const sharedExpenses = activeExpenses.filter(item => !item.batchId);
  const deletedSaleRow = await BatchSale.findOne({ _id: deletedSale._id }).setOptions({ withDeleted: true }).lean();
  const deletedExpenseRow = await BatchExpense.findOne({ _id: deletedExpense._id }).setOptions({ withDeleted: true }).lean();
  const aggregationQuery = { farmId: String(tenantA.farm._id), from: '2026-07-01', to: '2026-07-31', granularity: 'day' };
  const [overviewAggregation, batchesAggregation, revenueAggregation, historicalAggregation, forecastAggregation] = await Promise.all([
    aggregations.overview(actors.business, aggregationQuery),
    aggregations.batches(actors.business, { ...aggregationQuery, limit: 100 }),
    aggregations.batchwiseRevenue(actors.business, aggregationQuery),
    aggregations.historical(actors.business, aggregationQuery),
    aggregations.forecast(actors.business, aggregationQuery)
  ]);

  const result = {
    fixtureVersion: fixture.fixtureVersion,
    database: environment.databaseName,
    retainedTenantSlugs: VERIFICATION_SLUGS,
    activeSaleCount: activeSales.length,
    batchASaleCount: activeSales.filter(item => String(item.batchId) === String(batchA._id)).length,
    activeRevenue: sumMoney(activeSales, 'revenue'),
    activeExpenseCount: activeExpenses.length,
    directExpenseTotal: sumMoney(directExpenses, 'amount'),
    sharedExpenseTotal: sumMoney(sharedExpenses, 'amount'),
    allExpenseTotal: sumMoney(activeExpenses, 'amount'),
    businessSaleReadCount: businessSales.data.length,
    businessExpenseReadCount: businessExpenses.data.length,
    oversaleStatus,
    crossTenantSaleStatus,
    crossTenantExpenseStatus,
    farmerSaleReadStatus,
    farmerExpenseReadStatus,
    deletedSaleExcludedFromActive: !activeSales.some(item => String(item._id) === String(deletedSale._id)),
    deletedExpenseExcludedFromActive: !activeExpenses.some(item => String(item._id) === String(deletedExpense._id)),
    deletedSaleActor: String(deletedSaleRow.deletedBy),
    deletedExpenseActor: String(deletedExpenseRow.deletedBy),
    createdByActors: [...new Set([...activeSales, ...activeExpenses].map(item => String(item.createdBy)))],
    auditEventCount: observedAuditEvents.length,
    auditActors: [...new Set(observedAuditEvents.map(item => String(item.actor.id)))],
    canonicalAggregations: {
      overviewRevenue: overviewAggregation.totals.revenue.toFixed(2),
      overviewExpenses: overviewAggregation.totals.totalExpenses.toFixed(2),
      overviewOperationalProfit: overviewAggregation.totals.operationalProfit.toFixed(2),
      batchRowCount: batchesAggregation.data.length,
      batchwiseRevenue: revenueAggregation.stats.totalRevenue.toFixed(2),
      completedCohortCount: historicalAggregation.cohort.completedBatchCount,
      forecastAvailable: forecastAggregation.available,
      forecastReasonCode: forecastAggregation.reasonCode,
      completenessSaleEvents: overviewAggregation.completeness.saleEventCount,
      completenessExpenseEntries: overviewAggregation.completeness.expenseEntryCount
    }
  };

  for (const field of ['activeSaleCount', 'batchASaleCount', 'activeRevenue', 'activeExpenseCount', 'directExpenseTotal', 'sharedExpenseTotal', 'allExpenseTotal', 'businessSaleReadCount', 'businessExpenseReadCount']) {
    assert.equal(result[field], fixture.expected[field], field);
  }
  assert.equal(result.oversaleStatus, fixture.expected.oversaleStatus);
  assert.equal(result.crossTenantSaleStatus, fixture.expected.crossTenantSaleStatus);
  assert.equal(result.crossTenantExpenseStatus, fixture.expected.crossTenantExpenseStatus);
  assert.equal(result.farmerSaleReadStatus, fixture.expected.farmerReadStatus);
  assert.equal(result.farmerExpenseReadStatus, fixture.expected.farmerReadStatus);
  assert.equal(result.deletedSaleExcludedFromActive, true);
  assert.equal(result.deletedExpenseExcludedFromActive, true);
  assert.deepEqual(result.createdByActors, [String(actorIds.admin)]);
  assert.equal(result.deletedSaleActor, String(actorIds.admin));
  assert.equal(result.deletedExpenseActor, String(actorIds.admin));
  assert.deepEqual(result.auditActors, [String(actorIds.admin)]);
  assert.equal(result.auditEventCount, 13);
  assert.deepEqual(result.canonicalAggregations, {
    overviewRevenue: fixture.expected.activeRevenue,
    overviewExpenses: fixture.expected.allExpenseTotal,
    overviewOperationalProfit: '37880.00',
    batchRowCount: 2,
    batchwiseRevenue: fixture.expected.activeRevenue,
    completedCohortCount: 0,
    forecastAvailable: false,
    forecastReasonCode: 'INSUFFICIENT_HISTORY',
    completenessSaleEvents: fixture.expected.activeSaleCount,
    completenessExpenseEntries: fixture.expected.activeExpenseCount
  });

  originalLog('\nBATCH_FINANCIAL_VERIFICATION_RESULT');
  originalLog(JSON.stringify(result, null, 2));
  originalLog('\nVerification passed. The two tagged staging tenants were retained for aggregation tests.');
}

run()
  .catch(error => { console.error('Batch financial verification failed:', error); process.exitCode = 1; })
  .finally(async () => { console.log = originalLog; await mongoose.disconnect(); });
