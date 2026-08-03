const { isAdmin, canAccess } = require('../../shared/auth/roleAccess');

const canCreateFacility = isAdmin;
async function canReadFacility(user, _businessId, facility) {
  return canAccess(user, { farmId: facility?.farmId, requireWrite: false });
}
const canUpdateFacility = isAdmin;
const canDeleteFacility = isAdmin;

module.exports = { canCreateFacility, canReadFacility, canUpdateFacility, canDeleteFacility };
