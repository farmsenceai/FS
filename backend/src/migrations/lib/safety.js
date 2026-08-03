const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const BACKEND_DIRECTORY = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_STAGING_ENV_FILE = '.env.staging';
function protectedProductionDatabaseName(environment = process.env) {
  return String(environment.PROTECTED_PRODUCTION_DB_NAME || '').trim() || null;
}

function assertDatabaseNameNotProtected(databaseName, environment = process.env) {
  const protectedName = protectedProductionDatabaseName(environment);
  if (protectedName && databaseName?.toLowerCase() === protectedName.toLowerCase()) {
    throw new Error(
      `Refusing to proceed: target database '${databaseName}' matches PROTECTED_PRODUCTION_DB_NAME`
    );
  }
}

function parseMigrationArguments(argv) {
  let commit = false;
  let stagingEnvFile = DEFAULT_STAGING_ENV_FILE;
  let stagingEnvFileExplicit = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--') {
      continue;
    } else if (argument === '--commit') {
      commit = true;
    } else if (argument === '--staging-env-file') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('--staging-env-file requires a path');
      }
      stagingEnvFile = value;
      stagingEnvFileExplicit = true;
      index += 1;
    } else if (argument.startsWith('--staging-env-file=')) {
      stagingEnvFile = argument.slice('--staging-env-file='.length);
      if (!stagingEnvFile) throw new Error('--staging-env-file requires a path');
      stagingEnvFileExplicit = true;
    } else {
      throw new Error(`Unknown migration argument: ${argument}`);
    }
  }

  return { commit, stagingEnvFile, stagingEnvFileExplicit };
}

function resolveTargetDatabaseName(mongoUri) {
  if (!mongoUri) return null;

  try {
    const parsed = new URL(mongoUri);
    const optionDatabaseName = parsed.searchParams.get('dbName');
    if (optionDatabaseName) return decodeURIComponent(optionDatabaseName).trim() || null;
    return decodeURIComponent(parsed.pathname.replace(/^\/+|\/+$/g, '')).trim() || null;
  } catch {
    const withoutQuery = String(mongoUri).split('?')[0].replace(/\/+$/, '');
    const finalSegment = withoutQuery.slice(withoutQuery.lastIndexOf('/') + 1);
    return decodeURIComponent(finalSegment).trim() || null;
  }
}

function loadMigrationEnvironment(options, ambientEnvironment = process.env) {
  const resolvedEnvFile = path.isAbsolute(options.stagingEnvFile)
    ? path.resolve(options.stagingEnvFile)
    : path.resolve(BACKEND_DIRECTORY, options.stagingEnvFile);
  const shellCommitAcknowledgment = ambientEnvironment.ALLOW_BACKFILL_COMMIT;

  if (!fs.existsSync(resolvedEnvFile)) {
    throw new Error(`Staging env file does not exist: ${resolvedEnvFile}`);
  }

  delete ambientEnvironment.MONGO_URI;
  delete ambientEnvironment.MONGODB_URI;
  const result = dotenv.config({
    path: resolvedEnvFile,
    override: true,
    processEnv: ambientEnvironment
  });
  if (result.error) throw new Error(`Unable to load staging env file: ${resolvedEnvFile}`);
  if (shellCommitAcknowledgment === 'true') {
    ambientEnvironment.ALLOW_BACKFILL_COMMIT = 'true';
  }

  const mongoUri = ambientEnvironment.MONGO_URI || ambientEnvironment.MONGODB_URI;
  const databaseName = resolveTargetDatabaseName(mongoUri);
  console.log(`Target env file: ${resolvedEnvFile} -> database: ${databaseName || '<unresolved>'}`);

  if (!mongoUri) throw new Error('MONGO_URI or MONGODB_URI is missing from the selected env file');
  if (!databaseName) throw new Error('Target database name could not be resolved from the selected env file');
  assertDatabaseNameNotProtected(databaseName, ambientEnvironment);

  return { databaseName, displayPath: resolvedEnvFile, mongoUri, resolvedEnvFile };
}

function assertCommitSafety({ commit, databaseName, environment = process.env }) {
  if (!commit) return;
  if (environment.ALLOW_BACKFILL_COMMIT !== 'true') {
    throw new Error(
      'Refusing to commit: set ALLOW_BACKFILL_COMMIT=true to confirm this is NOT production'
    );
  }
  if (!databaseName) {
    throw new Error('Refusing to commit: the target database name could not be resolved');
  }
  assertDatabaseNameNotProtected(databaseName, environment);
  if (environment.NODE_ENV === 'production') {
    throw new Error('Refusing to run this one-off migration with --commit in NODE_ENV=production');
  }
}

function initializeMigrationSafety(argv = process.argv.slice(2)) {
  const options = parseMigrationArguments(argv);
  const environment = loadMigrationEnvironment(options);
  console.log(`Target database: ${environment.databaseName}`);
  assertCommitSafety({ commit: options.commit, databaseName: environment.databaseName });
  if (options.commit) {
    console.log(`Proceeding with --commit against: ${environment.databaseName}`);
  }
  return { options, environment };
}

module.exports = {
  BACKEND_DIRECTORY,
  DEFAULT_STAGING_ENV_FILE,
  assertDatabaseNameNotProtected,
  assertCommitSafety,
  initializeMigrationSafety,
  loadMigrationEnvironment,
  parseMigrationArguments,
  protectedProductionDatabaseName,
  resolveTargetDatabaseName
};
