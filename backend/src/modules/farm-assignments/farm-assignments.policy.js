const { actorId, isAdmin, isBusiness } = require('../../shared/auth/roleAccess');

const canCreateAssignment = isAdmin;
const canEndAssignment = isAdmin;
const canListFarmAssignments = user => isAdmin(user) || isBusiness(user);
const canListUserAssignments = (user, userId) =>
  isAdmin(user) || isBusiness(user) || String(actorId(user)) === String(userId);

module.exports = {
  canCreateAssignment,
  canEndAssignment,
  canListFarmAssignments,
  canListUserAssignments
};
