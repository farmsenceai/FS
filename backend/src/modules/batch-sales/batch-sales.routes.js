const express = require('express');
const authMiddleware = require('../../../modules/auth/auth.middleware');
const requireTenantContext = require('../../middleware/tenantContext');
const controller = require('./batch-sales.controller');
const router = express.Router();
function requireFinancialRole(req, res, next) {
  if (!['admin', 'business'].includes(req.user?.role) && req.user?.platformRole !== 'admin') {
    return res.status(403).json({ error: 'Financial data access requires an admin or business role' });
  }
  return next();
}
const access = [authMiddleware, requireFinancialRole, requireTenantContext()];
router.post('/farms/:farmId/batch-sales', ...access, controller.createSale);
router.get('/farms/:farmId/batch-sales', ...access, controller.listSales);
router.get('/farms/:farmId/batch-sales/:id', ...access, controller.getSale);
router.patch('/farms/:farmId/batch-sales/:id', ...access, controller.updateSale);
router.delete('/farms/:farmId/batch-sales/:id', ...access, controller.deleteSale);
module.exports = router;
