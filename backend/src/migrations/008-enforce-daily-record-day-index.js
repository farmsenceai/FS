const mongoose = require('mongoose');
const { initializeMigrationSafety } = require('./lib/safety');

let migration;
try {
  migration = initializeMigrationSafety(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  if (require.main === module) process.exit(1);
  throw error;
}

const TARGET_NAME = 'unique_primary_record_per_batch_day';

async function run({ commit = false } = {}) {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  try {
    const records = mongoose.connection.collection('daily_flock_records');
    const indexes = await records.indexes();
    const legacyIndexes = indexes.filter(index =>
      index.unique &&
      index.key?.batchId === 1 &&
      index.key?.recordDate === 1 &&
      index.key?.correctsRecordId === 1
    );
    const duplicatePrimaries = await records.aggregate([
      { $match: { deletedAt: null, correctsRecordId: { $exists: false } } },
      { $group: { _id: { batchId: '$batchId', recordDate: '$recordDate' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    if (duplicatePrimaries.length) {
      throw new Error(`Cannot create the primary-day unique index: ${duplicatePrimaries.length} duplicate batch/day group(s) require reconciliation`);
    }

    if (commit) {
      for (const index of legacyIndexes) await records.dropIndex(index.name);
      if (!indexes.some(index => index.name === TARGET_NAME)) {
        await records.createIndex(
          { batchId: 1, recordDate: 1 },
          {
            name: TARGET_NAME,
            unique: true,
            partialFilterExpression: { deletedAt: null, correctsRecordId: { $exists: false } }
          }
        );
      }
    }

    const result = {
      mode: commit ? 'commit' : 'dry-run',
      collection: 'daily_flock_records',
      legacyIndexes: legacyIndexes.map(index => index.name),
      duplicatePrimaryGroups: duplicatePrimaries.length,
      targetIndex: TARGET_NAME
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  run({ commit: migration.options.commit }).catch(error => {
    console.error('Daily-record index migration failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { run };
