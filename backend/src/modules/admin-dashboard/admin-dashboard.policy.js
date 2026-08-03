function isPlatformAdmin(user) {
  return user?.platformRole === 'admin' || user?.role === 'admin';
}

function requirePlatformAdmin(req, res, next) {
  if (!isPlatformAdmin(req.user)) {
    return res.status(403).json({ error: 'Access denied: Admin only' });
  }
  return next();
}

module.exports = { isPlatformAdmin, requirePlatformAdmin };
