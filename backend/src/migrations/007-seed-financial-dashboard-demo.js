/**
 * Repeatable canonical financial-dashboard demo seed.
 * Dry-run by default. Commits use shared non-production safety controls and
 * replace only FIN-DEMO-* batches.
 */
const { assertCommitSafety, initializeMigrationSafety } = require('./lib/safety');

let CLI_OPTIONS;
let MIGRATION_ENVIRONMENT;
try {
  const safety = initializeMigrationSafety(process.argv.slice(2));
  CLI_OPTIONS = safety.options;
  MIGRATION_ENVIRONMENT = safety.environment;
} catch (error) {
  console.error(error.message);
  if (require.main === module) process.exit(1);
  throw error;
}

const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Organization = require('../modules/organizations/organizations.model');
const Farm = require('../modules/farms/farms.model');
const Facility = require('../modules/facilities/facilities.model');
const BirdBatch = require('../modules/bird-batches/bird-batches.model');
const FlockRecord = require('../modules/flock-records/flock-records.model');
const BatchSale = require('../modules/batch-sales/batch-sales.model');
const BatchExpense = require('../modules/batch-expenses/batch-expenses.model');
const User = require('../../models/User');
const aggregations = require('../modules/financial-aggregations/financial-aggregations.service');
const { buildFinancialDashboardFixture, utcDay } = require('../../data/financial-dashboard-demo.fixture');

const TARGET_ORGANIZATION_SLUG = 'financial-dashboard-demo';
const DEMO_TAG = 'canonical-financial-dashboard-demo';
const DEMO_FARMS = [
  { code: 'FDD-NORTH', name: 'Northfield Broiler Farm', address: 'Demo Site, Karnal, Haryana' },
  { code: 'FDD-RIVER', name: 'Riverside Poultry Farm', address: 'Demo Site, Vijayawada, Andhra Pradesh' },
  { code: 'FDD-GREEN', name: 'Green Acres Poultry Farm', address: 'Demo Site, Coimbatore, Tamil Nadu' }
];

function decimal(value) {
  return mongoose.Types.Decimal128.fromString(Number(value).toFixed(2));
}
function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
function expenseDescription(code, category) {
  return `${DEMO_TAG}: ${code} ${category.replace(/_/g, ' ')}`;
}

async function resolveContext(commit) {
  const admin = await User.findOne({ role: 'admin', accountStatus: 'active' }).select('_id email role').lean();
  if (!admin) throw new Error('No active admin user exists to attribute canonical seed records');
  let organization = await Organization.findOne({ slug: TARGET_ORGANIZATION_SLUG }).lean();
  if (!organization) {
    const payload = {
      _id: new mongoose.Types.ObjectId(),
      legalName: 'Financial Dashboard Demo Operations',
      displayName: 'Financial Dashboard Demo',
      slug: TARGET_ORGANIZATION_SLUG,
      status: 'active',
      legal: { countryCode: 'IN' },
      contacts: { billingEmail: 'financial-dashboard-demo@example.test' },
      defaultCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      approvedAt: new Date(),
      approvedBy: admin._id
    };
    organization = commit ? (await Organization.create(payload)).toObject() : payload;
  }
  const farms = [];
  const facilities = [];
  for (const definition of DEMO_FARMS) {
    let farm = await Farm.findOne({ businessId: organization._id, code: definition.code }).lean();
    if (!farm) {
      const payload = {
        _id: new mongoose.Types.ObjectId(), businessId: organization._id, createdBy: admin._id, source: 'import',
        code: definition.code, name: definition.name, status: 'active', farmType: 'broiler',
        location: { address: definition.address, countryCode: 'IN', timezone: 'Asia/Kolkata' },
        capacity: { birdCapacity: 60000 }, tags: [DEMO_TAG], openedAt: utcDay(new Date(), -900)
      };
      farm = commit ? (await Farm.create(payload)).toObject() : payload;
    }
    let facility = await Facility.findOne({ businessId: organization._id, farmId: farm._id, code: 'FIN-SHED' }).lean();
    if (!facility) {
      const payload = {
        _id: new mongoose.Types.ObjectId(), businessId: organization._id, farmId: farm._id, createdBy: admin._id, source: 'import',
        code: 'FIN-SHED', name: 'Financial Demo Broiler Shed', type: 'shed', status: 'active', capacity: 30000,
        metadata: { seedTag: DEMO_TAG }
      };
      facility = commit ? (await Facility.create(payload)).toObject() : payload;
    }
    farms.push(farm);
    facilities.push(facility);
  }
  return { organization, admin, farms, facilities };
}

