const service = require('./farm-assignments.service');

function errorStatus(error) {
  if (error?.code === 'VALIDATION_ERROR' || error?.name === 'CastError') return 400;
  if (error?.code === 'POLICY_DENIED') return 403;
  if (error?.code === 'NOT_FOUND') return 404;
  if (error?.code === 'CONFLICT' || error?.code === 11000) return 409;
  return 500;
}

function sendError(res, error) {
  const status = errorStatus(error);
  if (status === 500) console.error('Farm assignment request failed', error);
  const body = { error: status === 500 ? 'Internal server error' : error.message };
  if (error.details) body.details = error.details;
  return res.status(status).json(body);
}

async function assignUserToFarm(req, res) {
  try {
    const assignment = await service.assignUserToFarm(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.body
    );
    return res.status(201).json({ assignment });
  } catch (error) {
    return sendError(res, error);
  }
}

async function listFarmAssignments(req, res) {
  try {
    const result = await service.listFarmAssignments(
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

async function listUserAssignments(req, res) {
  try {
    const assignments = await service.listUserAssignments(req.user, req.params.userId);
    return res.json({ assignments });
  } catch (error) {
    return sendError(res, error);
  }
}

async function getFarmRoster(req, res) {
  try {
    const farmers = await service.getFarmRoster(req.user, req.params.farmId);
    return res.json({ farmers });
  } catch (error) {
    return sendError(res, error);
  }
}

async function endAssignment(req, res) {
  try {
    const assignment = await service.endAssignment(
      req.user,
      req.tenant.businessId,
      req.params.farmId,
      req.params.assignmentId
    );
    return res.json({ assignment });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  assignUserToFarm,
  listFarmAssignments,
  listUserAssignments,
  getFarmRoster,
  endAssignment
};
