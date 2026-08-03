const express = require('express');
const authMiddleware = require('../auth/auth.middleware');
const controller = require('./feed-water.controller');

const router = express.Router();

function requireFeedWaterRole(req, res, next) {
  if (!['admin', 'business'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Feed & Water access requires a business or admin role' });
  }
  return next();
}

function requireFarmerRole(req, res, next) {
  if (req.user?.role !== 'farmer') {
    return res.status(403).json({ success: false, message: 'Farmer Feed & Water access requires a farmer role' });
  }
  return next();
}

router.use(authMiddleware);
router.get('/farmer/summary', requireFarmerRole, controller.getFarmerSummary);
router.get('/farmer/logs', requireFarmerRole, controller.getFarmerLogs);
router.post('/farmer/logs', requireFarmerRole, controller.createFarmerLog);
router.put('/farmer/logs/:id', requireFarmerRole, controller.updateFarmerLog);
router.delete('/farmer/logs/:id', requireFarmerRole, controller.deleteFarmerLog);
router.post('/farmer/inventory', requireFarmerRole, controller.reportFarmerInventory);

router.get('/dashboard', requireFeedWaterRole, controller.getDashboard);
router.get('/batches', requireFeedWaterRole, controller.getBatches);
router.post('/batches', requireFeedWaterRole, controller.createBatch);
router.put('/batches/:id', requireFeedWaterRole, controller.updateBatch);
router.delete('/batches/:id', requireFeedWaterRole, controller.deleteBatch);
router.get('/inventory', requireFeedWaterRole, controller.getInventory);
router.post('/inventory', requireFeedWaterRole, controller.createInventory);
router.put('/inventory/:id', requireFeedWaterRole, controller.updateInventory);
router.delete('/inventory/:id', requireFeedWaterRole, controller.deleteInventory);
router.get('/water-systems', requireFeedWaterRole, controller.getWaterSystems);
router.put('/water-systems/:id', requireFeedWaterRole, controller.updateWaterSystem);
router.get('/alerts', requireFeedWaterRole, controller.getAlerts);
router.put('/alerts/:id/read', requireFeedWaterRole, controller.markAlertRead);
router.get('/report/download', requireFeedWaterRole, controller.downloadReport);

module.exports = router;
