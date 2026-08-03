function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.statusCode = status;
  return error;
}

function resolveBusinessId(user) {
  if (!user) return null;

  const activeMembership = user.activeMembership;
  if (activeMembership && typeof activeMembership === 'object') {
    return activeMembership.businessId || activeMembership.organizationId || null;
  }

  return user.businessId || user.organizationId || null;
}

/**
 * Explicit tenant-context middleware factory.
 *
 * The current auth middleware attaches decoded JWT claims with `userId`,
 * `email`, `authMethod`, and `role`. It does not yet include a business claim,
 * so tenant-required routes will return 400 until a membership/business context
 * is added by a later phase. Hydrated future users using `_id` or `id` are also
 * supported without changing today's auth contract.
 */
function requireTenantContext({ requireBusinessId = true } = {}) {
  return async function attachTenantContext(req, res, next) {
    if (!req.user) {
      return next(httpError(403, 'Authentication required'));
    }

    const userId = req.user._id || req.user.userId || req.user.id;
    const role = req.user.role;
    if (role === 'business') {
      req.tenant = { userId, role: 'business' };
      return next();
    }
    let businessId = resolveBusinessId(req.user);
    if (requireBusinessId && (role === 'farmer' || role === 'admin') && !businessId) {
      const farmId = req.params?.farmId || (req.path?.startsWith('/farms/') ? req.params?.id : null);
      if (farmId) {
        const farm = await Farm.findById(farmId).select('businessId').lean().exec();
        businessId = farm?.businessId || null;
      }
    }

    if (requireBusinessId && !businessId && role !== 'farmer' && role !== 'admin') {
      return next(httpError(400, 'No active business context'));
    }

    req.tenant = {
      businessId: businessId || null,
      userId,
      role
    };

    return next();
  };
}

module.exports = requireTenantContext;
const Farm = require('../modules/farms/farms.model');
