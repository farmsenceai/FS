const service = require('./admin-dashboard.service');

function sendError(res, error) {
  const status = error.status || error.statusCode || 500;
  if (status >= 500) console.error('Admin dashboard request failed:', error);
  return res.status(status).json({
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: status >= 500 ? 'Unable to complete the admin request' : error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  });
}

async function overview(req, res) {
  try { return res.json({ overview: await service.getOverview(req.user) }); }
  catch (error) { return sendError(res, error); }
}

async function listFarmers(req, res) {
  try { return res.json(await service.listFarmers(req.user, req.query)); }
  catch (error) { return sendError(res, error); }
}

async function getFarmer(req, res) {
  try { return res.json({ farmer: await service.getFarmer(req.user, req.params.id) }); }
  catch (error) { return sendError(res, error); }
}

async function updateFarmerStatus(req, res) {
  try { return res.json({ farmer: await service.updateFarmerStatus(req.user, req.params.id, req.body) }); }
  catch (error) { return sendError(res, error); }
}
async function updateFarmer(req, res) {
  try { return res.json({ farmer: await service.updateFarmer(req.user, req.params.id, req.body) }); }
  catch (error) { return sendError(res, error); }
}

async function listBusinesses(req, res) {
  try { return res.json(await service.listBusinesses(req.user, req.query)); }
  catch (error) { return sendError(res, error); }
}

async function getBusiness(req, res) {
  try { return res.json({ business: await service.getBusiness(req.user, req.params.id) }); }
  catch (error) { return sendError(res, error); }
}

async function updateBusinessStatus(req, res) {
  try { return res.json({ business: await service.updateBusinessStatus(req.user, req.params.id, req.body) }); }
  catch (error) { return sendError(res, error); }
}

async function listApprovals(req, res) {
  try {
    const approvals = await service.listPendingApprovals(req.user, req.query);
    return res.json({ approvals, count: approvals.length });
  } catch (error) { return sendError(res, error); }
}

async function decideApproval(req, res) {
  try {
    const result = await service.decideApproval(req.user, req.params.entityType, req.params.id, req.body);
    return res.json({ result });
  } catch (error) { return sendError(res, error); }
}

async function listProjectManagers(req, res) {
  try { return res.json(await service.listProjectManagers(req.user, req.query)); }
  catch (error) { return sendError(res, error); }
}

async function getProjectManager(req, res) {
  try { return res.json({ projectManager: await service.getProjectManager(req.user, req.params.id) }); }
  catch (error) { return sendError(res, error); }
}

async function createProjectManager(req, res) {
  try { return res.status(201).json({ projectManager: await service.createProjectManager(req.user, req.body) }); }
  catch (error) { return sendError(res, error); }
}

async function updateProjectManager(req, res) {
  try { return res.json({ projectManager: await service.updateProjectManager(req.user, req.params.id, req.body) }); }
  catch (error) { return sendError(res, error); }
}

async function updateProjectManagerStatus(req, res) {
  try { return res.json({ projectManager: await service.updateProjectManagerStatus(req.user, req.params.id, req.body) }); }
  catch (error) { return sendError(res, error); }
}

const actorWithRequest = req => ({ ...req.user, requestIp: req.ip });
async function platformSettings(req, res) {
  try { return res.json({ settings: await service.getPlatformSettings(req.user) }); }
  catch (error) { return sendError(res, error); }
}
async function updatePlatformSettings(req, res) {
  try { return res.json({ settings: await service.updatePlatformSettings(actorWithRequest(req), req.body) }); }
  catch (error) { return sendError(res, error); }
}
async function listAuditEvents(req, res) {
  try { return res.json(await service.listAuditEvents(req.user, req.query)); }
  catch (error) { return sendError(res, error); }
}
async function platformRevenue(req, res) {
  try { return res.json(await service.getPlatformRevenue(req.user)); }
  catch (error) { return sendError(res, error); }
}

module.exports = {
  createProjectManager, decideApproval, getBusiness, getFarmer, getProjectManager,
  listApprovals, listBusinesses, listFarmers, listProjectManagers, overview,
  updateBusinessStatus, updateFarmerStatus, updateProjectManager, updateProjectManagerStatus,
  updateFarmer,
  platformSettings, updatePlatformSettings, listAuditEvents, platformRevenue,
};
