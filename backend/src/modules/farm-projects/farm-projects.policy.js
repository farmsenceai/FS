const { isAdmin, isBusiness } = require('../../shared/auth/roleAccess');
const canReadFarmProjects = user => isAdmin(user) || isBusiness(user);
const canWriteFarmProjects = isAdmin;
module.exports = { canReadFarmProjects, canWriteFarmProjects };
