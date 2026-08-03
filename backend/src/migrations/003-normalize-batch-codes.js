const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { initializeMigrationSafety } = require('./lib/safety');
const { generateUniqueBatchCode } = require('../modules/bird-batches/batch-code');

let migration;
try {
  migration = initializeMigrationSafety(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  if (require.main === module) process.exit(1);
  throw error;
}

async function run({ commit = false } = {}) {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  try {
    const batches = mongoose.connection.collection('bird_batches');
    const farms = mongoose.connection.collection('farms');
    const [batchDocuments, farmDocuments] = await Promise.all([
      batches.find({}).sort({ _id: 1 }).toArray(),
      farms.find({}, { projection: { _id: 1, code: 1, name: 1 } }).toArray()
    ]);
    const farmsById = new Map(farmDocuments.map(farm => [String(farm._id), farm]));
    const usedByFarm = new Map();
    const mappings = [];

    for (const batch of batchDocuments) {
      const farmKey = String(batch.farmId);
      const farm = farmsById.get(farmKey);
      if (!farm) throw new Error(`Cannot normalize batch ${batch._id}: farm ${farmKey} was not found`);
      if (!usedByFarm.has(farmKey)) usedByFarm.set(farmKey, new Set());
      const used = usedByFarm.get(farmKey);
      const newCode = await generateUniqueBatchCode({
        farmCode: farm.code,
        isTaken: candidate => used.has(candidate)
      });
      used.add(newCode);
      mappings.push({
        batchId: String(batch._id),
        farmId: farmKey,
        farmCode: farm.code,
        farmName: farm.name,
        oldCode: batch.code || null,
        newCode
      });
    }

    if (commit && mappings.length) {
      await batches.bulkWrite(
        mappings.map(mapping => ({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(mapping.batchId) },
            update: { $set: { code: mapping.newCode, updatedAt: new Date() } }
          }
        })),
        { ordered: true }
      );
    }

    const logDirectory = path.resolve(__dirname, 'logs');
    fs.mkdirSync(logDirectory, { recursive: true });
    const logPath = path.join(
      logDirectory,
      `003-batch-code-mappings-${commit ? 'commit' : 'dry-run'}.json`
    );
    const output = {
      mode: commit ? 'commit' : 'dry-run',
      database: migration.environment.databaseName,
      generatedAt: new Date().toISOString(),
      collection: 'bird_batches',
      count: mappings.length,
      mappings
    };
    fs.writeFileSync(logPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({ ...output, logPath }, null, 2));
    return output;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  run({ commit: migration.options.commit }).catch(error => {
    console.error('Batch-code normalization failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { run };
