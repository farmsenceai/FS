const { isAdmin, isBusiness } = require('../../shared/auth/roleAccess');

const canReadManagers = user => isAdmin(user) || isBusiness(user);
const canWriteManagers = isAdmin;

module.exports = { canReadManagers, canWriteManagers };
