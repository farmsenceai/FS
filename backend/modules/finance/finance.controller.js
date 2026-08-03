const financeService = require('./finance.service');

function handleError(res, err, fallbackMessage) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  return res.status(500).json({ error: fallbackMessage });
}

async function getOverview(req, res) {
  try {
    res.json(await financeService.getOverview(req.user, req.query));
  } catch (err) {
    console.error('GET /api/financial/overview error:', err);
    handleError(res, err, 'Failed to fetch financial overview');
  }
}

async function getBatches(req, res) {
  try {
    res.json(await financeService.getBatches(req.user, req.query));
  } catch (err) {
    console.error('GET /api/financial/batches error:', err);
    handleError(res, err, 'Failed to fetch batch profitability');
  }
}

async function getSavings(req, res) {
  try {
    res.json(await financeService.getSavings(req.query.limit));
  } catch (err) {
    console.error('GET /api/financial/savings error:', err);
    handleError(res, err, 'Failed to fetch cost saving opportunities');
  }
}

async function getProfitForecast(req, res) {
  try {
    res.json(await financeService.getProfitForecast(req.user, req.query));
  } catch (err) {
    console.error('GET /api/financial/forecast error:', err);
    handleError(res, err, 'Failed to fetch profit forecast');
  }
}

async function getBatchwiseRevenue(req, res) {
  try {
    res.json(await financeService.getBatchwiseRevenue(req.user, req.query));
  } catch (err) {
    console.error('GET /api/financial/batchwise-revenue error:', err);
    handleError(res, err, 'Failed to fetch batchwise revenue');
  }
}

async function getHistoricalReports(req, res) {
  try { res.json(await financeService.getHistoricalReports(req.user, req.query)); }
  catch (err) { console.error('GET /api/financial/historical-reports error:', err); handleError(res, err, 'Failed to fetch historical reports'); }
}

async function getFarmerSummary(req, res) { try { res.json(await financeService.getFarmerSummary(req.user.userId)); } catch (err) { handleError(res, err, 'Failed to fetch farmer earnings'); } }
async function getFarmerClaims(req, res) { try { res.json(await financeService.getFarmerClaims(req.user.userId)); } catch (err) { handleError(res, err, 'Failed to fetch earning claims'); } }
async function createFarmerClaim(req, res) { try { res.status(201).json({ claim: await financeService.createFarmerClaim(req.user, req.body) }); } catch (err) { handleError(res, err, 'Failed to create earning claim'); } }
async function updateFarmerClaim(req, res) { try { res.json({ claim: await financeService.updateFarmerClaim(req.user.userId, req.params.id, req.body) }); } catch (err) { handleError(res, err, 'Failed to update earning claim'); } }
async function deleteFarmerClaim(req, res) { try { res.json({ deleted: await financeService.deleteFarmerClaim(req.user.userId, req.params.id) }); } catch (err) { handleError(res, err, 'Failed to delete earning claim'); } }
async function getClaims(req, res) { try { res.json(await financeService.getClaims(req.query)); } catch (err) { handleError(res, err, 'Failed to fetch farmer claims'); } }
async function updateClaimStatus(req, res) { try { res.json({ claim: await financeService.updateClaimStatus(req.params.id, req.body) }); } catch (err) { handleError(res, err, 'Failed to update claim status'); } }

module.exports = {
  getBatches,
  getOverview,
  getProfitForecast,
  getBatchwiseRevenue,
  getHistoricalReports,
  getSavings,
  getFarmerSummary,
  getFarmerClaims,
  createFarmerClaim,
  updateFarmerClaim,
  deleteFarmerClaim,
  getClaims,
  updateClaimStatus
};
