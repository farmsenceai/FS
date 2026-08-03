const express = require('express');
const authMiddleware = require('../../../modules/auth/auth.middleware');
const requireTenantContext = require('../../middleware/tenantContext');
const controller = require('./bird-batches.controller');

const router = express.Router();
const tenantRouteMiddleware = [authMiddleware, requireTenantContext()];

router.post('/farms/:farmId/batches', ...tenantRouteMiddleware, controller.createBatch);
router.get('/farms/:farmId/batches', ...tenantRouteMiddleware, controller.listFarmBatches);
router.get('/farms/:farmId/batches/:id', ...tenantRouteMiddleware, controller.getBatch);
router.patch('/farms/:farmId/batches/:id', ...tenantRouteMiddleware, controller.updateBatch);
router.post(
  '/farms/:farmId/batches/:id/harvest',
  ...tenantRouteMiddleware,
  controller.harvestBatch
);

module.exports = router;
