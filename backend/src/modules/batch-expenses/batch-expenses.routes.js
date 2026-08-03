const express = require('express');
const authMiddleware = require('../../../modules/auth/auth.middleware');
const requireTenantContext = require('../../middleware/tenantContext');
const controller = require('./batch-expenses.controller');
const router = express.Router();
function requireFinancialRole(req, res, next) {
  if (!['admin', 'business'].includes(req.user?.role) && req.user?.platformRole !== 'admin') {
    return res.status(403).json({ error: 'Financial data access requires an admin or business role' });
  }
  return next();
}
const access = [authMiddleware, requireFinancialRole, requireTenantContext()];
router.post('/farms/:farmId/batch-expenses', ...access, controller.createExpense);
router.get('/farms/:farmId/batch-expenses', ...access, controller.listExpenses);
router.get('/farms/:farmId/batch-expenses/:id', ...access, controller.getExpense);
router.patch('/farms/:farmId/batch-expenses/:id', ...access, controller.updateExpense);
router.delete('/farms/:farmId/batch-expenses/:id', ...access, controller.deleteExpense);
module.exports = router;
