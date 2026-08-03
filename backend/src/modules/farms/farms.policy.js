const { isAdmin, isBusiness, isFarmer, canAccess } = require('../../shared/auth/roleAccess');

const canCreateFarm = isAdmin;
async function canReadFarm(user, _businessId, farm) {
  const farmId = farm?._id || farm?.id || farm?.farmId || farm;
  if (!farmId) return isAdmin(user) || isBusiness(user) || isFarmer(user);
  return canAccess(user, { farmId, requireWrite: false });
}
const canUpdateFarm = isAdmin;
const canDeleteFarm = isAdmin;

module.exports = { canCreateFarm, canReadFarm, canUpdateFarm, canDeleteFarm };
