const service = require('./farms.service');

function errorStatus(error) {
  if (error?.code === 'VALIDATION_ERROR' || error?.name === 'CastError') return 400;
  if (error?.code === 'POLICY_DENIED') return 403;
  if (error?.code === 'NOT_FOUND') return 404;
  if (error?.code === 'CONFLICT' || error?.code === 11000) return 409;
  return 500;
}

function sendError(res, error) {
  const status = errorStatus(error);
  if (status === 500) console.error('Farm request failed', error);
  const body = { error: status === 500 ? 'Internal server error' : error.message };
  if (error.details) body.details = error.details;
  return res.status(status).json(body);
}

async function createFarm(req, res) {
  try {
    const { businessId: requestedBusinessId, ...payload } = req.body || {};
    const farm = await service.createFarm(
      req.user,
      req.tenant.businessId || requestedBusinessId,
      payload
    );
    return res.status(201).json({ farm });
  } catch (error) {
    return sendError(res, error);
  }
}

async function listFarms(req, res) {
  try {
    const result = await service.listFarms(req.user, req.tenant.businessId, req.query);
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
}

async function listFarmDirectory(req, res) {
  try {
    const farms = await service.listFarmDirectory(req.user);
    return res.json({ data: farms });
  } catch (error) {
    return sendError(res, error);
  }
}

async function getFarm(req, res) {
  try {
    const farm = await service.getFarm(req.user, req.tenant.businessId, req.params.id);
    return res.json({ farm });
  } catch (error) {
    return sendError(res, error);
  }
}

async function getFarmRating(req, res) {
  try {
    return res.json(await service.getFarmRating(req.user, req.tenant.businessId, req.params.id));
  } catch (error) {
    return sendError(res, error);
  }
}

async function updateFarm(req, res) {
  try {
    const farm = await service.updateFarm(
      req.user,
      req.tenant.businessId,
      req.params.id,
      req.body
    );
    return res.json({ farm });
  } catch (error) {
    return sendError(res, error);
  }
}

async function closeFarm(req, res) {
  try {
    const farm = await service.closeFarm(req.user, req.tenant.businessId, req.params.id);
    return res.json({ farm });
  } catch (error) {
    return sendError(res, error);
  }
}

async function deleteFarm(req, res) {
  try {
    const farm = await service.deleteFarm(req.user, req.tenant.businessId, req.params.id);
    return res.json({ farm });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { createFarm, listFarms, listFarmDirectory, getFarm, getFarmRating, updateFarm, closeFarm, deleteFarm };
