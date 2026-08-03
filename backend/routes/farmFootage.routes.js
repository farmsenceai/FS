const express = require('express');
const authMiddleware = require('../modules/auth/auth.middleware');
const { getFarmFootage } = require('../services/farmFootage.service');

const router = express.Router();

router.get('/', authMiddleware, async (_req, res) => {
  const result = await getFarmFootage();
  // The service caches Pixabay upstream results for 24 hours. Do not let the
  // browser retain an old camera ordering after configuration changes.
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, ...result });
});

module.exports = router;
