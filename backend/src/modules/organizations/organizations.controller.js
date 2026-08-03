const service = require('./organizations.service');

function errorStatus(error) {
  if (error?.code === 'VALIDATION_ERROR' || error?.name === 'CastError') return 400;
  if (error?.code === 'POLICY_DENIED') return 403;
  if (error?.code === 'NOT_FOUND') return 404;
  if (error?.code === 'SLUG_CONFLICT' || error?.code === 11000) return 409;
  return 500;
}

function sendError(res, error) {
  const status = errorStatus(error);
  if (status === 500) console.error('Organization request failed', error);

  const body = {
    error: status === 500 ? 'Internal server error' : error.message
  };
  if (error.details) body.details = error.details;
  return res.status(status).json(body);
}

async function createOrganization(req, res) {
  try {
    const organization = await service.createOrganization(req.user, req.body);
    return res.status(201).json({ organization });
  } catch (error) {
    return sendError(res, error);
  }
}

async function listOrganizations(req, res) {
  try {
    const result = await service.listOrganizations(req.user, req.query);
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
}

async function getOrganization(req, res) {
  try {
    const organization = await service.getOrganization(req.user, req.params.id);
    return res.json({ organization });
  } catch (error) {
    return sendError(res, error);
  }
}

async function getOrganizationDashboard(req, res) {
  try {
    const dashboard = await service.getOrganizationDashboard(req.user, req.params.id);
    return res.json(dashboard);
  } catch (error) {
    return sendError(res, error);
  }
}

async function updateOrganization(req, res) {
  try {
    const organization = await service.updateOrganization(req.user, req.params.id, req.body);
    return res.json({ organization });
  } catch (error) {
    return sendError(res, error);
  }
}

async function suspendOrganization(req, res) {
  try {
    const organization = await service.suspendOrganization(
      req.user,
      req.params.id,
      req.body?.reason
    );
    return res.json({ organization });
  } catch (error) {
    return sendError(res, error);
  }
}

async function deleteOrganization(req, res) {
  try {
    const organization = await service.deleteOrganization(req.user, req.params.id);
    return res.json({ organization });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = {
  createOrganization,
  listOrganizations,
  getOrganization,
  getOrganizationDashboard,
  updateOrganization,
  suspendOrganization,
  deleteOrganization
};