async function removePreviousSeed(businessId) {
  const batches = await BirdBatch.find({ businessId, code: /^FIN-DEMO-/ }).setOptions({ withDeleted: true }).select('_id code').lean();
  const ids = batches.map(batch => batch._id);
  const orphanShared = await BatchExpense.deleteMany({ businessId, batchId: null, description: new RegExp(`^${DEMO_TAG}:`) });
  if (!ids.length) return { batches: 0, sales: 0, expenses: orphanShared.deletedCount, records: 0 };
  const [sales, expenses, records, removedBatches] = await Promise.all([
    BatchSale.deleteMany({ businessId, batchId: { $in: ids } }),
    BatchExpense.deleteMany({ businessId, batchId: { $in: ids } }),
    FlockRecord.deleteMany({ businessId, batchId: { $in: ids } }),
    BirdBatch.deleteMany({ businessId, _id: { $in: ids }, code: /^FIN-DEMO-/ })
  ]);
  return { batches: removedBatches.deletedCount, sales: sales.deletedCount, expenses: expenses.deletedCount + orphanShared.deletedCount, records: records.deletedCount };
}

function recordSeries(batch, profile, completed, actorId) {
  const points = completed
    ? [
        { day: 7, feed: 3500, water: 12000, weight: 210, mortalityShare: 0.25 },
        { day: 18, feed: 14500, water: 29000, weight: 820, mortalityShare: 0.3 },
        { day: 30, feed: 22000, water: 39000, weight: 1620, mortalityShare: 0.25 },
        { day: 41, feed: 27000, water: 47000, weight: Math.round(profile.avgWeightKg * 1000), mortalityShare: 0.2 }
      ]
    : [
        { day: 7, feed: 3300, water: 11500, weight: 205, mortalityShare: 0.4 },
        { day: 14, feed: 9000, water: 21000, weight: 610, mortalityShare: 0.35 },
        { day: Math.max(15, profile.placedDaysAgo - 1), feed: 15000, water: 30000, weight: 1250 + profile.placedDaysAgo * 22, mortalityShare: 0.25 }
      ];
  const totalMortality = completed
    ? Math.round(profile.initialBirdCount * profile.mortalityPct / 100)
    : Math.round(profile.initialBirdCount * 0.008);
  return points.map((point, index) => ({
    businessId: batch.businessId,
    farmId: batch.farmId,
    batchId: batch._id,
    createdBy: actorId,
    source: 'import',
    recordDate: utcDay(new Date(batch.placedAt), point.day),
    feed: { consumedKg: point.feed, remainingStockKg: Math.max(0, 90000 - points.slice(0, index + 1).reduce((sum, row) => sum + row.feed, 0)) },
    water: { consumedLiters: point.water },
    mortality: { count: Math.round(totalMortality * point.mortalityShare), cause: index % 2 ? 'Natural loss' : 'Early-cycle loss' },
    culls: { count: index === points.length - 1 ? Math.round(profile.initialBirdCount * 0.003) : 0, reason: index === points.length - 1 ? 'Quality cull' : undefined },
    avgWeightGrams: point.weight,
    observations: `${DEMO_TAG}: imported ${completed ? 'completed' : 'active'} batch observation`,
    enteredVia: 'import',
    syncStatus: 'verified'
  }));
}

