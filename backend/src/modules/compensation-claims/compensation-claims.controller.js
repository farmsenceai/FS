const service = require('./compensation-claims.service');
function status(error) { return error?.code === 'VALIDATION_ERROR' || error?.name === 'CastError' ? 400 : error?.code === 'POLICY_DENIED' ? 403 : error?.code === 'NOT_FOUND' ? 404 : error?.code === 'CONFLICT' ? 409 : 500; }
function fail(res, error) { const code = status(error); if (code === 500) console.error('Compensation claim request failed', error); return res.status(code).json({ error: code === 500 ? 'Internal server error' : error.message, ...(error.details ? { details: error.details } : {}) }); }
const action = handler => async (req, res) => { try { return await handler(req, res); } catch (error) { return fail(res, error); } };
const scope = req => [req.user, req.tenant.businessId, req.params.farmId, req.params.batchId];
module.exports = {
  create: action(async (req, res) => res.status(201).json({ claim: await service.createClaim(...scope(req), req.body) })),
  mine: action(async (req, res) => res.json(await service.listMine(req.user, req.query))),
  summary: action(async (req, res) => res.json(await service.summaryMine(req.user))),
  updateMine: action(async (req, res) => res.json({ claim: await service.updateMine(...scope(req), req.params.id, req.body) })),
  deleteMine: action(async (req, res) => res.json({ claim: await service.deleteMine(...scope(req), req.params.id) })),
  reviewList: action(async (req, res) => res.json(await service.listForReview(req.user, req.query))),
  review: action(async (req, res) => res.json({ claim: await service.reviewClaim(req.user, req.params.id, req.body) }))
};
