const service = require('./farmer-fees.service');
function sendError(res, error) {
  const status = error.status || (error.name === 'CastError' ? 400 : 500);
  if (status === 500) console.error('Farmer fee request failed', error);
  return res.status(status).json({ error: status === 500 ? 'Internal server error' : error.message, ...(error.details ? { details: error.details } : {}) });
}
const action = handler => async (req, res) => { try { return await handler(req, res); } catch (error) { return sendError(res, error); } };
const createFee = action(async (req, res) => res.status(201).json({ fee: await service.createFee(req.user, req.body) }));
const listFees = action(async (req, res) => res.json(await service.listFees(req.user, req.query)));
const getSummary = action(async (req, res) => {
  const { farmId, farmerId } = req.query;
  if (farmId) {
    if (farmerId) console.warn('Farmer fee summary received both farmId and farmerId; farmId takes precedence.');
    return res.json(await service.getFeeSummaryForFarm(req.user, farmId));
  }
  return res.json(await service.getFeeSummaryForFarmer(req.user, farmerId));
});
const getFee = action(async (req, res) => res.json({ fee: await service.getFee(req.user, req.params.id) }));
const updateFee = action(async (req, res) => res.json({ fee: await service.updateFee(req.user, req.params.id, req.body) }));
const markPaid = action(async (req, res) => res.json({ fee: await service.markFeeAsPaid(req.user, req.params.id, req.body) }));
const cancelFee = action(async (req, res) => res.json({ fee: await service.cancelFee(req.user, req.params.id) }));
module.exports = { createFee, listFees, getSummary, getFee, updateFee, markPaid, cancelFee };
