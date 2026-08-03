/**
 * Add future-dated farmer fees to four existing demo farms.
 * Dry-run by default; --commit requires the shared migration safety controls.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const mongoose = require('mongoose');
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

const User = require('../../models/User');
const Farm = require('../modules/farms/farms.model');
const FarmAssignment = require('../modules/farm-assignments/farm-assignments.model');
const FarmerFee = require('../modules/farmer-fees/farmer-fees.model');
const farmerFeesService = require('../modules/farmer-fees/farmer-fees.service');

const DAY = 24 * 60 * 60 * 1000;
const MARKER = '[DEMO-UPCOMING-007]';
const SUMMARY_PATH = path.join(__dirname, 'logs', '007-seed-summary.json');
const FEE_PLAN = [
  { farmName: 'Meridian Poultry Farm', daysAhead: 5, amount: 13500, description: `Final ventilation service contribution ${MARKER}` },
  { farmName: 'Golden Harvest Farm', daysAhead: 9, amount: 17500, description: `Seasonal shed maintenance contribution ${MARKER}` },
  { farmName: 'Coastal Broilers', daysAhead: 14, amount: 9200, description: `Water filtration maintenance contribution ${MARKER}` },
  { farmName: 'Riverside Farm', daysAhead: 20, amount: 11800, description: `Feed storage upkeep contribution ${MARKER}` }
];

function actorFromAdmin(admin) {
  return { _id: admin._id, userId: admin._id, role: 'admin', email: admin.email };
}

async function resolveAdmin() {
  const admin = await User.findOne({ role: 'admin', accountStatus: { $ne: 'suspended' } }).sort('createdAt').lean().exec();
  if (!admin) throw new Error('No active admin User exists in the selected database');
  return admin;
}

async function resolveDemoFarm(name) {
  const matches = await Farm.find({ name }).lean().exec();
  if (matches.length !== 1) throw new Error(`Expected exactly one demo farm named ${name}; found ${matches.length}`);
  const farm = matches[0];
  if (!(farm.tags || []).includes('demo')) throw new Error(`Farm is not tagged demo; refusing to touch it: ${name}`);
  return farm;
}

async function resolveFarmer(farm) {
  const assignment = await FarmAssignment.findOne({ farmId: farm._id, status: 'active' })
    .populate({ path: 'userId', select: 'name email role accountStatus', match: { role: 'farmer', accountStatus: 'active' } })
    .sort('createdAt')
    .exec();
  if (!assignment?.userId) throw new Error(`No active assigned demo farmer found for ${farm.name}`);
  return assignment.userId;
}

async function distribution(now) {
  const fees = await FarmerFee.find({}).select('status dueDate').lean().exec();
  return {
    total: fees.length,
    paid: fees.filter(fee => fee.status === 'paid').length,
    pendingOverdue: fees.filter(fee => fee.status === 'pending' && fee.dueDate && new Date(fee.dueDate) < now).length,
    pendingUpcoming: fees.filter(fee => fee.status === 'pending' && fee.dueDate && new Date(fee.dueDate) >= now).length,
    pendingWithoutDueDate: fees.filter(fee => fee.status === 'pending' && !fee.dueDate).length,
    cancelled: fees.filter(fee => fee.status === 'cancelled').length
  };
}

async function writeSummary(summary) {
  await fs.mkdir(path.dirname(SUMMARY_PATH), { recursive: true });
  await fs.writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
}

async function runSeed({ commit = false } = {}) {
  assertCommitSafety({ commit, databaseName: MIGRATION_ENVIRONMENT.databaseName });
  await mongoose.connect(MIGRATION_ENVIRONMENT.mongoUri);
  try {
    const now = new Date();
    const admin = await resolveAdmin();
    const before = await distribution(now);
    const created = [];
    const skipped = [];

    console.log(`Mode: ${commit ? 'COMMIT' : 'DRY RUN (no database writes)'}`);
    for (const plan of FEE_PLAN) {
      const farm = await resolveDemoFarm(plan.farmName);
      const farmer = await resolveFarmer(farm);
      const existing = await FarmerFee.findOne({ farmId: farm._id, description: plan.description }).lean().exec();
      if (existing) {
        skipped.push({ farmName: farm.name, farmerName: farmer.name, description: plan.description, reason: 'already exists', feeId: String(existing._id), dueDate: existing.dueDate });
        console.log(`[SKIP] ${farm.name}: upcoming demo fee already exists`);
        continue;
      }

      const dueDate = new Date(now.getTime() + plan.daysAhead * DAY);
      const payload = { farmerId: farmer._id, farmId: farm._id, amount: plan.amount, currency: 'INR', description: plan.description, status: 'pending', dueDate };
      const fee = commit ? await farmerFeesService.createFee(actorFromAdmin(admin), payload) : { _id: null, ...payload };
      created.push({ feeId: fee._id ? String(fee._id) : null, farmName: farm.name, farmerName: farmer.name, farmerEmail: farmer.email, amount: plan.amount, status: 'pending', dueDate: dueDate.toISOString(), daysAhead: plan.daysAhead, description: plan.description });
      console.log(`[${commit ? 'CREATED' : 'WOULD CREATE'}] ${farm.name} / ${farmer.name}: INR ${plan.amount} due ${dueDate.toISOString().slice(0, 10)}`);
    }

    const databaseAfter = await distribution(now);
    const projectedAfter = commit ? databaseAfter : { ...databaseAfter, total: databaseAfter.total + created.length, pendingUpcoming: databaseAfter.pendingUpcoming + created.length };
    const summary = { generatedAt: new Date().toISOString(), mode: commit ? 'commit' : 'dry-run', targetDatabase: MIGRATION_ENVIRONMENT.databaseName, marker: MARKER, counts: { created: created.length, skipped: skipped.length }, distributionBefore: before, distributionAfter: projectedAfter, created, skipped };
    await writeSummary(summary);
    console.table(created.map(row => ({ farm: row.farmName, farmer: row.farmerName, amount: row.amount, status: row.status, dueDate: row.dueDate.slice(0, 10), daysAhead: row.daysAhead })));
    console.log('Distribution after:', projectedAfter);
    console.log(`Summary written to ${SUMMARY_PATH}`);
    return summary;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runSeed(CLI_OPTIONS).catch(error => {
    console.error('Upcoming farmer fee demo seed failed:', error.details || error.message || error);
    process.exitCode = 1;
  });
}

module.exports = { FEE_PLAN, MARKER, runSeed };
