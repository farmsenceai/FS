const { actorId, isAdmin } = require('../../shared/auth/roleAccess');

const canManageMemberships = isAdmin;
const canListMemberships = isAdmin;
const canEditMembership = (actorUser, membership) =>
  isAdmin(actorUser) && String(actorId(actorUser)) !== String(membership?.userId);

module.exports = { canManageMemberships, canListMemberships, canEditMembership };
