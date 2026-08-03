const FarmAssignment = require('../../modules/farm-assignments/farm-assignments.model');

function actorId(user) {
  return user?._id || user?.userId || user?.id;
}

function isAdmin(user) {
  return user?.role === 'admin' || user?.platformRole === 'admin';
}

function isBusiness(user) {
  return user?.role === 'business';
}

function isFarmer(user) {
  return user?.role === 'farmer';
}

async function hasActiveFarmAssignment(userId, farmId) {
  if (!userId || !farmId) return false;
  const assignment = await FarmAssignment.exists({
    userId,
    farmId,
    status: 'active',
    deletedAt: null
  });
  return Boolean(assignment);
}

async function canAccess(user, { farmId, requireWrite = false } = {}) {
  if (isAdmin(user)) return true;
  if (isBusiness(user)) return !requireWrite;
  if (!isFarmer(user) || !farmId) return false;
  return hasActiveFarmAssignment(actorId(user), farmId);
}

module.exports = {
  actorId,
  isAdmin,
  isBusiness,
  isFarmer,
  hasActiveFarmAssignment,
  canAccess
};
