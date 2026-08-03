const express = require('express');
const authMiddleware = require('../../../modules/auth/auth.middleware');
const controller = require('./organizations.controller');

const router = express.Router();

router.post('/organizations', authMiddleware, controller.createOrganization);
router.get('/organizations', authMiddleware, controller.listOrganizations);
router.get('/organizations/:id/dashboard', authMiddleware, controller.getOrganizationDashboard);
router.get('/organizations/:id', authMiddleware, controller.getOrganization);
router.patch('/organizations/:id', authMiddleware, controller.updateOrganization);
router.post('/organizations/:id/suspend', authMiddleware, controller.suspendOrganization);
router.delete('/organizations/:id', authMiddleware, controller.deleteOrganization);

module.exports = router;
