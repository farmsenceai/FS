const express = require('express');
const auth = require('../../../modules/auth/auth.middleware');
const controller = require('./business-dashboard.controller');
const router = express.Router();
router.get('/business-dashboard', auth, controller.get);
module.exports = router;
