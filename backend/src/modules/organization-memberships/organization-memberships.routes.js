const express = require('express');
const authMiddleware = require('../../../modules/auth/auth.middleware');
const requireTenantContext = require('../../middleware/tenantContext');
const controller = require('./organization-memberships.controller');

const router = express.Router();
const tenantRouteMiddleware = [authMiddleware, requireTenantContext()];

router.post('/organizations/:businessId/memberships', ...tenantRouteMiddleware, controller.createMembership);
router.get('/organizations/:businessId/memberships', ...tenantRouteMiddleware, controller.listMemberships);
router.patch('/organizations/:businessId/memberships/:membershipId', ...tenantRouteMiddleware, controller.updateMembership);
router.delete('/organizations/:businessId/memberships/:membershipId', ...tenantRouteMiddleware, controller.removeMembership);

module.exports = router;
