const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const {
  assertCommitSafety,
  assertDatabaseNameNotProtected,
  protectedProductionDatabaseName
} = require('../src/migrations/lib/safety');

describe('migration safety configuration', () => {
  it('protects no database by name when the environment variable is unset', () => {
    assert.equal(protectedProductionDatabaseName({}), null);
    assert.doesNotThrow(() => assertDatabaseNameNotProtected('FarmsenceAI', {}));
  });

  it('unconditionally protects the configured production database name', () => {
    const environment = { PROTECTED_PRODUCTION_DB_NAME: 'RealProduction' };
    assert.throws(
      () => assertDatabaseNameNotProtected('realproduction', environment),
      /PROTECTED_PRODUCTION_DB_NAME/
    );
  });

  it('still requires ALLOW_BACKFILL_COMMIT for every commit', () => {
    assert.doesNotThrow(() => assertCommitSafety({ commit: false, databaseName: 'working', environment: {} }));
    assert.throws(
      () => assertCommitSafety({ commit: true, databaseName: 'working', environment: {} }),
      /ALLOW_BACKFILL_COMMIT/
    );
    assert.doesNotThrow(() => assertCommitSafety({
      commit: true,
      databaseName: 'working',
      environment: { ALLOW_BACKFILL_COMMIT: 'true', NODE_ENV: 'development' }
    }));
  });
});
