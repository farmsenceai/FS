const jwt = require('jsonwebtoken');
const User = require('../../models/User');

async function authMiddleware(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Your session has expired. Please sign in again.' });
    }

    return res.status(401).json({ msg: 'Token is not valid' });
  }

  try {
    const user = await User.findById(decoded.userId).select('role accountStatus').lean();
    if (!user) return res.status(401).json({ msg: 'Account no longer exists' });
    const status = user.accountStatus || 'active';
    if (user.role === 'farmer' && status !== 'active') {
      const messages = {
        pending: 'Your farmer account is awaiting administrator approval.',
        rejected: 'Your farmer account was not approved. Please contact an administrator.',
        suspended: 'Your farmer account is suspended. Please contact an administrator.'
      };
      return res.status(403).json({
        code: `ACCOUNT_${status.toUpperCase()}`,
        msg: messages[status] || 'Your farmer account is not active.'
      });
    }
    req.user = { ...decoded, role: user.role };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authMiddleware;
