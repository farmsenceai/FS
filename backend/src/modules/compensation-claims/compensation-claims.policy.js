const { actorId, isAdmin, isBusiness, isFarmer, hasActiveFarmAssignment } = require('../../shared/auth/roleAccess');

const canReview = user => isAdmin(user) || isBusiness(user);
const canListAll = canReview;
const canSubmit = async (user, farmId) =>
  isFarmer(user) && hasActiveFarmAssignment(actorId(user), farmId);
const canReadOwn = (user, claim) =>
  isFarmer(user) && String(actorId(user)) === String(claim?.farmerId);
const canMutateOwnPending = (user, claim) =>
  canReadOwn(user, claim) && claim?.status === 'pending';

module.exports = { canReview, canListAll, canSubmit, canReadOwn, canMutateOwnPending };
