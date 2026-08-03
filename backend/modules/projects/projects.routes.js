const express = require('express');
const authMiddleware = require('../auth/auth.middleware');
const projectsController = require('./projects.controller');

const router = express.Router();

function requireProjectDashboardRole(req, res, next) {
  if (!['admin', 'business'].includes(req.user?.role)) {
    return res.status(403).json({ msg: 'Project dashboard access requires a business or admin role' });
  }

  return next();
}

router.use(authMiddleware, requireProjectDashboardRole);

router.get('/overview', projectsController.getOverview);
router.get('/managers', projectsController.getManagers);
router.post('/managers', projectsController.createManager);
router.get('/assignments', projectsController.getAssignments);
router.get('/site-visits', projectsController.getSiteVisits);
router.get('/activities', projectsController.getActivities);

module.exports = router;
