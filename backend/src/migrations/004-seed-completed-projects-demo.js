/**
 * Seed five unmistakably-demo farms with completed-project data.
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
const Organization = require('../modules/organizations/organizations.model');
const Farm = require('../modules/farms/farms.model');
const organizationsService = require('../modules/organizations/organizations.service');
const farmsService = require('../modules/farms/farms.service');
const facilitiesService = require('../modules/facilities/facilities.service');
const managersService = require('../modules/managers/managers.service');
const farmAssignmentsService = require('../modules/farm-assignments/farm-assignments.service');
const birdBatchesService = require('../modules/bird-batches/bird-batches.service');
const flockRecordsService = require('../modules/flock-records/flock-records.service');
const farmProjectsService = require('../modules/farm-projects/farm-projects.service');
const farmerFeesService = require('../modules/farmer-fees/farmer-fees.service');
const reviewsService = require('../modules/farm-project-reviews/farm-project-reviews.service');
const authService = require('../../modules/auth/auth.service');

const SUMMARY_PATH = path.join(__dirname, 'logs', '004-seed-summary.json');
const DAY = 24 * 60 * 60 * 1000;
const DEMO_ORGANIZATION = {
  legalName: 'FarmSence Demo Estates',
  displayName: 'FarmSence Demo Estates [DEMO]',
  slug: 'farmsence-demo-estates',
  legal: { countryCode: 'IN' },
  contacts: { billingEmail: 'billing@demo.farmsence.ai' },
  defaultCurrency: 'INR',
  timezone: 'Asia/Kolkata'
};

const FARMS = [
  {
    name: 'Meridian Poultry Farm', code: 'DEMO-MERIDIAN', address: 'Doddaballapur, Bengaluru Rural, Karnataka 561203', geo: [77.5385, 13.2927], capacity: 18000,
    project: ['Broiler Shed Construction', 118, 56, -8, 'A climate-controlled broiler shed built for efficient flock cycles.'],
    managers: [['Arjun Mehta', 'arjun.mehta'], ['Kavya Nair', 'kavya.nair']],
    farmers: [['Ramesh Gowda', 'ramesh.gowda'], ['Lakshmi Devi', 'lakshmi.devi'], ['Manjunath Rao', 'manjunath.rao']],
    fees: [[25000, 'paid'], [18000, 'paid'], [12000, 'pending']], ratings: [[5, 'Great work, finished ahead of schedule.'], [5, 'Excellent shed design and ventilation.'], [4, 'Good coordination throughout the work.']]
  },
  {
    name: 'Golden Harvest Farm', code: 'DEMO-GOLDEN', address: 'Shamirpet, Medchal-Malkajgiri, Telangana 500078', geo: [78.5783, 17.5948], capacity: 22000,
    project: ['Poultry Shed Expansion', 104, 63, 1, 'An additional shed wing added to increase broiler capacity.'],
    managers: [['Neha Kulkarni', 'neha.kulkarni']],
    farmers: [['Suresh Reddy', 'suresh.reddy'], ['Anitha Reddy', 'anitha.reddy']],
    fees: [[22000, 'paid'], [14000, 'pending'], [9000, 'paid'], [8000, 'pending']], ratings: [[5, 'Solid construction quality and timely handover.'], [4, 'The expanded shed is working very well.']]
  },
  {
    name: 'Coastal Broilers', code: 'DEMO-COASTAL', address: 'Kundapura, Udupi, Karnataka 576201', geo: [74.6901, 13.6316], capacity: 15000,
    project: ['Water System Installation', 92, 49, 0, 'A reliable filtered water distribution system installed across the shed.'],
    managers: [['Vikram Shetty', 'vikram.shetty']],
    farmers: [['Prakash Poojary', 'prakash.poojary'], ['Meera Bhat', 'meera.bhat'], ['Ganesh Naik', 'ganesh.naik']],
    fees: [[16000, 'paid'], [11000, 'paid'], [8500, 'pending']], ratings: [[4, 'Reliable water flow and neat installation.'], [5, 'Very professional work from start to finish.']]
  },
  {
    name: 'Highland Poultry Estate', code: 'DEMO-HIGHLAND', address: 'Pollachi, Coimbatore, Tamil Nadu 642001', geo: [77.0088, 10.6588], capacity: 26000,
    project: ['Ventilation and Cooling Upgrade', 126, 70, 12, 'Tunnel ventilation and cooling pads upgraded for summer flock comfort.'],
    managers: [['Priya Iyer', 'priya.iyer'], ['Rohit Menon', 'rohit.menon']],
    farmers: [['Kannan Murugan', 'kannan.murugan'], ['Selvi Rajan', 'selvi.rajan']],
    fees: [[24000, 'paid'], [19500, 'pending'], [12500, 'paid']], ratings: [[3, 'Good quality, though completion took longer than expected.'], [4, 'Cooling performance has improved noticeably.']]
  },
  {
    name: 'Riverside Farm', code: 'DEMO-RIVERSIDE', address: 'Nashik Road, Nashik, Maharashtra 422101', geo: [73.8567, 19.9975], capacity: 20000,
    project: ['Feed Storage and Utility Setup', 98, 56, -4, 'A weatherproof feed store and utility area completed beside the main shed.'],
    managers: [['Aditi Deshmukh', 'aditi.deshmukh']],
    farmers: [['Mahesh Patil', 'mahesh.patil'], ['Sunita Jadhav', 'sunita.jadhav'], ['Deepak More', 'deepak.more']],
    fees: [[21000, 'paid'], [15000, 'paid'], [10000, 'pending']], ratings: [[5, 'Finished early with excellent workmanship.'], [4, 'Clean, practical construction and good communication.'], [5, 'The new storage area is very useful.']]
  }
];

const UPDATE_NOTES = [
  'Site layout and material plan approved',
  'Foundation work completed',
  'Structural framing erected',
  'Roofing and weather protection installed',
  'Electrical and utility connections completed',
  'Final inspection passed and project handed over'
];

function planned(data) { return { _id: new mongoose.Types.ObjectId(), ...data }; }
function daysBefore(reference, days) { return new Date(reference.getTime() - days * DAY); }
function addDays(reference, days) { return new Date(reference.getTime() + days * DAY); }
function classify(completedAt, targetDate) {
  const difference = Math.round((completedAt - targetDate) / DAY);
  if (difference < -2) return 'early';
  if (difference > 2) return 'delayed';
  return 'on-time';
}
function actorFromUser(user) {
  return { _id: user._id, userId: user._id, email: user.email, role: user.role };
}

async function resolveAdmin() {
  const user = await User.findOne({ role: 'admin', accountStatus: { $ne: 'suspended' } }).sort('createdAt').lean().exec();
  if (!user) throw new Error('No active admin User exists in the selected database');
  return actorFromUser(user);
}

async function resolveOrganization(admin, commit) {
  let organization = await Organization.findOne({ slug: 'farmsence-operations' }).lean().exec();
  if (!organization) organization = await Organization.findOne({ slug: DEMO_ORGANIZATION.slug }).lean().exec();
  if (organization) return { organization, created: false };
  organization = commit ? await organizationsService.createOrganization(admin, DEMO_ORGANIZATION) : planned(DEMO_ORGANIZATION);
  return { organization, created: true };
}

async function createFarmer(admin, farm, person, index, commit) {
  const [name, localPart] = person;
  const email = `${farm.code.toLowerCase()}.${localPart}@demo.farmsence.ai`;
  const phone = `+919100${String(index).padStart(6, '0')}`;
  if (!commit) return planned({ name, email, phone, role: 'farmer', accountStatus: 'active' });
  await authService.registerUser({ email, password: `DemoFarm!${index}Seed`, role: 'farmer' });
  const user = await User.findOne({ email }).exec();
  await authService.updateMyProfile(user._id, { name, email, phone, requestedFarmId: farm._id });
  return User.findById(user._id).exec();
}

async function seedFarm(admin, businessId, config, farmIndex, commit) {
  const now = new Date();
  const [title, startDaysAgo, durationDays, completionOffset, description] = config.project;
  const startDate = daysBefore(now, startDaysAgo);
  const targetDate = addDays(startDate, durationDays);
  const completedAt = addDays(targetDate, completionOffset);
  const farmPayload = {
    code: config.code, name: config.name, status: 'active', farmType: 'broiler',
    location: { address: config.address, countryCode: 'IN', timezone: 'Asia/Kolkata', geo: { type: 'Point', coordinates: config.geo } },
    capacity: { birdCapacity: config.capacity }, tags: ['demo', 'completed-project-seed']
  };
  const farm = commit ? await farmsService.createFarm(admin, businessId, farmPayload) : planned({ ...farmPayload, businessId });
  const facilityPayload = { code: 'MAIN-SHED', name: 'Main Shed', type: 'shed', status: 'active', capacity: config.capacity };
  const facility = commit ? await facilitiesService.createFacility(admin, businessId, farm._id, facilityPayload) : planned({ ...facilityPayload, farmId: farm._id, businessId });

  const managers = [];
  for (const [name, localPart] of config.managers) {
    const payload = { name, email: `${localPart}.${config.code.toLowerCase()}@demo.farmsence.ai`, title: 'Project Manager', status: 'active', notes: 'DEMO completed-project seed manager' };
    const manager = commit ? await managersService.createManager(admin, payload) : planned(payload);
    if (commit) await managersService.assignManager(admin, farm._id, { managerId: manager._id, startsAt: startDate });
    managers.push(manager);
  }

  const farmers = [];
  for (let index = 0; index < config.farmers.length; index += 1) {
    const farmer = await createFarmer(admin, farm, config.farmers[index], farmIndex * 10 + index + 1, commit);
    if (commit) await farmAssignmentsService.assignUserToFarm(admin, businessId, farm._id, { userId: farmer._id, startsAt: startDate, notes: 'DEMO completed-project seed assignment' });
    farmers.push(farmer);
  }

  const batchPayload = { facilityId: facility._id, breed: 'Cobb 500', birdType: 'broiler', initialBirdCount: Math.round(config.capacity * 0.8), placedAt: daysBefore(now, 48), expectedHarvestAt: daysBefore(now, 6), status: 'completed', sourceHatchery: 'Demo Regional Hatchery', notes: 'DEMO completed flock' };
  const batch = commit ? await birdBatchesService.createBatch(admin, businessId, farm._id, batchPayload) : planned(batchPayload);
  const flockDates = [daysBefore(now, 35), daysBefore(now, 14)];
  for (let index = 0; index < flockDates.length; index += 1) {
    const flockPayload = { recordDate: flockDates[index], feed: { consumedKg: 720 + farmIndex * 35 + index * 90 }, water: { consumedLiters: 1450 + farmIndex * 80 + index * 120 }, mortality: { count: 7 + farmIndex + index }, avgWeightGrams: 980 + index * 820, observations: 'DEMO flock record for completed-project farm', enteredVia: 'import', syncStatus: 'verified' };
    if (commit) await flockRecordsService.submitDailyRecord(admin, businessId, farm._id, batch._id, flockPayload);
  }

  const projectPayload = { title, description, status: 'completed', priority: farmIndex === 3 ? 'high' : 'medium', startDate, targetDate, completedAt, percentComplete: 100, managerIds: managers.map(manager => manager._id) };
  const project = commit ? await farmProjectsService.createProject(admin, farm._id, projectPayload) : planned({ ...projectPayload, farmId: farm._id });
  const updateCount = 4 + (farmIndex % 3);
  for (let index = 0; index < updateCount; index += 1) {
    const progress = index / (updateCount - 1);
    const occurredAt = new Date(startDate.getTime() + (completedAt.getTime() - startDate.getTime()) * progress);
    if (commit) await farmProjectsService.createWorkUpdate(admin, farm._id, { projectId: project._id, note: UPDATE_NOTES[index] }, { createdAt: occurredAt });
  }

  let feesCreated = 0;
  for (let index = 0; index < config.fees.length; index += 1) {
    const [amount, status] = config.fees[index];
    const payload = { farmerId: farmers[index % farmers.length]._id, farmId: farm._id, amount, currency: 'INR', description: `${title} contribution [DEMO]`, status: 'pending', dueDate: addDays(startDate, 21 + index * 7) };
    if (commit) {
      const fee = await farmerFeesService.createFee(admin, payload);
      if (status === 'paid') await farmerFeesService.markFeeAsPaid(admin, fee._id, { paidAt: addDays(startDate, 25 + index * 7), paymentReference: `DEMO-${config.code}-${index + 1}` });
    }
    feesCreated += 1;
  }

  const reviewRows = [];
  for (let index = 0; index < config.ratings.length; index += 1) {
    const [rating, reviewText] = config.ratings[index];
    const farmer = farmers[index];
    if (commit) await reviewsService.createReview(actorFromUser(farmer), farm._id, project._id, { rating, reviewText });
    reviewRows.push({ farmer: farmer.name, rating, reviewText });
  }
  const averageRating = reviewRows.reduce((sum, row) => sum + row.rating, 0) / reviewRows.length;
  return {
    farmName: config.name, farmId: String(farm._id), projectTitle: title, projectId: String(project._id),
    startDate: startDate.toISOString(), targetDate: targetDate.toISOString(), completedAt: completedAt.toISOString(), classification: classify(completedAt, targetDate),
    managersCreated: managers.length, farmersCreated: farmers.length, facilitiesCreated: 1, birdBatchesCreated: 1, flockRecordsCreated: flockDates.length,
    workUpdatesCreated: updateCount, feesCreated, projectValue: config.fees.reduce((sum, fee) => sum + fee[0], 0), reviewsCreated: reviewRows.length,
    averageRating: Number(averageRating.toFixed(2)), reviews: reviewRows
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
    console.log(`Mode: ${commit ? 'COMMIT' : 'DRY RUN (no database writes)'}`);
    const admin = await resolveAdmin();
    const organizationResult = await resolveOrganization(admin, commit);
    const businessId = organizationResult.organization._id;
    const projects = [];
    const skippedFarms = [];
    for (let index = 0; index < FARMS.length; index += 1) {
      const config = FARMS[index];
      const existing = await Farm.findOne({ businessId, name: config.name }).lean().exec();
      if (existing) {
        console.log(`[SKIP] ${config.name} already exists in demo organization`);
        skippedFarms.push({ farmName: config.name, farmId: String(existing._id) });
        continue;
      }
      console.log(`[${commit ? 'CREATE' : 'WOULD CREATE'}] ${config.name}`);
      projects.push(await seedFarm(admin, businessId, config, index, commit));
    }
    const totals = projects.reduce((counts, row) => {
      counts.farmsCreated += 1; counts.managersCreated += row.managersCreated; counts.farmersCreated += row.farmersCreated;
      counts.projectsCreated += 1; counts.feesCreated += row.feesCreated; counts.reviewsCreated += row.reviewsCreated;
      counts.facilitiesCreated += row.facilitiesCreated; counts.birdBatchesCreated += row.birdBatchesCreated;
      counts.flockRecordsCreated += row.flockRecordsCreated; counts.workUpdatesCreated += row.workUpdatesCreated;
      return counts;
    }, { farmsCreated: 0, facilitiesCreated: 0, managersCreated: 0, farmersCreated: 0, birdBatchesCreated: 0, flockRecordsCreated: 0, projectsCreated: 0, workUpdatesCreated: 0, feesCreated: 0, reviewsCreated: 0 });
    const summary = {
      generatedAt: new Date().toISOString(), mode: commit ? 'commit' : 'dry-run', targetDatabase: MIGRATION_ENVIRONMENT.databaseName,
      demoMarker: 'All farms are tagged demo/completed-project-seed; all seeded identities use @demo.farmsence.ai.',
      organization: { id: String(businessId), name: organizationResult.organization.displayName, created: organizationResult.created },
      counts: { ...totals, farmsSkipped: skippedFarms.length }, projects, skippedFarms
    };
    await writeSummary(summary);
    console.table(projects.map(row => ({ farm: row.farmName, project: row.projectTitle, completedAt: row.completedAt.slice(0, 10), targetDate: row.targetDate.slice(0, 10), result: row.classification, fees: row.feesCreated, reviews: row.reviewsCreated, averageRating: row.averageRating })));
    console.log('Counts:', totals);
    console.log(`Summary written to ${SUMMARY_PATH}`);
    return summary;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runSeed(CLI_OPTIONS).catch(error => {
    console.error('Completed-project demo seed failed:', error.details || error);
    process.exitCode = 1;
  });
}

module.exports = { DEMO_ORGANIZATION, FARMS, classify, runSeed };
