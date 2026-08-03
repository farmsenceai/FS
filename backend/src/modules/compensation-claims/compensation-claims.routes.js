const express = require('express');
const auth = require('../../../modules/auth/auth.middleware');
const tenant = require('../../middleware/tenantContext');
const controller = require('./compensation-claims.controller');
const router = express.Router();

router.get('/compensation-claims/mine/summary', auth, controller.summary);
router.get('/compensation-claims/mine', auth, controller.mine);
router.post('/farms/:farmId/batches/:batchId/compensation-claims', auth, tenant(), controller.create);
router.patch('/farms/:farmId/batches/:batchId/compensation-claims/:id', auth, tenant(), controller.updateMine);
router.delete('/farms/:farmId/batches/:batchId/compensation-claims/:id', auth, tenant(), controller.deleteMine);
router.get('/compensation-claims', auth, controller.reviewList);
router.patch('/compensation-claims/:id/review', auth, controller.review);

module.exports = router;
