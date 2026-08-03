const service = require('./batch-sales.service');
function status(error) { return error?.code === 'VALIDATION_ERROR' || error?.name === 'CastError' || error?.name === 'ValidationError' ? 400 : error?.code === 'POLICY_DENIED' ? 403 : error?.code === 'NOT_FOUND' ? 404 : error?.code === 'CONFLICT' || error?.code === 11000 ? 409 : 500; }
function fail(res, error) { const code = status(error); if (code === 500) console.error('Batch sale request failed', error); return res.status(code).json({ error: code === 500 ? 'Internal server error' : error.message, ...(error.details ? { details: error.details } : {}) }); }
const action = handler => async (req, res) => { try { return await handler(req, res); } catch (error) { return fail(res, error); } };
const args = req => [req.user, req.tenant.businessId, req.params.farmId];
module.exports = {
  createSale: action(async (req, res) => res.status(201).json({ sale: await service.createSale(...args(req), req.body) })),
  listSales: action(async (req, res) => res.json(await service.listSales(...args(req), req.query))),
  getSale: action(async (req, res) => res.json({ sale: await service.getSale(...args(req), req.params.id) })),
  updateSale: action(async (req, res) => res.json({ sale: await service.updateSale(...args(req), req.params.id, req.body) })),
  deleteSale: action(async (req, res) => res.json({ sale: await service.deleteSale(...args(req), req.params.id) }))
};
