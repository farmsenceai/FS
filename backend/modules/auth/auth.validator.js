const VALID_ROLES = ['admin', 'farmer', 'business'];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function normalizeRole(role) {
  if (role === 'administrator') return 'admin';
  if (VALID_ROLES.includes(role)) return role;
  return null;
}

function normalizePhone(phone) {
  const value = String(phone || '').trim();
  if (!value) return '';

  const hasPlus = value.startsWith('+');
  const digits = value.replace(/\D/g, '');
  if (!digits || digits.length < 7) return '';

  return `${hasPlus ? '+' : ''}${digits}`;
}

function getPhoneAuthEmail(phone) {
  const normalized = normalizePhone(phone);
  const emailSafePhone = normalized.replace(/^\+/, 'plus-');
  return `phone-${emailSafePhone}@phone.farmsence.local`;
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include uppercase, lowercase, and number characters';
  }

  return null;
}

function validateRegister(req, res, next) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = req.body.password;
  const role = normalizeRole(req.body.role);

  if (!isValidEmail(email)) {
    return res.status(400).json({ msg: 'Please enter a valid email address' });
  }

  if (!role) {
    return res.status(400).json({ msg: 'Please select a valid role before creating an account' });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ msg: passwordError });
  }

  req.validatedAuth = { email, password, role };
  return next();
}

function validateLogin(req, res, next) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = req.body.password;
  const role = normalizeRole(req.body.role);

  if (!isValidEmail(email)) {
    return res.status(400).json({ msg: 'Please enter a valid email address' });
  }

  if (!password) {
    return res.status(400).json({ msg: 'Password is required' });
  }

  req.validatedAuth = { email, password, role };
  return next();
}

function validatePhoneSend(req, res, next) {
  const phone = normalizePhone(req.body.phone);
  if (!phone) {
    return res.status(400).json({ msg: 'Please enter a valid phone number' });
  }

  req.validatedAuth = { phone };
  return next();
}

function validatePhoneVerification(req, res, next) {
  const phone = normalizePhone(req.body.phone);
  const otp = String(req.body.otp || '').trim();
  const role = normalizeRole(req.body.role);

  if (!phone || !otp) {
    return res.status(400).json({ msg: 'Phone and OTP are required' });
  }

  if (!role) {
    return res.status(400).json({ msg: 'Please select a valid role before signing in.' });
  }

  req.validatedAuth = { phone, otp, role };
  return next();
}

function validateOAuthRole(req, res, next) {
  const role = normalizeRole(req.query.role);
  if (!role) {
    return res.status(400).json({ msg: 'Please select a valid role before signing in.' });
  }

  req.validatedAuth = { role };
  return next();
}

module.exports = {
  getPhoneAuthEmail,
  normalizePhone,
  normalizeRole,
  validateLogin,
  validateOAuthRole,
  validatePhoneSend,
  validatePhoneVerification,
  validateRegister
};
