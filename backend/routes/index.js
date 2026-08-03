const express = require('express');
const router = express.Router();

// Import Routes
const contactRoutes = require('./contact.routes');
const demoRoutes = require('./demo.routes');

// Use Routes
router.use('/contact', contactRoutes);
router.use('/demo', demoRoutes);

module.exports = router;