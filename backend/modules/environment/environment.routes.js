const express = require('express');
const authMiddleware = require('../auth/auth.middleware');
const controller = require('./environment.controller');
const router = express.Router();

function requireEnvironmentRole(req, res, next) { if (!['admin', 'business'].includes(req.user?.role)) return res.status(403).json({ success: false, message: 'Environment access requires a business or admin role' }); return next(); }
function requireFarmerRole(req, res, next) { if (req.user?.role !== 'farmer') return res.status(403).json({ success: false, message: 'Farmer environment access requires a farmer role' }); return next(); }
router.use(authMiddleware);
router.get('/farmer/summary', requireFarmerRole, controller.getFarmerSummary);
router.get('/farmer/readings', requireFarmerRole, controller.getFarmerReadings);
router.post('/farmer/readings', requireFarmerRole, controller.createFarmerReading);
router.put('/farmer/readings/:id', requireFarmerRole, controller.updateFarmerReading);
router.delete('/farmer/readings/:id', requireFarmerRole, controller.deleteFarmerReading);
router.get('/dashboard', requireEnvironmentRole, controller.getDashboard);
router.get('/parameters', requireEnvironmentRole, controller.getParameters);
router.put('/parameters/:id', requireEnvironmentRole, controller.updateParameter);
router.get('/readings', requireEnvironmentRole, controller.getReadings);
router.post('/readings', requireEnvironmentRole, controller.createReading);
router.put('/readings/:id', requireEnvironmentRole, controller.updateReading);
router.delete('/readings/:id', requireEnvironmentRole, controller.deleteReading);
router.get('/alerts', requireEnvironmentRole, controller.getAlerts);
router.put('/alerts/:id/read', requireEnvironmentRole, controller.markAlertRead);
router.get('/records', requireEnvironmentRole, controller.getRecords);
router.get('/records/:id/download', requireEnvironmentRole, controller.downloadRecord);
router.get('/report/download', requireEnvironmentRole, controller.downloadReport);
module.exports = router;
