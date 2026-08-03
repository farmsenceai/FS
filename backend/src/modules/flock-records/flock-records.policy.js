const { canAccess } = require('../../shared/auth/roleAccess');

const canCreateFlockRecord = (user, _businessId, farmId) =>
  canAccess(user, { farmId, requireWrite: true });
const canReadFlockRecords = (user, _businessId, farmId) =>
  canAccess(user, { farmId, requireWrite: false });

module.exports = { canCreateFlockRecord, canReadFlockRecords };
