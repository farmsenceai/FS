/**
 * Union staging into the non-production FarmsenceAI working database.
 * Never deletes. Shared documents are preserved except bird_batches.code,
 * which is synchronized from staging. Dry-run is the default.
 */
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const {
  assertCommitSafety,
  assertDatabaseNameNotProtected,
  resolveTargetDatabaseName
} = require('./lib/safety');

const BACKEND_DIRECTORY = path.resolve(__dirname, '..', '..');
const LOG_DIRECTORY = path.join(__dirname, 'logs');
const COLLECTIONS = [
  'organizations',
  'farms',
  'facilities',
  'bird_batches',
  'daily_flock_records',
  'canonical_managers',
  'manager_farm_assignments',
  'farm_assignments',
  'farm_projects',
  'farm_work_updates',
  'farmer_fees',
  'farm_project_reviews',
  'users'
];
const SENSITIVE_FIELD = /password|secret|token|otp|hash/i;
const MAX_CONFLICT_SAMPLES = 10;

function parseArguments(argv) {
  let commit = false;
  for (const argument of argv) {
    if (argument === '--') continue;
    if (argument === '--commit') commit = true;
    else throw new Error(`Unknown merge argument: ${argument}`);
  }
  return { commit };
}

function readEnvironment(fileName) {
  const filePath = path.join(BACKEND_DIRECTORY, fileName);
  if (!fs.existsSync(filePath)) throw new Error(`Environment file does not exist: ${filePath}`);
  const values = dotenv.parse(fs.readFileSync(filePath));
  const mongoUri = values.MONGO_URI || values.MONGODB_URI;
  const databaseName = resolveTargetDatabaseName(mongoUri);
  if (!mongoUri || !databaseName) throw new Error(`Cannot resolve MongoDB target from ${filePath}`);
  return { databaseName, filePath, mongoUri };
}

function normalized(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString('base64');
  if (typeof value?.toHexString === 'function') return value.toHexString();
  if (Array.isArray(value)) return value.map(normalized);
  if (typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = normalized(value[key]);
      return result;
    }, {});
  }
  return value;
}

function equal(left, right) {
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right));
}

function differingFields(source, destination, ignored = new Set()) {
  const fields = new Set([...Object.keys(source || {}), ...Object.keys(destination || {})]);
  return [...fields].filter(field => !ignored.has(field) && !equal(source?.[field], destination?.[field])).sort();
}

function safeValue(field, value) {
  if (SENSITIVE_FIELD.test(field)) return '[REDACTED]';
  const data = normalized(value);
  const serialized = JSON.stringify(data);
  return serialized && serialized.length > 500 ? `${serialized.slice(0, 500)}…` : data;
}

function conflictSample(collectionName, source, destination, fields) {
  const identityFields = ['name', 'displayName', 'code', 'title', 'email', 'farmId', 'businessId'];
  return {
    collection: collectionName,
    _id: String(source._id),
    identity: Object.fromEntries(identityFields.filter(field => source[field] !== undefined).map(field => [field, safeValue(field, source[field])])),
    differingFields: fields,
    differences: Object.fromEntries(fields.map(field => [field, {
      staging: safeValue(field, source[field]),
      FarmsenceAI: safeValue(field, destination[field])
    }]))
  };
}

async function mergeCollection(sourceDb, destinationDb, collectionName, commit) {
  const sourceCollection = sourceDb.collection(collectionName);
  const destinationCollection = destinationDb.collection(collectionName);
  const summary = {
    insertedCount: 0,
    conflictCount: 0,
    batchCodesSyncedCount: 0,
    alreadyPresentCount: 0,
    insertErrorCount: 0,
    sourceCount: await sourceCollection.countDocuments({}),
    destinationOnlyCount: 0,
    conflictSamples: [],
    insertErrors: []
  };

  const sourceIds = [];
  for await (const sourceDocument of sourceCollection.find({})) {
    sourceIds.push(sourceDocument._id);
    const destinationDocument = await destinationCollection.findOne({ _id: sourceDocument._id });
    if (!destinationDocument) {
      if (commit) {
        try {
          await destinationCollection.insertOne(sourceDocument);
          summary.insertedCount += 1;
        } catch (error) {
          summary.insertErrorCount += 1;
          if (summary.insertErrors.length < MAX_CONFLICT_SAMPLES) {
            summary.insertErrors.push({ _id: String(sourceDocument._id), code: error.code, message: error.message });
          }
        }
      } else {
        summary.insertedCount += 1;
      }
      continue;
    }

    const ignoredFields = collectionName === 'bird_batches' ? new Set(['code']) : new Set();
    const fields = differingFields(sourceDocument, destinationDocument, ignoredFields);
    if (collectionName === 'bird_batches' && !equal(sourceDocument.code, destinationDocument.code)) {
      summary.batchCodesSyncedCount += 1;
      if (commit) await destinationCollection.updateOne({ _id: sourceDocument._id }, { $set: { code: sourceDocument.code } });
    }
    if (fields.length) {
      summary.conflictCount += 1;
      if (summary.conflictSamples.length < MAX_CONFLICT_SAMPLES) {
        summary.conflictSamples.push(conflictSample(collectionName, sourceDocument, destinationDocument, fields));
      }
    } else if (!(collectionName === 'bird_batches' && !equal(sourceDocument.code, destinationDocument.code))) {
      summary.alreadyPresentCount += 1;
    }
  }

  summary.destinationOnlyCount = await destinationCollection.countDocuments(
    sourceIds.length ? { _id: { $nin: sourceIds } } : {}
  );
  return summary;
}

