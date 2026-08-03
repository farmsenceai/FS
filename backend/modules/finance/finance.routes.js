const express = require('express');
const authMiddleware = require('../auth/auth.middleware');
const financeController = require('./finance.controller');

const router = express.Router();

function requireFinanceRole(req, res, next) {
  if (!['admin', 'business'].includes(req.user?.role)) {
    return res.status(403).json({ msg: 'Financial overview access requires a business or admin role' });
  }

  return next();
}

router.use(authMiddleware);

router.all(['/farmer/summary', '/farmer/claims', '/farmer/claims/:id', '/claims', '/claims/:id/status'], (_req, res) =>
  res.status(410).json({ msg: 'Legacy earning claims are retired; use /api/v2/compensation-claims' })
);
router.get('/overview', requireFinanceRole, financeController.getOverview);
router.get('/forecast', requireFinanceRole, financeController.getProfitForecast);
router.get('/batchwise-revenue', requireFinanceRole, financeController.getBatchwiseRevenue);
router.get('/historical-reports', requireFinanceRole, financeController.getHistoricalReports);
router.get('/batches', requireFinanceRole, financeController.getBatches);
router.get('/savings', requireFinanceRole, financeController.getSavings);

module.exports = router;