function completedSales(batch, profile, actorId) {
  const quantitySold = Math.floor(profile.initialBirdCount * profile.soldFraction);
  const firstQuantity = Math.floor(quantitySold * 0.58);
  const quantities = [firstQuantity, quantitySold - firstQuantity];
  return quantities.map((quantity, index) => {
    const avgWeightKg = profile.avgWeightKg + (index ? 0.04 : -0.03);
    const pricePerKg = profile.revenuePerBird / profile.avgWeightKg;
    return {
      businessId: batch.businessId, farmId: batch.farmId, batchId: batch._id, createdBy: actorId, source: 'import',
      saleDate: utcDay(new Date(profile.actualHarvestAt), index - 1),
      quantitySold: quantity,
      avgWeightKg: decimal(avgWeightKg),
      pricePerKg: decimal(pricePerKg),
      revenue: decimal(roundMoney(quantity * avgWeightKg * pricePerKg)),
      buyerName: ['Kaveri Poultry Traders', 'Deccan Fresh Foods', 'Southern Live Bird Market'][(Number(batch.code.slice(-2)) + index) % 3],
      notes: `${DEMO_TAG}: partial sale ${index + 1} of 2`
    };
  });
}

function expenseRows(batch, profile, actorId, shares, completed) {
  const target = profile.initialBirdCount * (completed ? profile.expensePerBird : 118);
  const date = completed ? utcDay(new Date(profile.actualHarvestAt), -20) : utcDay(new Date(), -5);
  return Object.entries(shares).map(([category, share], index) => ({
    businessId: batch.businessId, farmId: batch.farmId, batchId: batch._id, createdBy: actorId, source: 'import',
    category, amount: decimal(roundMoney(target * share)), expenseDate: utcDay(date, index - 3),
    description: expenseDescription(batch.code, category)
  }));
}

async function insertFixture(context, fixture) {
  const batches = [];
  for (const [index, profile] of [...fixture.completed, ...fixture.active].entries()) {
    const completed = index < fixture.completed.length;
    const farm = context.farms[profile.farmIndex];
    const facility = context.facilities[profile.farmIndex];
    batches.push(await BirdBatch.create({
      businessId: context.organization._id, farmId: farm._id, facilityId: facility._id, createdBy: context.admin._id,
      source: 'import', code: profile.code, breed: index % 3 === 1 ? 'Ross 308' : 'Cobb 500', birdType: 'broiler',
      initialBirdCount: profile.initialBirdCount, currentBirdCountCached: completed ? 0 : Math.round(profile.initialBirdCount * 0.989),
      placedAt: profile.placedAt, expectedHarvestAt: profile.expectedHarvestAt,
      actualHarvestAt: completed ? profile.actualHarvestAt : undefined,
      status: completed ? 'completed' : 'active', notes: `${DEMO_TAG}: canonical interconnected demo batch`
    }));
  }

  const records = [];
  const sales = [];
  const expenses = [];
  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const completed = index < fixture.completed.length;
    const profile = completed ? fixture.completed[index] : fixture.active[index - fixture.completed.length];
    records.push(...recordSeries(batch, profile, completed, context.admin._id));
    expenses.push(...expenseRows(batch, profile, context.admin._id, fixture.expenseShares, completed));
    if (completed) sales.push(...completedSales(batch, profile, context.admin._id));
    else if (profile.partialSaleQuantity) {
      const avgWeightKg = 1.92;
      const pricePerKg = 106;
      sales.push({
        businessId: batch.businessId, farmId: batch.farmId, batchId: batch._id, createdBy: context.admin._id, source: 'import',
        saleDate: utcDay(new Date(), -3), quantitySold: profile.partialSaleQuantity, avgWeightKg: decimal(avgWeightKg),
        pricePerKg: decimal(pricePerKg), revenue: decimal(profile.partialSaleQuantity * avgWeightKg * pricePerKg),
        buyerName: 'Kaveri Poultry Traders', notes: `${DEMO_TAG}: active-batch partial sale`
      });
    }
  }
  for (const [index, farm] of context.farms.entries()) {
    expenses.push({
      businessId: context.organization._id, farmId: farm._id, batchId: null, createdBy: context.admin._id, source: 'import',
      category: index === 0 ? 'utilities' : index === 1 ? 'labor' : 'transport',
      amount: decimal(45000 + index * 12500), expenseDate: utcDay(new Date(), -7 - index),
      description: `${DEMO_TAG}: shared farm expense for ${farm.name}`
    });
  }
  await Promise.all([FlockRecord.insertMany(records), BatchSale.insertMany(sales), BatchExpense.insertMany(expenses)]);
  return { batches, records, sales, expenses };
}

