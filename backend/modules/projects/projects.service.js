const Manager = require('../../models/Manager');
const ProjectAssignment = require('../../models/ProjectAssignment');
const SiteVisit = require('../../models/SiteVisit');
const Activity = require('../../models/Activity');
const TaskOverview = require('../../models/TaskOverview');

async function getOverview() {
  const [totalManagers, activeProjects, completedProjects, teamAgg, ratingAgg, taskOverview] =
    await Promise.all([
      Manager.countDocuments(),
      ProjectAssignment.countDocuments({ status: { $ne: 'Completed' } }),
      ProjectAssignment.countDocuments({ status: 'Completed' }),
      Manager.aggregate([{ $group: { _id: null, total: { $sum: '$teamSize' } } }]),
      Manager.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
      TaskOverview.findOne({ key: 'singleton' })
    ]);

  const totalTeamMembers = teamAgg[0]?.total || 0;
  const avgRating = ratingAgg[0]?.avg ? Number(ratingAgg[0].avg.toFixed(1)) : 0;

  return {
    stats: {
      totalManagers,
      activeProjects,
      completedProjects,
      totalTeamMembers,
      avgRating
    },
    taskOverview: taskOverview || {
      completed: 0,
      inProgress: 0,
      delayed: 0,
      pending: 0,
      notStarted: 0
    }
  };
}

function getLimit(queryLimit) {
  return parseInt(queryLimit, 10) || 0;
}

async function getManagers(limitValue) {
  const limit = getLimit(limitValue);
  let query = Manager.find().sort({ createdAt: 1 });
  if (limit) query = query.limit(limit);
  return query;
}

async function createManager({ name, email, phone, role, teamSize }) {
  if (!name || !email || !phone) {
    const err = new Error('name, email and phone are required');
    err.status = 400;
    throw err;
  }

  const existing = await Manager.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    const err = new Error('A manager with this email already exists');
    err.status = 409;
    throw err;
  }

  const manager = await Manager.create({
    name,
    email,
    phone,
    role: role || '',
    teamSize: Number(teamSize) || 0,
    projectsCount: 0,
    performancePct: 0,
    rating: 0
  });

  await Activity.create({
    title: `New manager ${manager.name} added to the team`,
    by: 'By System',
    type: 'system'
  });

  return manager;
}

async function getAssignments(limitValue) {
  const limit = getLimit(limitValue);
  let query = ProjectAssignment.find().populate('manager', 'name initials').sort({ startDate: -1 });
  if (limit) query = query.limit(limit);
  return query;
}

async function getSiteVisits(limitValue) {
  const limit = getLimit(limitValue);
  let query = SiteVisit.find().populate('manager', 'name initials').sort({ visitDate: 1 });
  if (limit) query = query.limit(limit);
  return query;
}

async function getActivities(limitValue) {
  const limit = getLimit(limitValue);
  let query = Activity.find().sort({ createdAt: -1 });
  if (limit) query = query.limit(limit);
  return query;
}

module.exports = {
  createManager,
  getActivities,
  getAssignments,
  getManagers,
  getOverview,
  getSiteVisits
};
