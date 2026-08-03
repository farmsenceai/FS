/**
 * Close three existing demo farms under the farm-level tenure model.
 * Dry-run by default; --commit requires the shared staging safety controls.
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
const FarmProject = require('../modules/farm-projects/farm-projects.model');
const FarmProjectReview = require('../modules/farm-project-reviews/farm-project-reviews.model');
const farmsService = require('../modules/farms/farms.service');
const reviewsService = require('../modules/farm-project-reviews/farm-project-reviews.service');

const SUMMARY_PATH = path.join(__dirname, 'logs', '005-seed-summary.json');
const DAY = 24 * 60 * 60 * 1000;
const DEMO_FARM_NAMES = [
  'Meridian Poultry Farm',
  'Golden Harvest Farm',
  'Coastal Broilers',
  'Highland Poultry Estate',
  'Riverside Farm'
];
const CLOSURE_PLAN = [
  { name: 'Meridian Poultry Farm', expectedOffsetDays: 14, intendedClassification: 'Early' },
  { name: 'Golden Harvest Farm', expectedOffsetDays: 1, intendedClassification: 'On Time' },
  { name: 'Highland Poultry Estate', expectedOffsetDays: -10, intendedClassification: 'Delayed' }
];
const ACTIVE_FARM_NAMES = ['Coastal Broilers', 'Riverside Farm'];

function classify(closedAt, expectedTenureEndDate) {
  const differenceDays = (new Date(closedAt) - new Date(expectedTenureEndDate)) / DAY;
  if (Math.abs(differenceDays) <= 2) return 'On Time';
  return differenceDays < 0 ? 'Early' : 'Delayed';
}

async function resolveAdmin() {
  const admin = await User.findOne({ role: 'admin', accountStatus: { $ne: 'suspended' } })
    .sort('createdAt')
    .lean()
    .exec();
  if (!admin) throw new Error('No active admin User exists in the selected database');
  return { _id: admin._id, userId: admin._id, email: admin.email, role: 'admin' };
}

async function resolveDemoFarms() {
  const farms = await Farm.find({ name: { $in: DEMO_FARM_NAMES } }).lean().exec();
  const grouped = new Map();
  for (const farm of farms) {
    if (!grouped.has(farm.name)) grouped.set(farm.name, []);
    grouped.get(farm.name).push(farm);
  }
  const missing = DEMO_FARM_NAMES.filter(name => !grouped.has(name));
  const ambiguous = [...grouped.entries()].filter(([, matches]) => matches.length !== 1).map(([name]) => name);
  if (missing.length) throw new Error(`Prerequisite demo farms are missing: ${missing.join(', ')}. Run migration 004 first.`);
  if (ambiguous.length) throw new Error(`Demo farm names are ambiguous: ${ambiguous.join(', ')}`);
  const resolved = new Map([...grouped.entries()].map(([name, matches]) => [name, matches[0]]));
  const businessIds = new Set([...resolved.values()].map(farm => String(farm.businessId)));
  if (businessIds.size !== 1) throw new Error('The five demo farms do not belong to one organization; refusing to guess ownership');
  for (const farm of resolved.values()) {
    if (!(farm.tags || []).includes('demo')) throw new Error(`Farm is not tagged as demo; refusing to touch it: ${farm.name}`);
  }
  return resolved;
}

async function inspectProjectHistory(farm) {
  const projects = await FarmProject.find({ farmId: farm._id }).select('_id title status').lean().exec();
  const projectIds = projects.map(project => project._id);
  const reviewCounts = projectIds.length
    ? await FarmProjectReview.aggregate([
        { $match: { projectId: { $in: projectIds }, deletedAt: null } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } }
      ]).exec()
    : [];
  const countsByProject = new Map(reviewCounts.map(row => [String(row._id), row.count]));
  return projects.map(project => ({
    projectId: String(project._id),
    title: project.title,
    status: project.status,
    reviewCount: countsByProject.get(String(project._id)) || 0
  }));
}

async function writeSummary(summary) {
  await fs.mkdir(path.dirname(SUMMARY_PATH), { recursive: true });
  await fs.writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
}

async function runSeed({ commit = false } = {}) {
  assertCommitSafety({ commit, databaseName: MIGRATION_ENVIRONMENT.databaseName });
  await mongoose.connect(MIGRATION_ENVIRONMENT.mongoUri);
  try {
    console.log(`Mode: ${commit ? 'COMMIT' : 'DRY RUN (no database writes)'}`);
    const [admin, demoFarms] = await Promise.all([resolveAdmin(), resolveDemoFarms()]);
    const now = new Date();
    const closed = [];
    const skipped = [];

    for (const plan of CLOSURE_PLAN) {
      let farm = demoFarms.get(plan.name);
      const projectHistory = await inspectProjectHistory(farm);
      if (farm.status === 'closed') {
        const rating = await reviewsService.getAverageRatingForFarm(farm._id);
        skipped.push({
          farmName: farm.name,
          reason: 'already closed',
          expectedTenureEndDate: farm.expectedTenureEndDate,
          closedAt: farm.closedAt,
          classification: farm.expectedTenureEndDate && farm.closedAt ? classify(farm.closedAt, farm.expectedTenureEndDate) : 'Not tracked',
          averageRating: Number((rating.averageRating || 0).toFixed(2)),
          reviewCount: rating.reviewCount,
          projectHistory
        });
        console.log(`[SKIP] ${farm.name} is already closed`);
        continue;
      }

      const expectedTenureEndDate = new Date(now.getTime() + plan.expectedOffsetDays * DAY);
      let closedAt = now;
      if (commit) {
        await farmsService.updateFarm(admin, farm.businessId, farm._id, { expectedTenureEndDate });
        farm = await farmsService.closeFarm(admin, farm.businessId, farm._id);
        closedAt = farm.closedAt;
      }
      const rating = await reviewsService.getAverageRatingForFarm(farm._id);
      const row = {
        farmName: farm.name,
        expectedTenureEndDate: expectedTenureEndDate.toISOString(),
        closedAt: new Date(closedAt).toISOString(),
        classification: classify(closedAt, expectedTenureEndDate),
        intendedClassification: plan.intendedClassification,
        averageRating: Number((rating.averageRating || 0).toFixed(2)),
        reviewCount: rating.reviewCount,
        completedProjectCount: projectHistory.filter(project => project.status === 'completed').length,
        projectCount: projectHistory.length,
        projectsWithoutReviews: projectHistory.filter(project => project.reviewCount === 0).map(project => project.title),
        nonCompletedProjects: projectHistory.filter(project => project.status !== 'completed').map(project => ({ title: project.title, status: project.status })),
        projectHistory
      };
      closed.push(row);
      console.log(`[${commit ? 'CLOSED' : 'WOULD CLOSE'}] ${farm.name}: ${row.classification}`);
    }

    const active = ACTIVE_FARM_NAMES.map(name => demoFarms.get(name)).map(farm => ({ farmName: farm.name, status: farm.status }));
    const unexpectedlyInactive = active.filter(farm => farm.status !== 'active');
    if (unexpectedlyInactive.length) console.warn('Expected active demo farms have other statuses:', unexpectedlyInactive);
    const summary = {
      generatedAt: new Date().toISOString(),
      mode: commit ? 'commit' : 'dry-run',
      targetDatabase: MIGRATION_ENVIRONMENT.databaseName,
      counts: { farmsClosed: closed.length, farmsSkipped: skipped.length, farmsLeftUntouched: active.length },
      closed,
      skipped,
      activeUntouched: active
    };
    await writeSummary(summary);
    console.table([...closed, ...skipped].map(row => ({ farm: row.farmName, expectedEnd: row.expectedTenureEndDate ? new Date(row.expectedTenureEndDate).toISOString().slice(0, 10) : '—', closedAt: row.closedAt ? new Date(row.closedAt).toISOString().slice(0, 10) : '—', result: row.classification, rating: row.reviewCount ? `${row.averageRating} (${row.reviewCount})` : 'No ratings' })));
    console.log('Active demo farms left untouched:', active.map(farm => `${farm.farmName} (${farm.status})`).join(', '));
    console.log(`Summary written to ${SUMMARY_PATH}`);
    return summary;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runSeed(CLI_OPTIONS).catch(error => {
    console.error('Farm tenure completion demo seed failed:', error.details || error.message || error);
    process.exitCode = 1;
  });
}

module.exports = { ACTIVE_FARM_NAMES, CLOSURE_PLAN, DEMO_FARM_NAMES, classify, runSeed };
