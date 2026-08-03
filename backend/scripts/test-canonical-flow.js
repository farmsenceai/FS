const { generateToken } = require('./generate-test-jwt');

const DEFAULT_BASE_URL = 'http://localhost:5000';
const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

class FlowFailure extends Error {}

function parseArguments(argv) {
  let userId;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--userId')) {
      throw new Error(`Unknown argument '${argument}'. Only --userId is supported.`);
    }
    if (userId) throw new Error('--userId was provided more than once');

    if (argument === '--userId') {
      userId = argv[index + 1];
      if (!userId || userId.startsWith('--')) throw new Error('--userId requires a value');
      index += 1;
    } else if (argument.startsWith('--userId=')) {
      userId = argument.slice('--userId='.length);
    } else {
      throw new Error(`Unknown argument '${argument}'. Use --userId <value>.`);
    }
  }

  if (!userId) throw new Error('--userId is required');
  if (!OBJECT_ID_PATTERN.test(userId)) {
    throw new Error('--userId must be a 24-character MongoDB ObjectId');
  }
  return { userId };
}

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function printableBody(body) {
  return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
}

function compactBody(body) {
  const rendered = typeof body === 'string' ? body : JSON.stringify(body);
  return rendered && rendered.length > 300 ? `${rendered.slice(0, 300)}...` : rendered;
}

