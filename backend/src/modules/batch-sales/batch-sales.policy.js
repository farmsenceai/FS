const { isAdmin, isBusiness } = require('../../shared/auth/roleAccess');

const canWriteBatchSales = isAdmin;
function canReadBatchSales(user) { return isAdmin(user) || isBusiness(user); }

module.exports = { canWriteBatchSales, canReadBatchSales };
