const service = require('./bird-batches.service');

function errorStatus(error) {
  if (
    error?.code === 'VALIDATION_ERROR' ||
    error?.name === 'CastError' ||
    error?.name === 'ValidationError'
  ) return 400;
  if (error?.code === 'POLICY_DENIED') return 403;
  if (error?.code === 'NOT_FOUND') return 404;
  if (error?.code === 'CONFLICT' || error?.code === 11000) return 409;
  return 500;
}

function sendError(res, error) {
  const status = errorStatus(error);
  if (status === 500) console.error('Bird batch request failed', error);
  const body = { error: status === 500 ? 'Internal server error' : error.message };
  if (error.details) body.details = error.details;
  return res.status(status).json(body);
}

async function createBatch(req, res) {
  try {
    const batch = await service.createBatch(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.body
    );
    return res.status(201).json({ batch });
  } catch (error) {
    return sendError(res, error);
  }
}

async function listFarmBatches(req, res) {
  try {
    const result = await service.listFarmBatches(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.query
    );
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
}

async function getBatch(req, res) {
  try {
    const batch = await service.getBatch(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.params.id
    );
    return res.json({ batch });
  } catch (error) {
    return sendError(res, error);
  }
}

async function updateBatch(req, res) {
  try {
    const batch = await service.updateBatch(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.params.id,
      req.body
    );
    return res.json({ batch });
  } catch (error) {
    return sendError(res, error);
  }
}

async function harvestBatch(req, res) {
  try {
    const batch = await service.harvestBatch(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.params.id,
      req.body
    );
    return res.json({ batch });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { createBatch, listFarmBatches, getBatch, updateBatch, harvestBatch };
