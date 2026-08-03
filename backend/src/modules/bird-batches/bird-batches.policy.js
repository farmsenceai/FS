const { isAdmin, canAccess } = require('../../shared/auth/roleAccess');

async function canCreateBatch(user) {
  return isAdmin(user);
}
async function canReadBatch(user, _businessId, farmId) {
  return canAccess(user, { farmId, requireWrite: false });
}
const canUpdateBatch = isAdmin;
const canCreateFlockRecord = async (user, _businessId, farmId) =>
  canAccess(user, { farmId, requireWrite: true });

module.exports = { canCreateBatch, canReadBatch, canUpdateBatch, canCreateFlockRecord };
