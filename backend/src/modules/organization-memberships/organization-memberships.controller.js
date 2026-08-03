const service = require('./organization-memberships.service');

function sendError(res, error) {
  const status = error.status || (error.code === 11000 ? 409 : 500);
  if (status === 500) console.error('Organization membership request failed', error);
  return res.status(status).json({
    error: status === 500 ? 'Internal server error' : error.message,
    ...(error.details ? { details: error.details } : {})
  });
}

function businessId(req) {
  if (String(req.tenant.businessId) !== String(req.params.businessId)) {
    const error = new Error('Route organization does not match active business context');
    error.status = 403;
    throw error;
  }
  return req.tenant.businessId;
}

async function createMembership(req, res) {
  try {
    const membership = await service.createMembership(req.user, businessId(req), req.body);
    return res.status(201).json({ membership });
  } catch (error) { return sendError(res, error); }
}

async function listMemberships(req, res) {
  try {
    return res.json(await service.listMemberships(req.user, businessId(req), req.query));
  } catch (error) { return sendError(res, error); }
}

async function updateMembership(req, res) {
  try {
    const membership = await service.updateMembership(
      req.user, businessId(req), req.params.membershipId, req.body
    );
    return res.json({ membership });
  } catch (error) { return sendError(res, error); }
}

async function removeMembership(req, res) {
  try {
    const membership = await service.removeMembership(
      req.user, businessId(req), req.params.membershipId
    );
    return res.json({ membership });
  } catch (error) { return sendError(res, error); }
}

module.exports = { createMembership, listMemberships, updateMembership, removeMembership };
