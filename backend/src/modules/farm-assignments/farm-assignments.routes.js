const express = require('express');
const authMiddleware = require('../../../modules/auth/auth.middleware');
const requireTenantContext = require('../../middleware/tenantContext');
const controller = require('./farm-assignments.controller');

const router = express.Router();
const tenantRouteMiddleware = [authMiddleware, requireTenantContext()];

router.post(
  '/farms/:farmId/assignments',
  ...tenantRouteMiddleware,
  controller.assignUserToFarm
);
router.get(
  '/farms/:farmId/assignments',
  ...tenantRouteMiddleware,
  controller.listFarmAssignments
);
router.get(
  '/farms/:farmId/farmers',
  ...tenantRouteMiddleware,
  controller.getFarmRoster
);
router.post(
  '/farms/:farmId/assignments/:assignmentId/end',
  ...tenantRouteMiddleware,
  controller.endAssignment
);
router.get('/users/:userId/assignments', authMiddleware, controller.listUserAssignments);

module.exports = router;
