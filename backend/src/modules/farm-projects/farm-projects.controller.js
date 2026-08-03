const service = require('./farm-projects.service');
function sendError(res, error) {
  const status = error.status || (error.name === 'CastError' ? 400 : 500);
  if (status === 500) console.error('Farm project request failed', error);
  return res.status(status).json({ error: status === 500 ? 'Internal server error' : error.message, ...(error.details ? { details: error.details } : {}) });
}
const action = handler => async (req, res) => { try { return await handler(req, res); } catch (error) { return sendError(res, error); } };
const createProject = action(async (req, res) => res.status(201).json({ project: await service.createProject(req.user, req.params.farmId, req.body) }));
const listProjects = action(async (req, res) => res.json(await service.listProjects(req.user, req.params.farmId, req.query)));
const updateProject = action(async (req, res) => res.json({ project: await service.updateProject(req.user, req.params.farmId, req.params.id, req.body) }));
const createWorkUpdate = action(async (req, res) => res.status(201).json({ workUpdate: await service.createWorkUpdate(req.user, req.params.farmId, req.body) }));
const listWorkUpdates = action(async (req, res) => res.json(await service.listWorkUpdates(req.user, req.params.farmId, req.query)));
const listRecentWorkUpdates = action(async (req, res) => res.json({ data: await service.listRecentWorkUpdates(req.user, req.query) }));
module.exports = { createProject, listProjects, updateProject, createWorkUpdate, listWorkUpdates, listRecentWorkUpdates };