async function writeLogs(result, mode) {
  await fsp.mkdir(LOG_DIRECTORY, { recursive: true });
  const summaryPath = path.join(LOG_DIRECTORY, `006-merge-summary-${mode}.json`);
  const conflictsPath = path.join(LOG_DIRECTORY, `006-merge-conflicts-${mode}.json`);
  const summaryForFile = {
    ...result,
    collections: Object.fromEntries(Object.entries(result.collections).map(([name, row]) => [name, {
      ...row,
      conflictSamples: undefined,
      insertErrors: undefined
    }]))
  };
  const conflictLog = Object.fromEntries(Object.entries(result.collections).map(([name, row]) => [name, {
    conflictCount: row.conflictCount,
    conflictSamples: row.conflictSamples,
    insertErrorCount: row.insertErrorCount,
    insertErrors: row.insertErrors
  }]));
  await Promise.all([
    fsp.writeFile(summaryPath, `${JSON.stringify(summaryForFile, null, 2)}\n`),
    fsp.writeFile(conflictsPath, `${JSON.stringify(conflictLog, null, 2)}\n`)
  ]);
  return { conflictsPath, summaryPath };
}

async function runMerge({ commit = false } = {}) {
  const source = readEnvironment('.env.staging');
  const destination = readEnvironment('.env');
  if (source.databaseName === destination.databaseName) throw new Error('Source and destination database names must differ');
  assertCommitSafety({
    commit,
    databaseName: destination.databaseName,
    environment: process.env
  });
  assertDatabaseNameNotProtected(destination.databaseName, process.env);
  console.log(`Mode: ${commit ? 'COMMIT' : 'DRY RUN (no database writes)'}`);
  console.log(`Source: ${source.filePath} -> ${source.databaseName}`);
  console.log(`Destination: ${destination.filePath} -> ${destination.databaseName}`);

  const [sourceConnection, destinationConnection] = await Promise.all([
    mongoose.createConnection(source.mongoUri).asPromise(),
    mongoose.createConnection(destination.mongoUri).asPromise()
  ]);
  try {
    const collections = {};
    for (const collectionName of COLLECTIONS) {
      collections[collectionName] = await mergeCollection(
        sourceConnection.db,
        destinationConnection.db,
        collectionName,
        commit
      );
    }
    const result = {
      generatedAt: new Date().toISOString(),
      mode: commit ? 'commit' : 'dry-run',
      sourceDatabase: source.databaseName,
      destinationDatabase: destination.databaseName,
      collections
    };
    const logPaths = await writeLogs(result, commit ? 'commit' : 'dry-run');
    console.table(Object.entries(collections).map(([collection, row]) => ({
      collection,
      insertedCount: row.insertedCount,
      conflictCount: row.conflictCount,
      batchCodesSyncedCount: row.batchCodesSyncedCount,
      alreadyPresentCount: row.alreadyPresentCount,
      destinationOnlyCount: row.destinationOnlyCount,
      insertErrorCount: row.insertErrorCount
    })));
    console.log(`Summary: ${logPaths.summaryPath}`);
    console.log(`Conflict samples: ${logPaths.conflictsPath}`);
    return result;
  } finally {
    await Promise.all([sourceConnection.close(), destinationConnection.close()]);
  }
}

if (require.main === module) {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  runMerge(options).catch(error => {
    console.error('Database merge failed:', error.message || error);
    process.exitCode = 1;
  });
}

module.exports = {
  COLLECTIONS,
  differingFields,
  normalized,
  parseArguments,
  runMerge
};
