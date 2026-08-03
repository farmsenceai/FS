const express = require('express');
const authMiddleware = require('../../../modules/auth/auth.middleware');
const requireTenantContext = require('../../middleware/tenantContext');
const controller = require('./farms.controller');

const router = express.Router();
const tenantRouteMiddleware = [authMiddleware, requireTenantContext()];

router.get('/farms/directory', authMiddleware, controller.listFarmDirectory);
router.post('/farms', ...tenantRouteMiddleware, controller.createFarm);
router.get('/farms', ...tenantRouteMiddleware, controller.listFarms);
router.get('/farms/:id', ...tenantRouteMiddleware, controller.getFarm);
router.get('/farms/:id/rating', ...tenantRouteMiddleware, controller.getFarmRating);
router.patch('/farms/:id', ...tenantRouteMiddleware, controller.updateFarm);
router.post('/farms/:id/close', ...tenantRouteMiddleware, controller.closeFarm);
router.delete('/farms/:id', ...tenantRouteMiddleware, controller.deleteFarm);

module.exports = router;
