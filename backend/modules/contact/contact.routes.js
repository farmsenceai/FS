const express = require('express');
const authMiddleware = require('../auth/auth.middleware');
const contactController = require('./contact.controller');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin access required' });
  }

  return next();
}

router.post('/submit', contactController.submitContact);
router.get('/all', authMiddleware, requireAdmin, contactController.getAllContacts);

module.exports = router;
