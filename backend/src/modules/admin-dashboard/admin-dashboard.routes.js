const express = require('express');
const authMiddleware = require('../../../modules/auth/auth.middleware');
const controller = require('./admin-dashboard.controller');
const { requirePlatformAdmin } = require('./admin-dashboard.policy');

const router = express.Router();
router.use(authMiddleware, requirePlatformAdmin);

router.get('/overview', controller.overview);
router.get('/farmers', controller.listFarmers);
router.get('/farmers/:id', controller.getFarmer);
router.patch('/farmers/:id', controller.updateFarmer);
router.patch('/farmers/:id/status', controller.updateFarmerStatus);
router.get('/businesses', controller.listBusinesses);
router.get('/businesses/:id', controller.getBusiness);
router.patch('/businesses/:id/status', controller.updateBusinessStatus);
router.get('/project-managers', controller.listProjectManagers);
router.post('/project-managers', controller.createProjectManager);
router.get('/project-managers/:id', controller.getProjectManager);
router.patch('/project-managers/:id', controller.updateProjectManager);
router.patch('/project-managers/:id/status', controller.updateProjectManagerStatus);
router.get('/approvals', controller.listApprovals);
router.post('/approvals/:entityType/:id/decision', controller.decideApproval);
router.get('/platform-settings', controller.platformSettings);
router.patch('/platform-settings', controller.updatePlatformSettings);
router.get('/audit-events', controller.listAuditEvents);
router.get('/platform-revenue', controller.platformRevenue);

module.exports = router;
