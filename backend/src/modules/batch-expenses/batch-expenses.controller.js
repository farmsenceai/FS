const service = require('./batch-expenses.service');
function status(error) { return error?.code === 'VALIDATION_ERROR' || error?.name === 'CastError' || error?.name === 'ValidationError' ? 400 : error?.code === 'POLICY_DENIED' ? 403 : error?.code === 'NOT_FOUND' ? 404 : error?.code === 'CONFLICT' || error?.code === 11000 ? 409 : 500; }
function fail(res, error) { const code = status(error); if (code === 500) console.error('Batch expense request failed', error); return res.status(code).json({ error: code === 500 ? 'Internal server error' : error.message, ...(error.details ? { details: error.details } : {}) }); }
const action = handler => async (req, res) => { try { return await handler(req, res); } catch (error) { return fail(res, error); } };
const args = req => [req.user, req.tenant.businessId, req.params.farmId];
module.exports = {
  createExpense: action(async (req, res) => res.status(201).json({ expense: await service.createExpense(...args(req), req.body) })),
  listExpenses: action(async (req, res) => res.json(await service.listExpenses(...args(req), req.query))),
  getExpense: action(async (req, res) => res.json({ expense: await service.getExpense(...args(req), req.params.id) })),
  updateExpense: action(async (req, res) => res.json({ expense: await service.updateExpense(...args(req), req.params.id, req.body) })),
  deleteExpense: action(async (req, res) => res.json({ expense: await service.deleteExpense(...args(req), req.params.id) }))
};
