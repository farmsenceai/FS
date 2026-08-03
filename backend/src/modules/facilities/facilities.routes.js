const express = require('express');
const authMiddleware = require('../../../modules/auth/auth.middleware');
const requireTenantContext = require('../../middleware/tenantContext');
const controller = require('./facilities.controller');

const router = express.Router();
const tenantRouteMiddleware = [authMiddleware, requireTenantContext()];

router.post('/farms/:farmId/facilities', ...tenantRouteMiddleware, controller.createFacility);
router.get('/farms/:farmId/facilities', ...tenantRouteMiddleware, controller.listFarmFacilities);
router.get('/farms/:farmId/facilities/:id', ...tenantRouteMiddleware, controller.getFacility);
router.patch('/farms/:farmId/facilities/:id', ...tenantRouteMiddleware, controller.updateFacility);
router.delete('/farms/:farmId/facilities/:id', ...tenantRouteMiddleware, controller.deleteFacility);

module.exports = router;