async function verifySeed(context, fixture) {
  const now = new Date();
  const from = utcDay(now, -729);
  const to = utcDay(now, 0);
  const query = { businessId: String(context.organization._id), from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), granularity: 'month', horizonDays: '60' };
  const actor = { _id: context.admin._id, role: 'admin' };
  const [overview, revenue, historical, forecast] = await Promise.all([
    aggregations.overview(actor, query),
    aggregations.batchwiseRevenue(actor, query),
    aggregations.historical(actor, query),
    aggregations.forecast(actor, query)
  ]);
  assert.equal(historical.cohort.completedBatchCount, fixture.completed.length);
  assert.equal(forecast.available, true, forecast.reason);
  assert.equal(forecast.historicalSample.eligibleBatchCount, fixture.completed.length);
  assert.equal(forecast.batches.length, 3);
  assert.ok(overview.totals.revenue > 0);
  assert.ok(overview.totals.totalExpenses > 0);
  assert.ok(revenue.stats.batchesWithSales >= fixture.completed.length);
  return {
    overview: overview.totals,
    batchesWithSales: revenue.stats.batchesWithSales,
    completedCohortCount: historical.cohort.completedBatchCount,
    forecastAvailable: forecast.available,
    forecastEligibleHistory: forecast.historicalSample.eligibleBatchCount,
    forecastActiveBatchCount: forecast.batches.length,
    backtest: forecast.backtest
  };
}

async function runSeed({ commit = false } = {}) {
  assertCommitSafety({ commit, databaseName: MIGRATION_ENVIRONMENT.databaseName });
  await mongoose.connect(MIGRATION_ENVIRONMENT.mongoUri);
  try {
    const context = await resolveContext(commit);
    const fixture = buildFinancialDashboardFixture(new Date());
    console.log(`Mode: ${commit ? 'COMMIT' : 'DRY RUN'}; organization=${context.organization.slug}; actor=${context.admin.email}`);
    console.table(context.farms.map((farm, index) => ({ farm: farm.name, farmId: String(farm._id), facility: context.facilities[index].code, facilityId: String(context.facilities[index]._id) })));
    console.log(`Planned canonical facts: ${fixture.completed.length} completed batches, ${fixture.active.length} active batches, ${fixture.completed.length * 2 + 1} sale events, ${(fixture.completed.length + fixture.active.length) * 7 + context.farms.length} expenses.`);
    if (!commit) return { mode: 'dry-run', organizationId: String(context.organization._id), fixture };
    const removed = await removePreviousSeed(context.organization._id);
    const inserted = await insertFixture(context, fixture);
    const verification = await verifySeed(context, fixture);
    const result = {
      mode: 'commit', database: MIGRATION_ENVIRONMENT.databaseName, organizationId: String(context.organization._id),
      farmIds: context.farms.map(farm => String(farm._id)), removed,
      inserted: { batches: inserted.batches.length, records: inserted.records.length, sales: inserted.sales.length, expenses: inserted.expenses.length },
      verification
    };
    console.log('\nFINANCIAL_DASHBOARD_DEMO_SEED_RESULT');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) runSeed(CLI_OPTIONS).catch(error => { console.error('Financial dashboard demo seed failed:', error); process.exitCode = 1; });

module.exports = { DEMO_FARMS, DEMO_TAG, TARGET_ORGANIZATION_SLUG, runSeed };
