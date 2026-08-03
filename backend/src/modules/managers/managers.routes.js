const express = require('express');
const auth = require('../../../modules/auth/auth.middleware');
const requireTenantContext = require('../../middleware/tenantContext');
const controller = require('./managers.controller');

const router = express.Router();
const access = [auth, requireTenantContext({ requireBusinessId: false })];
router.post('/managers', ...access, controller.createManager);
router.get('/managers', ...access, controller.listManagers);
router.get('/managers/performance', ...access, controller.getPerformanceRatings);
router.get('/managers/:id', ...access, controller.getManager);
router.patch('/managers/:id', ...access, controller.updateManager);
router.delete('/managers/:id', ...access, controller.deleteManager);
router.post('/farms/:farmId/managers', ...access, controller.assignManager);
router.get('/farms/:farmId/managers', ...access, controller.listFarmManagers);
router.post('/farms/:farmId/managers/:assignmentId/end', ...access, controller.endManagerAssignment);
router.get('/managers/:id/farms', ...access, controller.listManagerFarms);

module.exports = router;
