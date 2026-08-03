const { isAdmin, isBusiness } = require('../../shared/auth/roleAccess');
const canWriteBatchExpenses = isAdmin;
function canReadBatchExpenses(user) { return isAdmin(user) || isBusiness(user); }
module.exports = { canWriteBatchExpenses, canReadBatchExpenses };