async function requestStep({
  fetchImpl,
  logger,
  baseUrl,
  step,
  method,
  endpoint,
  token,
  body,
  expectedStatus,
  canonicalProbe = false
}) {
  let response;
  try {
    response = await fetchImpl(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
  } catch (error) {
    logger.error(`[FAIL] ${step} request failed: ${error.message}`);
    logger.error(`Server URL: ${baseUrl}`);
    throw new FlowFailure(step);
  }

  const responseBody = await parseResponseBody(response);
  if (canonicalProbe && response.status === 404) {
    logger.error(
      'Canonical v2 routes not found — is ENABLE_CANONICAL_V2=true set and the server restarted?'
    );
    logger.error(`[FAIL] ${step} returned 404`);
    logger.error(`Response body:\n${printableBody(responseBody)}`);
    throw new FlowFailure(step);
  }

  if (response.status !== expectedStatus) {
    logger.error(
      `[FAIL] ${step} returned ${response.status}: ${compactBody(responseBody)}`
    );
    logger.error(`Response body:\n${printableBody(responseBody)}`);
    throw new FlowFailure(step);
  }

  return responseBody;
}

function requireEntityId(logger, step, body, envelope) {
  const entity = body?.[envelope];
  const id = entity?._id || entity?.id;
  if (!id) {
    logger.error(`[FAIL] ${step} response did not contain ${envelope}._id`);
    logger.error(`Response body:\n${printableBody(body)}`);
    throw new FlowFailure(step);
  }
  return { entity, id };
}

async function runCanonicalFlow({
  userId,
  baseUrl = process.env.TEST_API_BASE_URL || DEFAULT_BASE_URL,
  fetchImpl = globalThis.fetch,
  logger = console,
  timestamp = Date.now()
}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('This script requires Node.js with built-in fetch support');
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const suffix = String(timestamp);
  const adminToken = generateToken({ userId, role: 'admin' });

  const organizationBody = await requestStep({
    fetchImpl,
    logger,
    baseUrl: normalizedBaseUrl,
    step: 'Organization creation',
    method: 'POST',
    endpoint: '/api/v2/organizations',
    token: adminToken,
    expectedStatus: 201,
    canonicalProbe: true,
    body: {
      legalName: `Canonical Flow Poultry ${suffix} Pvt Ltd`,
      displayName: `Canonical Flow Poultry ${suffix}`,
      slug: `demo-poultry-${suffix}`,
      legal: { countryCode: 'IN' },
      contacts: { billingEmail: `canonical-flow-${suffix}@example.invalid` }
    }
  });
  const { id: businessId } = requireEntityId(
    logger,
    'Organization creation',
    organizationBody,
    'organization'
  );
  logger.log(`[PASS] Organization created (id: ${businessId})`);

  const businessToken = generateToken({ userId, role: 'business', businessId });

  const farmBody = await requestStep({
    fetchImpl,
    logger,
    baseUrl: normalizedBaseUrl,
    step: 'Farm creation',
    method: 'POST',
    endpoint: '/api/v2/farms',
    token: businessToken,
    expectedStatus: 201,
    body: {
      code: `FLOW-${suffix}`,
      name: `Canonical Flow Farm ${suffix}`,
      location: {
        address: 'Canonical integration test farm',
        geo: { type: 'Point', coordinates: [77.5946, 12.9716] },
        countryCode: 'IN',
        timezone: 'Asia/Kolkata'
      },
      farmType: 'broiler'
    }
  });
  const { id: farmId } = requireEntityId(logger, 'Farm creation', farmBody, 'farm');
  logger.log(`[PASS] Farm created (id: ${farmId})`);

  const facilityBody = await requestStep({
    fetchImpl,
    logger,
    baseUrl: normalizedBaseUrl,
    step: 'Facility creation',
    method: 'POST',
    endpoint: `/api/v2/farms/${farmId}/facilities`,
    token: businessToken,
    expectedStatus: 201,
    body: {
      code: `SHED-${suffix}`,
      name: `Canonical Flow Shed ${suffix}`,
      type: 'shed',
      capacity: 1000
    }
  });
  const { id: facilityId } = requireEntityId(
    logger,
    'Facility creation',
    facilityBody,
    'facility'
  );
  logger.log(`[PASS] Facility created (id: ${facilityId})`);

  const batchBody = await requestStep({
    fetchImpl,
    logger,
    baseUrl: normalizedBaseUrl,
    step: 'Bird batch creation',
    method: 'POST',
    endpoint: `/api/v2/farms/${farmId}/batches`,
    token: businessToken,
    expectedStatus: 201,
    body: {
      code: `BATCH-${suffix}`,
      facilityId,
      breed: 'Cobb 500',
      birdType: 'broiler',
      initialBirdCount: 1000,
      placedAt: new Date(timestamp).toISOString(),
      status: 'active'
    }
  });
  const { id: batchId } = requireEntityId(
    logger,
    'Bird batch creation',
    batchBody,
    'batch'
  );
  logger.log(`[PASS] Bird batch created (id: ${batchId})`);

  const beforeBody = await requestStep({
    fetchImpl,
    logger,
    baseUrl: normalizedBaseUrl,
    step: 'Pre-mortality batch retrieval',
    method: 'GET',
    endpoint: `/api/v2/farms/${farmId}/batches/${batchId}`,
    token: businessToken,
    expectedStatus: 200
  });
  const beforeCount = beforeBody?.batch?.currentBirdCountCached;
  if (beforeCount !== null && beforeCount !== 1000) {
    logger.error(
      `[FAIL] Pre-mortality bird count must be null or 1000; actual: ${String(beforeCount)}`
    );
    logger.error(`Response body:\n${printableBody(beforeBody)}`);
    throw new FlowFailure('Pre-mortality count assertion');
  }
  logger.log(
    `[PASS] Pre-mortality count verified (currentBirdCountCached: ${String(beforeCount)})`
  );

  const recordBody = await requestStep({
    fetchImpl,
    logger,
    baseUrl: normalizedBaseUrl,
    step: 'Daily flock record submission',
    method: 'POST',
    endpoint: `/api/v2/farms/${farmId}/batches/${batchId}/records`,
    token: businessToken,
    expectedStatus: 201,
    body: {
      recordDate: new Date(timestamp).toISOString(),
      mortality: { count: 5, cause: 'Canonical flow verification' },
      observations: 'Created by test-canonical-flow.js'
    }
  });
  const { id: recordId } = requireEntityId(
    logger,
    'Daily flock record submission',
    recordBody,
    'record'
  );
  logger.log(`[PASS] Daily flock record submitted (id: ${recordId}, mortality: 5)`);

  const afterBody = await requestStep({
    fetchImpl,
    logger,
    baseUrl: normalizedBaseUrl,
    step: 'Post-mortality batch retrieval',
    method: 'GET',
    endpoint: `/api/v2/farms/${farmId}/batches/${batchId}`,
    token: businessToken,
    expectedStatus: 200
  });
  const afterCount = afterBody?.batch?.currentBirdCountCached;
  if (afterCount !== 995) {
    logger.error(
      `[FAIL] Bird-count recalculation mismatch: expected 995, actual ${String(afterCount)}.`
    );
    logger.error(
      "This indicates a bug in flock-records.service.js's transaction/recalculation logic."
    );
    logger.error(`Response body:\n${printableBody(afterBody)}`);
    throw new FlowFailure('Post-mortality count assertion');
  }
  logger.log('[PASS] Post-mortality count verified (currentBirdCountCached: 995)');
  logger.log('✅ Full chain verified. currentBirdCountCached correctly updated 1000 -> 995.');

  return { businessId, farmId, facilityId, batchId, recordId, beforeCount, afterCount };
}

async function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseArguments(argv);
  } catch (error) {
    console.error(`[FAIL] ${error.message}`);
    process.exitCode = 1;
    return;
  }

  try {
    await runCanonicalFlow(options);
  } catch (error) {
    if (!(error instanceof FlowFailure)) {
      console.error(`[FAIL] Unexpected canonical flow error: ${error.message}`);
    }
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { FlowFailure, parseArguments, requestStep, runCanonicalFlow };
