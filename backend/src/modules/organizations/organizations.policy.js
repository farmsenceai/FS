const { isAdmin, isBusiness } = require('../../shared/auth/roleAccess');

const canCreateOrganization = isAdmin;
const canReadOrganization = user => isAdmin(user) || isBusiness(user);
const canUpdateOrganization = isAdmin;
const canDeleteOrganization = isAdmin;
const canListOrganizations = user => isAdmin(user) || isBusiness(user);

module.exports = {
  isPlatformAdmin: isAdmin,
  canCreateOrganization,
  canReadOrganization,
  canUpdateOrganization,
  canDeleteOrganization,
  canListOrganizations
};
