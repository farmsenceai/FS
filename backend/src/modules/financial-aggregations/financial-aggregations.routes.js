const express = require('express');
const authMiddleware = require('../../../modules/auth/auth.middleware');
const controller = require('../../../modules/finance/finance.controller');

const router = express.Router();
function requireFinancialRole(req, res, next) {
  if (!['admin', 'business'].includes(req.user?.role) && req.user?.platformRole !== 'admin') {
    return res.status(403).json({ error: 'Financial data access requires an admin or business role' });
  }
  return next();
}
const access = [authMiddleware, requireFinancialRole];

router.get('/financial/overview', ...access, controller.getOverview);
router.get('/financial/batches', ...access, controller.getBatches);
router.get('/financial/batchwise-revenue', ...access, controller.getBatchwiseRevenue);
router.get('/financial/historical-reports', ...access, controller.getHistoricalReports);
router.get('/financial/forecast', ...access, controller.getProfitForecast);
router.get('/financial/savings', ...access, controller.getSavings);

module.exports = router;
