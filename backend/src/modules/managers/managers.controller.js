const service = require('./managers.service');

function sendError(res, error) {
  const status = error.status || (error.name === 'CastError' ? 400 : 500);
  if (status === 500) console.error('Manager request failed', error);
  return res.status(status).json({ error: status === 500 ? 'Internal server error' : error.message, ...(error.details ? { details: error.details } : {}) });
}
const action = handler => async (req, res) => { try { return await handler(req, res); } catch (error) { return sendError(res, error); } };

const createManager = action(async (req, res) => res.status(201).json({ manager: await service.createManager(req.user, req.body) }));
const listManagers = action(async (req, res) => res.json(await service.listManagers(req.user, req.query)));
const getManager = action(async (req, res) => res.json({ manager: await service.getManager(req.user, req.params.id) }));
const updateManager = action(async (req, res) => res.json({ manager: await service.updateManager(req.user, req.params.id, req.body) }));
const deleteManager = action(async (req, res) => res.json({ manager: await service.deleteManager(req.user, req.params.id) }));
const assignManager = action(async (req, res) => res.status(201).json({ assignment: await service.assignManager(req.user, req.params.farmId, req.body) }));
const listFarmManagers = action(async (req, res) => res.json({ assignments: await service.listFarmManagers(req.user, req.params.farmId) }));
const endManagerAssignment = action(async (req, res) => res.json({ assignment: await service.endManagerAssignment(req.user, req.params.farmId, req.params.assignmentId) }));
const listManagerFarms = action(async (req, res) => res.json({ assignments: await service.listManagerFarms(req.user, req.params.id) }));
const getPerformanceRatings = action(async (req, res) => res.json(await service.getPerformanceRatings(req.user)));

module.exports = { createManager, listManagers, getManager, updateManager, deleteManager,
  assignManager, listFarmManagers, endManagerAssignment, listManagerFarms, getPerformanceRatings };
