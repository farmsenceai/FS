const express = require('express');
const authMiddleware = require('../auth/auth.middleware');
const controller = require('./birds-health.controller');

const router = express.Router();

function requireBirdHealthRole(req, res, next) {
  if (!['admin', 'business'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Birds Health access requires a business or admin role' });
  }
  return next();
}

function requireFarmerRole(req, res, next) {
  if (req.user?.role !== 'farmer') return res.status(403).json({ success: false, message: 'Farmer Birds Health access requires a farmer role' });
  return next();
}

router.use(authMiddleware);
router.get('/farmer/summary', requireFarmerRole, controller.getFarmerSummary);
router.get('/farmer/events', requireFarmerRole, controller.getFarmerEvents);
router.post('/farmer/events', requireFarmerRole, controller.createFarmerEvent);
router.put('/farmer/events/:id', requireFarmerRole, controller.updateFarmerEvent);
router.delete('/farmer/events/:id', requireFarmerRole, controller.deleteFarmerEvent);

router.get('/dashboard', requireBirdHealthRole, controller.getDashboard);
router.get('/cases', requireBirdHealthRole, controller.getCases);
router.post('/cases', requireBirdHealthRole, controller.createCase);
router.put('/cases/:id', requireBirdHealthRole, controller.updateCase);
router.delete('/cases/:id', requireBirdHealthRole, controller.deleteCase);

router.get('/vaccinations', requireBirdHealthRole, controller.getVaccinations);
router.post('/vaccinations', requireBirdHealthRole, controller.createVaccination);
router.put('/vaccinations/:id', requireBirdHealthRole, controller.updateVaccination);

router.get('/alerts', requireBirdHealthRole, controller.getAlerts);
router.put('/alerts/:id/read', requireBirdHealthRole, controller.markAlertRead);

router.get('/records', requireBirdHealthRole, controller.getRecords);
router.get('/records/:id/download', requireBirdHealthRole, controller.downloadRecord);

module.exports = router;
