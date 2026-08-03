const { actorId, isAdmin, isBusiness, isFarmer } = require('../../shared/auth/roleAccess');

const canCreateFee = isAdmin;
const canUpdateFee = isAdmin;
const canMarkPaid = isAdmin;
const canDeleteFee = isAdmin;
function canReadFee(user, fee) {
  if (isAdmin(user) || isBusiness(user)) return true;
  return isFarmer(user) && String(actorId(user)) === String(fee?.farmerId);
}
const canListFees = user => isAdmin(user) || isBusiness(user) || isFarmer(user);

module.exports = { canCreateFee, canUpdateFee, canMarkPaid, canDeleteFee, canReadFee, canListFees };
