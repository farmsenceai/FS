/**
 * One-off canonical batch/flock backfill.
 *
 * Dry-run is the default. Append --commit manually to the npm command only
 * after reviewing 001-unresolved.json, 001-summary.json, and console samples.
 * Legacy models are used exclusively through read-only cursors in this file.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const {
  DEFAULT_STAGING_ENV_FILE,
  assertCommitSafety,
  initializeMigrationSafety,
  loadMigrationEnvironment,
  parseMigrationArguments,
  resolveTargetDatabaseName
} = require('./lib/safety');

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

// Load Mongoose and application models only after the migration-specific env
// file has been selected, loaded, printed safely, and production-checked.
const mongoose = require('mongoose');

const LegacyBatch = require('../../models/Batch');
const FeedWaterBatch = require('../../models/FeedWaterBatch');
const PerformanceBatch = require('../../models/PerformanceBatch');
const Organization = require('../modules/organizations/organizations.model');
const Farm = require('../modules/farms/farms.model');
const Facility = require('../modules/facilities/facilities.model');
const BirdBatch = require('../modules/bird-batches/bird-batches.model');
const FlockRecord = require('../modules/flock-records/flock-records.model');
const birdBatchesRepository = require('../modules/bird-batches/bird-batches.repository');
const flockRecordsRepository = require('../modules/flock-records/flock-records.repository');

const CURSOR_BATCH_SIZE = 500;
const SAMPLE_LIMIT = 3;
const LOG_DIRECTORY = path.join(__dirname, 'logs');
const SEED_SUMMARY_PATH = path.join(LOG_DIRECTORY, '000-seed-summary.json');
const UNRESOLVED_LOG_PATH = path.join(LOG_DIRECTORY, '001-unresolved.json');
const SUMMARY_LOG_PATH = path.join(LOG_DIRECTORY, '001-summary.json');

class JsonArrayLog {
  constructor(filePath) {
    this.filePath = filePath;
    this.handle = null;
    this.hasEntries = false;
  }

  async open() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    this.handle = await fs.open(this.filePath, 'w');
    await this.handle.write('[\n');
  }

  async append(entry) {
    if (!this.handle) throw new Error('JSON log is not open');
    if (this.hasEntries) await this.handle.write(',\n');
    await this.handle.write(JSON.stringify(entry, null, 2));
    this.hasEntries = true;
  }

  async close() {
    if (!this.handle) return;
    await this.handle.write('\n]\n');
    await this.handle.close();
    this.handle = null;
  }
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function legacyBatchKey(farmName, batchCode) {
  return `${normalizeText(farmName)}|${normalizeText(batchCode)}`;
}

function inferBirdType(breed) {
  const normalized = normalizeText(breed);
  if (/\b(layer|layers)\b/.test(normalized)) return 'layer';
  if (/\b(breeder|breeders)\b/.test(normalized)) return 'breeder';
  if (/\b(broiler|broilers|cobb|ross|arbor acres|hubbard)\b/.test(normalized)) {
    return 'broiler';
  }
  return null;
}

function mapBatchStatus(lifecycleStatus) {
  if (normalizeText(lifecycleStatus) === 'completed') return 'completed';
  if (normalizeText(lifecycleStatus) === 'active') return 'active';
  return 'planned';
}

function migratedBatchResolution(batch) {
  return {
    batchId: batch._id,
    businessId: batch.businessId,
    farmId: batch.farmId,
    createdBy: batch.createdBy,
    code: batch.code,
    deletedAt: batch.deletedAt || null
  };
}

async function findWithDeletedByLegacySource(Model, legacySourceId) {
  return Model.findOne({ legacySourceId })
    .setOptions({ withDeleted: true })
    .lean()
    .exec();
}

function createResolverCaches() {
  return {
    farms: new Map(),
    facilities: new Map()
  };
}

async function resolveFarmAndBusiness(farmName, caches) {
  const key = normalizeText(farmName);
  if (!key) return { error: 'Legacy farm name is empty' };
  if (caches.farms.has(key)) return caches.farms.get(key);

  const farms = await Farm.find({
    $expr: {
      $eq: [{ $toLower: { $trim: { input: '$name' } } }, key]
    }
  })
    .limit(3)
    .lean()
    .exec();
  let result;
  if (farms.length === 0) {
    result = { error: `No canonical Farm exactly matches '${farmName}'` };
  } else if (farms.length > 1) {
    result = {
      error: `Farm name '${farmName}' is ambiguous across canonical tenants`,
      candidateFarmIds: farms.map(farm => farm._id)
    };
  } else {
    const farm = farms[0];
    const organization = await Organization.findById(farm.businessId).lean().exec();
    if (!organization) {
      result = {
        error: `Canonical Farm '${farmName}' has no active Organization`,
        farmId: farm._id,
        businessId: farm.businessId
      };
    } else if (!farm.createdBy) {
      result = {
        error: `Canonical Farm '${farmName}' has no createdBy actor for migration provenance`,
        farmId: farm._id
      };
    } else {
      result = { farm, organization };
    }
  }

  caches.farms.set(key, result);
  return result;
}

async function resolveSeedFacility(farm, seedFarmMap, caches) {
  const normalizedFarmName = normalizeText(farm.name);
  const key = `${farm._id}|${normalizedFarmName}`;
  if (caches.facilities.has(key)) return caches.facilities.get(key);

  const mapping = seedFarmMap.get(normalizedFarmName);
  let result;
  if (!mapping) {
    result = { error: `No seeded facility mapping exists for canonical farm '${farm.name}'` };
  } else if (
    String(mapping.organizationId) !== String(farm.businessId) ||
    String(mapping.farmId) !== String(farm._id)
  ) {
    result = {
      error: `Seeded mapping IDs do not match canonical farm '${farm.name}'`,
      mapping
    };
  } else {
    const facility = await Facility.findOne({
      _id: mapping.facilityId,
      businessId: farm.businessId,
      farmId: farm._id
    })
      .lean()
      .exec();
    result = facility
      ? { facility }
      : {
          error: `Seeded Facility '${mapping.facilityId}' is not active in canonical farm '${farm.name}'`
        };
  }

  caches.facilities.set(key, result);
  return result;
}

async function loadSeedFarmMap() {
  let parsed;
  try {
    parsed = JSON.parse(await fs.readFile(SEED_SUMMARY_PATH, 'utf8'));
  } catch (error) {
    throw new Error(
      `Unable to load seeded facility mapping at ${SEED_SUMMARY_PATH}: ${error.message}`
    );
  }
  if (!parsed.farms || typeof parsed.farms !== 'object') {
    throw new Error(`Seed summary at ${SEED_SUMMARY_PATH} does not contain a farms mapping`);
  }
  if (parsed.mode !== 'commit') {
    throw new Error(
      `Seed summary at ${SEED_SUMMARY_PATH} is not from a committed seed run; run 000-seed-real-farms.js with --commit first`
    );
  }
  if (
    parsed.targetDatabase &&
    normalizeText(parsed.targetDatabase) !== normalizeText(MIGRATION_ENVIRONMENT.databaseName)
  ) {
    throw new Error(
      `Seed summary targets database '${parsed.targetDatabase}', not '${MIGRATION_ENVIRONMENT.databaseName}'`
    );
  }

  const farmMap = new Map();
  for (const [farmName, mapping] of Object.entries(parsed.farms)) {
    const key = normalizeText(farmName);
    if (!key || farmMap.has(key)) {
      throw new Error(`Seed summary contains an empty or duplicate normalized farm name: '${farmName}'`);
    }
    if (!mapping?.organizationId || !mapping?.farmId || !mapping?.facilityId) {
      throw new Error(`Seed summary mapping for '${farmName}' is missing required IDs`);
    }
    farmMap.set(key, mapping);
  }
  return farmMap;
}

async function appendIssue(runtime, issue) {
  runtime.issueCount += 1;
  await runtime.unresolvedLog.append({
    loggedAt: new Date().toISOString(),
    mode: runtime.commit ? 'commit' : 'dry-run',
    ...issue
  });
}

function logSample(label, document, samples) {
  if (samples[label] >= SAMPLE_LIMIT) return;
  samples[label] += 1;
  console.log(`\nSample ${label} document:`);
  console.log(JSON.stringify(document, null, 2));
}

async function processLegacyBatches(runtime) {
  const cursor = LegacyBatch.find({}).lean().cursor({ batchSize: CURSOR_BATCH_SIZE });

  for await (const legacy of cursor) {
    runtime.summary.legacyBatchesScanned += 1;
    if (runtime.summary.legacyBatchesScanned % CURSOR_BATCH_SIZE === 0) {
      console.log(`Legacy Batch progress: ${runtime.summary.legacyBatchesScanned} scanned`);
    }

    const sourceKey = legacyBatchKey(legacy.farm, legacy.batchId);
    const alreadyMigrated = await findWithDeletedByLegacySource(BirdBatch, legacy._id);
    if (alreadyMigrated) {
      runtime.summary.batchesSkippedAlreadyMigrated += 1;
      if (!alreadyMigrated.deletedAt) {
        const resolution = migratedBatchResolution(alreadyMigrated);
        runtime.batchResolutions.set(sourceKey, resolution);
        runtime.recalculateTargets.set(String(resolution.batchId), resolution);
      }
      await appendIssue(runtime, {
        category: 'already_migrated',
        legacyModel: 'Batch',
        legacySourceId: legacy._id,
        canonicalId: alreadyMigrated._id,
        reason: alreadyMigrated.deletedAt
          ? 'Canonical counterpart exists but is soft-deleted'
          : 'Canonical counterpart already exists'
      });
      continue;
    }

    const farmResolution = await resolveFarmAndBusiness(legacy.farm, runtime.resolverCaches);
    const birdType = inferBirdType(legacy.breed);
    const errors = [];
    if (farmResolution.error) errors.push(farmResolution.error);
    if (!birdType) errors.push(`Cannot confidently infer birdType from breed '${legacy.breed}'`);

    let facilityResolution = null;
    if (!farmResolution.error) {
      facilityResolution = await resolveSeedFacility(
        farmResolution.farm,
        runtime.seedFarmMap,
        runtime.resolverCaches
      );
      if (facilityResolution.error) errors.push(facilityResolution.error);
    }

    if (!legacy.doa || Number.isNaN(new Date(legacy.doa).getTime())) {
      errors.push('Legacy doa is missing or invalid');
    }
    if (!Number.isInteger(legacy.birds) || legacy.birds <= 0) {
      errors.push('Legacy birds must be an integer greater than 0');
    }

    if (errors.length > 0) {
      runtime.summary.batchesSkippedUnresolved += 1;
      runtime.batchResolutions.set(sourceKey, { error: errors.join('; ') });
      await appendIssue(runtime, {
        category: 'unresolved_batch',
        legacyModel: 'Batch',
        legacySourceId: legacy._id,
        legacyBatchId: legacy.batchId,
        legacyFarm: legacy.farm,
        reason: errors.join('; ')
      });
      continue;
    }

    const { farm } = farmResolution;
    const existingCode = await BirdBatch.findOne({
      businessId: farm.businessId,
      farmId: farm._id,
      code: String(legacy.batchId).trim().toUpperCase()
    })
      .setOptions({ withDeleted: true })
      .lean()
      .exec();
    if (existingCode) {
      runtime.summary.batchesSkippedUnresolved += 1;
      const reason = 'Canonical batch code already exists without this legacySourceId; manual review required';
      runtime.batchResolutions.set(sourceKey, { error: reason });
      await appendIssue(runtime, {
        category: 'canonical_code_conflict',
        legacyModel: 'Batch',
        legacySourceId: legacy._id,
        legacyBatchId: legacy.batchId,
        canonicalId: existingCode._id,
        reason
      });
      continue;
    }

    const canonicalData = {
      _id: new mongoose.Types.ObjectId(),
      legacySourceId: legacy._id,
      code: String(legacy.batchId).trim().toUpperCase(),
      facilityId: facilityResolution.facility._id,
      breed: String(legacy.breed).trim(),
      birdType,
      initialBirdCount: legacy.birds,
      currentBirdCountCached: legacy.birds,
      placedAt: new Date(legacy.doa),
      status: mapBatchStatus(legacy.lifecycleStatus),
      sourceHatchery: undefined,
      notes: legacy.notes || undefined,
      createdBy: farm.createdBy,
      source: 'import'
    };

    let canonicalBatch = canonicalData;
    if (runtime.commit) {
      canonicalBatch = await birdBatchesRepository.create(
        farm.businessId,
        farm._id,
        canonicalData
      );
    }

    runtime.summary.batchesCreated += 1;
    const resolution = migratedBatchResolution({
      ...canonicalData,
      ...canonicalBatch,
      businessId: farm.businessId,
      farmId: farm._id
    });
    runtime.batchResolutions.set(sourceKey, resolution);
    runtime.recalculateTargets.set(String(resolution.batchId), resolution);
    logSample('bird_batches', {
      ...canonicalData,
      businessId: farm.businessId,
      farmId: farm._id
    }, runtime.samples);
  }
}

function legacyDailyPipeline(dateField) {
  return [
    {
      $addFields: {
        _migrationFarmKey: {
          $toLower: { $trim: { input: { $convert: { input: '$farm', to: 'string', onError: '', onNull: '' } } } }
        },
        _migrationBatchKey: {
          $toLower: { $trim: { input: { $convert: { input: '$batchId', to: 'string', onError: '', onNull: '' } } } }
        },
        _migrationDateKey: {
          $dateToString: { date: `$${dateField}`, format: '%Y-%m-%d', timezone: 'UTC', onNull: '' }
        }
      }
    },
    { $sort: { _migrationFarmKey: 1, _migrationBatchKey: 1, _migrationDateKey: 1, _id: 1 } }
  ];
}

async function* groupedLegacyDailyRecords(Model, sourceName, dateField, runtime) {
  const cursor = Model.aggregate(legacyDailyPipeline(dateField))
    .allowDiskUse(true)
    .cursor({ batchSize: CURSOR_BATCH_SIZE });
  let current = null;

  for await (const document of cursor) {
    runtime.dailyScanned[sourceName] += 1;
    if (runtime.dailyScanned[sourceName] % CURSOR_BATCH_SIZE === 0) {
      console.log(`${sourceName} progress: ${runtime.dailyScanned[sourceName]} scanned`);
    }

    const farmKey = document._migrationFarmKey;
    const batchCodeKey = document._migrationBatchKey;
    const dateKey = document._migrationDateKey;
    if (!farmKey || !batchCodeKey || !dateKey) {
      await appendIssue(runtime, {
        category: 'unresolved_daily_source',
        legacyModel: sourceName,
        legacySourceId: document._id,
        reason: `Missing farm, batchId, or ${dateField}`
      });
      continue;
    }

    const key = `${farmKey}|${batchCodeKey}|${dateKey}`;
    if (current && current.key !== key) {
      yield current;
      current = null;
    }
    if (!current) {
      current = { key, farmKey, batchCodeKey, dateKey, documents: [] };
    }
    current.documents.push(document);
  }

  if (current) yield current;
}

async function nextGroup(iterator) {
  const result = await iterator.next();
  return result.done ? null : result.value;
}

async function* mergeDailyGroups(feedIterator, performanceIterator) {
  let feed = await nextGroup(feedIterator);
  let performance = await nextGroup(performanceIterator);

  while (feed || performance) {
    if (feed && performance && feed.key === performance.key) {
      yield { feed, performance };
      feed = await nextGroup(feedIterator);
      performance = await nextGroup(performanceIterator);
    } else if (!performance || (feed && feed.key < performance.key)) {
      yield { feed, performance: null };
      feed = await nextGroup(feedIterator);
    } else {
      yield { feed: null, performance };
      performance = await nextGroup(performanceIterator);
    }
  }
}

function uniqueNumbers(values) {
  return [...new Set(values.filter(Number.isFinite))];
}

function buildDailyRecord(feedGroup, performanceGroup) {
  const conflicts = [];
  const sourceIds = [];
  const observations = [];
  const data = {};
  const allBirdCounts = [];

  if (feedGroup) {
    sourceIds.push(...feedGroup.documents.map(document => document._id));
    allBirdCounts.push(...feedGroup.documents.map(document => document.birds));
    data.feed = {
      consumedKg: feedGroup.documents.reduce(
        (total, document) => total + (Number(document.feedConsumedKg) || 0),
        0
      )
    };
    data.water = {
      consumedLiters: feedGroup.documents.reduce(
        (total, document) => total + (Number(document.waterConsumedLitres) || 0),
        0
      )
    };
    observations.push(
      ...feedGroup.documents.map(document => document.notes).filter(Boolean)
    );
  }

  if (performanceGroup) {
    sourceIds.push(...performanceGroup.documents.map(document => document._id));
    allBirdCounts.push(...performanceGroup.documents.map(document => document.birds));
    const weights = uniqueNumbers(
      performanceGroup.documents.map(document => Number(document.averageWeightKg) * 1000)
    );
    const mortalityCounts = uniqueNumbers(
      performanceGroup.documents.map(document =>
        Math.round((Number(document.birds) * Number(document.mortalityRatePct)) / 100)
      )
    );
    if (weights.length > 1) conflicts.push({ field: 'avgWeightGrams', values: weights });
    if (mortalityCounts.length > 1) {
      conflicts.push({ field: 'mortality.count', values: mortalityCounts });
    }
    if (weights.length === 1) data.avgWeightGrams = weights[0];
    if (mortalityCounts.length === 1) {
      data.mortality = {
        count: mortalityCounts[0],
        cause: 'Imported cumulative mortality from legacy PerformanceBatch mortalityRatePct'
      };
    }
    observations.push(
      ...performanceGroup.documents.map(document => document.notes).filter(Boolean)
    );
  }

  const birdCounts = uniqueNumbers(allBirdCounts.map(Number));
  if (feedGroup && performanceGroup && birdCounts.length > 1) {
    conflicts.push({ field: 'legacy birds', values: birdCounts });
  }

  return {
    conflicts,
    sourceIds,
    data: {
      ...data,
      observations: observations.length > 0 ? [...new Set(observations)].join(' | ') : undefined,
      enteredVia: 'import',
      syncStatus: 'submitted',
      source: 'import'
    }
  };
}

async function processDailyGroup(runtime, feedGroup, performanceGroup) {
  const group = feedGroup || performanceGroup;
  const batchKey = legacyBatchKey(group.farmKey, group.batchCodeKey);
  const batch = runtime.batchResolutions.get(batchKey);
  const sourceNames = [feedGroup && 'FeedWaterBatch', performanceGroup && 'PerformanceBatch']
    .filter(Boolean);
  const built = buildDailyRecord(feedGroup, performanceGroup);

  if (!batch || batch.error || batch.deletedAt) {
    await appendIssue(runtime, {
      category: 'unresolved_daily_batch',
      legacyModel: sourceNames.join('+'),
      legacySourceIds: built.sourceIds,
      legacyFarm: group.farmKey,
      legacyBatchId: group.batchCodeKey,
      recordDate: group.dateKey,
      reason: batch?.error || 'No active canonical bird batch was resolved for this legacy farm/batch'
    });
    return;
  }

  if (built.conflicts.length > 0) {
    runtime.summary.flockRecordsSkippedConflict += 1;
    await appendIssue(runtime, {
      category: 'daily_source_conflict',
      legacyModel: sourceNames.join('+'),
      legacySourceIds: built.sourceIds,
      canonicalBatchId: batch.batchId,
      recordDate: group.dateKey,
      reason: 'Conflicting legacy values require manual review; no canonical record was created',
      conflicts: built.conflicts
    });
    return;
  }

  const alreadyMigrated = await FlockRecord.findOne({
    legacySourceId: { $in: built.sourceIds }
  })
    .setOptions({ withDeleted: true })
    .lean()
    .exec();
  if (alreadyMigrated) {
    runtime.flockRecordsSkippedAlreadyMigrated += 1;
    await appendIssue(runtime, {
      category: 'already_migrated',
      legacyModel: sourceNames.join('+'),
      legacySourceIds: built.sourceIds,
      canonicalId: alreadyMigrated._id,
      reason: 'A canonical flock record already traces one of these legacy sources'
    });
    return;
  }

  const recordDate = new Date(`${group.dateKey}T00:00:00.000Z`);
  const existingPrimary = await FlockRecord.findOne({
    businessId: batch.businessId,
    farmId: batch.farmId,
    batchId: batch.batchId,
    recordDate,
    correctsRecordId: { $exists: false }
  })
    .lean()
    .exec();
  if (existingPrimary) {
    runtime.summary.flockRecordsSkippedConflict += 1;
    await appendIssue(runtime, {
      category: 'canonical_daily_conflict',
      legacyModel: sourceNames.join('+'),
      legacySourceIds: built.sourceIds,
      canonicalId: existingPrimary._id,
      recordDate,
      reason: 'A canonical primary record already exists for this batch/day with a different source'
    });
    return;
  }

  const canonicalData = {
    _id: new mongoose.Types.ObjectId(),
    legacySourceId: built.sourceIds[0],
    recordDate,
    ...built.data,
    createdBy: batch.createdBy
  };

  if (runtime.commit) {
    await flockRecordsRepository.create(
      batch.businessId,
      batch.farmId,
      batch.batchId,
      canonicalData
    );
  }
  runtime.summary.flockRecordsCreated += 1;
  runtime.recalculateTargets.set(String(batch.batchId), batch);
  logSample('daily_flock_records', {
    ...canonicalData,
    businessId: batch.businessId,
    farmId: batch.farmId,
    batchId: batch.batchId
  }, runtime.samples);
}

async function processLegacyDailyData(runtime) {
  const feedIterator = groupedLegacyDailyRecords(
    FeedWaterBatch,
    'FeedWaterBatch',
    'measuredAt',
    runtime
  )[Symbol.asyncIterator]();
  const performanceIterator = groupedLegacyDailyRecords(
    PerformanceBatch,
    'PerformanceBatch',
    'completedAt',
    runtime
  )[Symbol.asyncIterator]();

  for await (const { feed, performance } of mergeDailyGroups(
    feedIterator,
    performanceIterator
  )) {
    await processDailyGroup(runtime, feed, performance);
  }
}

async function recalculateMigratedBatches(runtime) {
  if (!runtime.commit) return;
  let processed = 0;
  for (const batch of runtime.recalculateTargets.values()) {
    const recalculated = await birdBatchesRepository.recalculateCurrentBirdCount(
      batch.businessId,
      batch.farmId,
      batch.batchId
    );
    if (!recalculated) {
      await appendIssue(runtime, {
        category: 'recalculation_failed',
        canonicalBatchId: batch.batchId,
        reason: 'Canonical batch disappeared before currentBirdCountCached recalculation'
      });
    }
    processed += 1;
    if (processed % CURSOR_BATCH_SIZE === 0) {
      console.log(`Bird-count recalculation progress: ${processed} batches`);
    }
  }
  console.log(`Recalculated currentBirdCountCached for ${processed} canonical batches`);
}

function createSummary() {
  return {
    legacyBatchesScanned: 0,
    batchesCreated: 0,
    batchesSkippedAlreadyMigrated: 0,
    batchesSkippedUnresolved: 0,
    flockRecordsCreated: 0,
    flockRecordsSkippedConflict: 0,
    durationMs: 0
  };
}

async function runMigration({ commit = false } = {}) {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGO_URI or MONGODB_URI is required');
  assertCommitSafety({ commit, databaseName: MIGRATION_ENVIRONMENT.databaseName });
  const seedFarmMap = await loadSeedFarmMap();

  const startedAt = Date.now();
  const unresolvedLog = new JsonArrayLog(UNRESOLVED_LOG_PATH);
  const runtime = {
    commit,
    summary: createSummary(),
    unresolvedLog,
    issueCount: 0,
    resolverCaches: createResolverCaches(),
    seedFarmMap,
    batchResolutions: new Map(),
    recalculateTargets: new Map(),
    dailyScanned: { FeedWaterBatch: 0, PerformanceBatch: 0 },
    flockRecordsSkippedAlreadyMigrated: 0,
    samples: { bird_batches: 0, daily_flock_records: 0 }
  };

  await unresolvedLog.open();
  try {
    await mongoose.connect(mongoUri);
    console.log(`Mode: ${commit ? 'COMMIT' : 'DRY RUN (no database writes)'}`);
    console.log(`Database: ${mongoose.connection.name}`);

    if (commit) {
      // Explicit index initialization makes the migration trace IDs enforce idempotency.
      await Promise.all([BirdBatch.init(), FlockRecord.init()]);
    }

    await processLegacyBatches(runtime);
    await processLegacyDailyData(runtime);
    await recalculateMigratedBatches(runtime);

    runtime.summary.durationMs = Date.now() - startedAt;
    await fs.mkdir(LOG_DIRECTORY, { recursive: true });
    await fs.writeFile(SUMMARY_LOG_PATH, `${JSON.stringify(runtime.summary, null, 2)}\n`);

    console.log('\nMigration summary:');
    console.log(JSON.stringify(runtime.summary, null, 2));
    console.log(`FeedWaterBatch scanned: ${runtime.dailyScanned.FeedWaterBatch}`);
    console.log(`PerformanceBatch scanned: ${runtime.dailyScanned.PerformanceBatch}`);
    console.log(`Flock records skipped as already migrated: ${runtime.flockRecordsSkippedAlreadyMigrated}`);
    console.log(`Issues written to ${UNRESOLVED_LOG_PATH}: ${runtime.issueCount}`);
    console.log(`Summary written to ${SUMMARY_LOG_PATH}`);
    return runtime.summary;
  } finally {
    await unresolvedLog.close();
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runMigration(CLI_OPTIONS).catch(error => {
    if (error.message.startsWith('Refusing to')) {
      console.error(error.message);
    } else {
      console.error('Batch backfill failed:', error);
    }
    process.exitCode = 1;
  });
}

module.exports = {
  DEFAULT_STAGING_ENV_FILE,
  MIGRATION_ENVIRONMENT,
  assertCommitSafety,
  inferBirdType,
  legacyBatchKey,
  loadSeedFarmMap,
  mapBatchStatus,
  buildDailyRecord,
  loadMigrationEnvironment,
  normalizeText,
  parseArguments: parseMigrationArguments,
  resolveFarmAndBusiness,
  resolveSeedFacility,
  resolveTargetDatabaseName,
  runMigration
};
