const mongoose = require('mongoose');
const { initializeMigrationSafety } = require('./lib/safety');
const OrganizationMembership = require('../modules/organization-memberships/organization-memberships.model');

let migration;
try {
  migration = initializeMigrationSafety(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  if (require.main === module) process.exit(1);
  throw error;
}

async function run({ commit = false } = {}) {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);
  try {
    const assignments = mongoose.connection.collection('farm_assignments');
    const memberships = OrganizationMembership.collection;
    const users = mongoose.connection.collection('users');

    const farmerIds = await users.distinct('_id', { role: 'farmer' });
    const deleteFilter = { userId: { $nin: farmerIds } };
    const normalizeFilter = {
      userId: { $in: farmerIds },
      $or: [
        { assignmentRole: { $exists: true } },
        { permissions: { $exists: true } }
      ]
    };

    const [toDelete, toNormalize, membershipsToDelete] = await Promise.all([
      assignments.countDocuments(deleteFilter),
      assignments.countDocuments(normalizeFilter),
      memberships.countDocuments({})
    ]);

    let deleted = 0;
    let normalized = 0;
    let membershipsDeleted = 0;
    if (commit) {
      const deleteResult = await assignments.deleteMany(deleteFilter);
      const normalizeResult = await assignments.updateMany(
        normalizeFilter,
        { $unset: { assignmentRole: '', permissions: '' } }
      );
      const membershipResult = await memberships.deleteMany({});
      deleted = deleteResult.deletedCount;
      normalized = normalizeResult.modifiedCount;
      membershipsDeleted = membershipResult.deletedCount;
    }

    const summary = {
      mode: commit ? 'commit' : 'dry-run',
      assignmentsDeleted: commit ? deleted : toDelete,
      assignmentsNormalized: commit ? normalized : toNormalize,
      organizationMembershipsDeleted: commit ? membershipsDeleted : membershipsToDelete
    };
    console.log(JSON.stringify(summary, null, 2));
    return summary;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  run({ commit: migration.options.commit }).catch(error => {
    console.error('Farm-assignment cleanup failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { run };
