const service = require('./facilities.service');

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
  if (status === 500) console.error('Facility request failed', error);
  const body = { error: status === 500 ? 'Internal server error' : error.message };
  if (error.details) body.details = error.details;
  return res.status(status).json(body);
}

async function createFacility(req, res) {
  try {
    const facility = await service.createFacility(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.body
    );
    return res.status(201).json({ facility });
  } catch (error) {
    return sendError(res, error);
  }
}

async function listFarmFacilities(req, res) {
  try {
    const result = await service.listFarmFacilities(
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

async function getFacility(req, res) {
  try {
    const facility = await service.getFacility(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.params.id
    );
    return res.json({ facility });
  } catch (error) {
    return sendError(res, error);
  }
}

async function updateFacility(req, res) {
  try {
    const facility = await service.updateFacility(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.params.id,
      req.body
    );
    return res.json({ facility });
  } catch (error) {
    return sendError(res, error);
  }
}

async function deleteFacility(req, res) {
  try {
    const facility = await service.deleteFacility(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.params.id
    );
    return res.json({ facility });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  createFacility,
  listFarmFacilities,
  getFacility,
  updateFacility,
  deleteFacility
};
