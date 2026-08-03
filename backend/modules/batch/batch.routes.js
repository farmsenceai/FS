const express = require('express');
const authMiddleware = require('../auth/auth.middleware');
const batchController = require('./batch.controller');

const router = express.Router();

function requireBatchRole(req, res, next) {
  if (!['admin', 'business'].includes(req.user?.role)) {
    return res.status(403).json({ msg: 'Batch management access requires a business or admin role' });
  }

  return next();
}

function requireFarmerRole(req, res, next) {
  if (req.user?.role !== 'farmer') {
    return res.status(403).json({ msg: 'Farmer batch access requires a farmer role' });
  }
  return next();
}

router.use(authMiddleware);

router.get('/farmer/summary', requireFarmerRole, batchController.getFarmerSummary);
router.get('/farmer/batches', requireFarmerRole, batchController.getFarmerBatches);
router.post('/farmer/batches', requireFarmerRole, batchController.createFarmerBatch);
router.put('/farmer/batches/:id', requireFarmerRole, batchController.updateFarmerBatch);
router.delete('/farmer/batches/:id', requireFarmerRole, batchController.deleteFarmerBatch);

router.get('/overview', requireBatchRole, batchController.getOverview);
router.get('/batches', requireBatchRole, batchController.getBatches);
router.post('/batches', requireBatchRole, batchController.createBatch);
router.get('/operations', requireBatchRole, batchController.getOperations);
router.get('/alerts', requireBatchRole, batchController.getAlerts);
router.get('/inventory', requireBatchRole, batchController.getInventory);
router.get('/farms', requireBatchRole, batchController.getFarms);
router.get('/performance', requireBatchRole, batchController.getPerformance);

module.exports = router;
