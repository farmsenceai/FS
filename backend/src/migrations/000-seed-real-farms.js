/**
 * One-time canonical tenant/farm/facility scaffold for the legacy backfill.
 * Dry-run by default; --commit requires the shared staging safety controls.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
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

const mongoose = require('mongoose');
const User = require('../../models/User');
const Organization = require('../modules/organizations/organizations.model');
const Farm = require('../modules/farms/farms.model');
const Facility = require('../modules/facilities/facilities.model');
const organizationsService = require('../modules/organizations/organizations.service');
const farmsService = require('../modules/farms/farms.service');
const facilitiesService = require('../modules/facilities/facilities.service');

const SUMMARY_PATH = path.join(__dirname, 'logs', '000-seed-summary.json');
const FARM_NAMES = [
  'Green Valley Farm',
  'Sunrise Farm',
  'Krishna Farm',
  'Annapurna Farm',
  'Sai Poultry Farm',
  'Amorapura Farm',
  'Demo Farmer Farm',
  'Sample Farm',
  'Partner Farm 1',
  'Partner Farm 2',
  'Partner Farm 3',
  'Partner Farm 4',
  'Partner Farm 5'
];
const PLACEHOLDER_ORGANIZATION = {
  legalName: 'FarmSence Operations',
  displayName: 'FarmSence Operations',
  slug: 'farmsence-operations',
  legal: { countryCode: 'IN' },
  contacts: { billingEmail: 'ops@farmsence.ai' },
  defaultCurrency: 'INR',
  timezone: 'Asia/Kolkata'
};

function isTestOrganization(organization) {
  const identity = [organization.legalName, organization.displayName, organization.slug]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase();
  return (
    identity.includes('demo poultry') ||
    identity.includes('demo-poultry') ||
    identity.includes('canonical flow poultry') ||
    identity.includes('canonical-flow-poultry')
  );
}

function farmCodeFromName(name) {
  return name
    .trim()
    .toUpperCase()
    .replace(/\bFARM\b/g, ' ')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function plannedDocument(data) {
  return { _id: new mongoose.Types.ObjectId(), ...data };
}

async function resolveAdminActor() {
  const admin = await User.findOne({ role: 'admin' }).select('_id email role').lean().exec();
  if (!admin) {
    throw new Error(
      'No existing admin User was found in staging; create/identify an admin before seeding canonical ownership'
    );
  }
  return { userId: admin._id, _id: admin._id, email: admin.email, role: 'admin' };
}

async function resolveOrganization(actorUser, commit) {
  const organizations = await Organization.find({}).sort('createdAt').lean().exec();
  const placeholder = organizations.find(
    organization => organization.slug === PLACEHOLDER_ORGANIZATION.slug
  );
  if (placeholder) {
    console.log(`[SKIP] Reusing FarmSence Operations organization (${placeholder._id})`);
    return { organization: placeholder, created: false, placeholder: true };
  }

  const nonTestOrganizations = organizations.filter(organization => !isTestOrganization(organization));
  if (nonTestOrganizations.length > 1) {
    throw new Error(
      `Found ${nonTestOrganizations.length} non-test Organizations; refusing to guess which business owns the farms`
    );
  }
  if (nonTestOrganizations.length === 1) {
    const organization = nonTestOrganizations[0];
    console.log(`[SKIP] Reusing existing non-test Organization (${organization._id})`);
    return { organization, created: false, placeholder: false };
  }

  console.warn(
    '⚠️  PLACEHOLDER ORGANIZATION: FarmSence Operations / ops@farmsence.ai must be corrected to real business details before production use.'
  );
  const organization = commit
    ? await organizationsService.createOrganization(actorUser, PLACEHOLDER_ORGANIZATION)
    : plannedDocument(PLACEHOLDER_ORGANIZATION);
  console.log(
    `[${commit ? 'CREATE' : 'WOULD CREATE'}] Organization FarmSence Operations (${organization._id})`
  );
  return { organization, created: true, placeholder: true };
}

function farmPayload(name) {
  return {
    code: farmCodeFromName(name),
    name,
    farmType: 'broiler',
    location: {
      address: 'Unknown — needs update',
      geo: { type: 'Point', coordinates: [0, 0] },
      countryCode: 'IN',
      timezone: 'Asia/Kolkata'
    }
  };
}

async function resolveFarm(actorUser, businessId, name, commit) {
  const existing = await Farm.findOne({ businessId, name }).lean().exec();
  if (existing) {
    console.log(`[SKIP] Farm already exists: ${name} (${existing._id})`);
    return { farm: existing, created: false };
  }

  const payload = farmPayload(name);
  const farm = commit
    ? await farmsService.createFarm(actorUser, businessId, payload)
    : plannedDocument({ ...payload, businessId, createdBy: actorUser.userId });
  console.log(`[${commit ? 'CREATE' : 'WOULD CREATE'}] Farm ${name} (${farm._id})`);
  return { farm, created: true };
}

async function resolveMainFacility(actorUser, businessId, farm, commit) {
  const existing = await Facility.findOne({
    businessId,
    farmId: farm._id,
    code: 'MAIN'
  })
    .lean()
    .exec();
  if (existing) {
    console.log(`[SKIP] Main Facility already exists for ${farm.name} (${existing._id})`);
    return { facility: existing, created: false };
  }

  const payload = { code: 'MAIN', name: 'Main Facility', type: 'shed' };
  const facility = commit
    ? await facilitiesService.createFacility(
        actorUser,
        businessId,
        farm._id,
        payload
      )
    : plannedDocument({
        ...payload,
        businessId,
        farmId: farm._id,
        createdBy: actorUser.userId
      });
  console.log(
    `[${commit ? 'CREATE' : 'WOULD CREATE'}] Main Facility for ${farm.name} (${facility._id})`
  );
  return { facility, created: true };
}

async function writeSummary(summary) {
  await fs.mkdir(path.dirname(SUMMARY_PATH), { recursive: true });
  await fs.writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
}

async function runSeed({ commit = false } = {}) {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGO_URI or MONGODB_URI is required');
  assertCommitSafety({ commit, databaseName: MIGRATION_ENVIRONMENT.databaseName });

  await mongoose.connect(mongoUri);
  try {
    console.log(`Mode: ${commit ? 'COMMIT' : 'DRY RUN (no database writes)'}`);
    console.warn(
      '⚠️  PLACEHOLDER FARM DATA: farmType=broiler, address="Unknown — needs update", and geo=[0,0] must be reviewed per farm.'
    );
    console.warn(
      '⚠️  PLACEHOLDER FACILITIES: MAIN / Main Facility is only a migration container; replace it with real shed breakdowns where applicable.'
    );

    const actorUser = await resolveAdminActor();
    const organizationResult = await resolveOrganization(actorUser, commit);
    const businessId = organizationResult.organization._id;
    const summaryRows = {};
    let farmsCreated = 0;
    let farmsReused = 0;
    let facilitiesCreated = 0;
    let facilitiesReused = 0;

    for (const name of FARM_NAMES) {
      const farmResult = await resolveFarm(actorUser, businessId, name, commit);
      const facilityResult = await resolveMainFacility(
        actorUser,
        businessId,
        farmResult.farm,
        commit
      );
      if (farmResult.created) farmsCreated += 1;
      else farmsReused += 1;
      if (facilityResult.created) facilitiesCreated += 1;
      else facilitiesReused += 1;

      summaryRows[name] = {
        organizationId: String(businessId),
        farmId: String(farmResult.farm._id),
        facilityId: String(facilityResult.facility._id)
      };
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      mode: commit ? 'commit' : 'dry-run',
      targetDatabase: MIGRATION_ENVIRONMENT.databaseName,
      placeholderOrganization: organizationResult.placeholder,
      assumptions: [
        'Farm legal/business details must be reviewed before production use.',
        'All farms are temporarily classified as broiler.',
        'All addresses and coordinates are placeholders.',
        'MAIN facilities are placeholder containers for legacy batches.'
      ],
      counts: { farmsCreated, farmsReused, facilitiesCreated, facilitiesReused },
      farms: summaryRows
    };
    await writeSummary(summary);

    console.log('\nCanonical farm/facility mapping:');
    console.table(
      Object.entries(summaryRows).map(([farmName, ids]) => ({ farmName, ...ids }))
    );
    console.log(`Summary written to ${SUMMARY_PATH}`);
    return summary;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runSeed(CLI_OPTIONS).catch(error => {
    console.error('Canonical farm seed failed:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  FARM_NAMES,
  PLACEHOLDER_ORGANIZATION,
  farmCodeFromName,
  isTestOrganization,
  runSeed
};
