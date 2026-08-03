const express = require('express');
const authMiddleware = require('../auth/auth.middleware');
const controller = require('./performance.controller');
const router = express.Router();
function requirePerformanceRole(req, res, next) { if (!['admin', 'business'].includes(req.user?.role)) return res.status(403).json({ success: false, message: 'Performance access requires a business or admin role' }); return next(); }
router.use(authMiddleware, requirePerformanceRole);
router.get('/dashboard', controller.getDashboard);
router.get('/batches', controller.getBatches);
router.get('/trend', controller.getTrend);
router.post('/batches', controller.createBatch);
router.put('/batches/:id', controller.updateBatch);
router.delete('/batches/:id', controller.deleteBatch);
router.get('/batches/:id/report', controller.downloadBatchReport);
router.get('/drivers', controller.getDrivers);
router.get('/recommendations', controller.getRecommendations);
router.put('/recommendations/:id', controller.updateRecommendation);
router.get('/report/download', controller.downloadReport);
module.exports = router;
