const express = require('express');
const auth = require('../../../modules/auth/auth.middleware');
const controller = require('./farmer-fees.controller');
const router = express.Router();

router.use(auth);
router.post('/farmer-fees', controller.createFee);
router.get('/farmer-fees', controller.listFees);
router.get('/farmer-fees/summary', controller.getSummary);
router.get('/farmer-fees/:id', controller.getFee);
router.patch('/farmer-fees/:id', controller.updateFee);
router.post('/farmer-fees/:id/mark-paid', controller.markPaid);
router.delete('/farmer-fees/:id', controller.cancelFee);

module.exports = router;
