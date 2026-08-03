const express = require('express');
const authMiddleware = require('../../../modules/auth/auth.middleware');
const requireTenantContext = require('../../middleware/tenantContext');
const controller = require('./flock-records.controller');

const router = express.Router();
const tenantRouteMiddleware = [authMiddleware, requireTenantContext()];

router.post(
  '/farms/:farmId/batches/:batchId/records',
  ...tenantRouteMiddleware,
  controller.submitDailyRecord
);
router.get(
  '/farms/:farmId/batches/:batchId/records',
  ...tenantRouteMiddleware,
  controller.listBatchRecords
);
router.post(
  '/farms/:farmId/batches/:batchId/records/:recordId/correct',
  ...tenantRouteMiddleware,
  controller.correctRecord
);

module.exports = router;
