const projectsService = require('./projects.service');

function handleError(res, err, fallbackMessage) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  return res.status(500).json({ error: fallbackMessage, details: err.message });
}

async function getOverview(req, res) {
  try {
    const overview = await projectsService.getOverview();
    res.json(overview);
  } catch (err) {
    handleError(res, err, 'Failed to load overview');
  }
}

async function getManagers(req, res) {
  try {
    const managers = await projectsService.getManagers(req.query.limit);
    res.json(managers);
  } catch (err) {
    handleError(res, err, 'Failed to fetch managers');
  }
}

async function createManager(req, res) {
  try {
    const manager = await projectsService.createManager(req.body);
    res.status(201).json(manager);
  } catch (err) {
    handleError(res, err, 'Failed to add manager');
  }
}

async function getAssignments(req, res) {
  try {
    const assignments = await projectsService.getAssignments(req.query.limit);
    res.json(assignments);
  } catch (err) {
    handleError(res, err, 'Failed to fetch assignments');
  }
}

async function getSiteVisits(req, res) {
  try {
    const visits = await projectsService.getSiteVisits(req.query.limit);
    res.json(visits);
  } catch (err) {
    handleError(res, err, 'Failed to fetch site visits');
  }
}

async function getActivities(req, res) {
  try {
    const activities = await projectsService.getActivities(req.query.limit);
    res.json(activities);
  } catch (err) {
    handleError(res, err, 'Failed to fetch activities');
  }
}

module.exports = {
  createManager,
  getActivities,
  getAssignments,
  getManagers,
  getOverview,
  getSiteVisits
};
